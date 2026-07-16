# deploy/ — Claude Code notes

Scope: `deploy/docker` (image + nginx config) and `deploy/k8s` (base manifests,
deploy-access RBAC, staging/production overlays). This repo's K8s footprint
hosts ONLY the static `apps/site` container — never reuse the root ComplyEaze
Next.js image, Pack's host policy, app secrets, DB/Redis env vars, Prisma
migration jobs, RBAC seed jobs, or worker manifests. Fully isolated infra by
design.

Read the actual files before editing anything here — this area evolves via
automated PRs and the digest pins below drift.

## Docker: digest-pinning discipline

`deploy/docker/Dockerfile` is currently:
- Builder: `node:24-alpine@sha256:a0b9bf06...` — installs with
  `pnpm install --frozen-lockfile`, runs `pnpm build`.
- Runtime: `nginxinc/nginx-unprivileged:1.29-bookworm@sha256:593a17dc...` —
  root briefly to `apt-get update && apt-get upgrade -y` (OS CVE patching),
  then drops back to `USER 101`.

Both `FROM` lines must always be fully-qualified with a `@sha256:...` digest.
Never point either stage at a floating tag (`alpine`, `mainline`, `latest`,
`1.29-bookworm` without a digest, etc.).

**Lesson (recurring pain point — has caused multiple hotfixes):** the
nginx-unprivileged runtime base has been swapped repeatedly (alpine tag ->
floating "mainline" tag -> pinned bookworm/debian tag), and the apt-get
upgrade layer was added afterward for OS-level CVE patching. Whenever you
touch either base image:
1. Use a fully-qualified digest-pinned tag — never a floating tag.
2. Update `deploy/docker/Dockerfile` and the matching assertions in
   `tests/config/docker-static.test.ts` (currently
   `expect(dockerfile).toContain("FROM node:24-alpine@sha256:")` and
   `expect(dockerfile).toContain("FROM nginxinc/nginx-unprivileged:1.29-bookworm@sha256:")`)
   in the **same change**. A digest bump with no matching test update is the
   classic way this breaks.
3. Consciously decide whether the `apt-get upgrade` layer is still needed
   (this matters for Debian/bookworm-based images; an Alpine swap likely
   drops it, or replaces it with `apk upgrade`).
4. Re-verify the `HEALTHCHECK` (`curl -fsS http://127.0.0.1:8080/-/health`)
   still passes after any base swap — a base change can alter what's on
   `PATH` or how the image handles signals.

`deploy/docker/nginx.conf` carries the CSP, security headers, `/-/health`
endpoint, and GET/HEAD-only enforcement (`limit_except GET HEAD { deny all; }`
per location). Treat CSP relaxations (e.g. touching `unsafe-inline` /
`unsafe-eval` / `connect-src`) as requiring a reviewed design plus test
evidence, per the repo-wide non-negotiables — `connect-src 'none'` in
particular backs the runtime-network-zero guarantee.

## Kubernetes: least-privilege deploy-access pattern

`deploy/k8s/deploy-access/` defines a dedicated ServiceAccount + Role +
RoleBinding for the deploy pipeline only — separate from the app's own
`deployment.yaml` (which itself runs with `automountServiceAccountToken: false`).
This ServiceAccount has explicitly no secrets access. Current `role.yaml`
verbs:
- `services`: get/list/watch/create/update/patch
- `pods`: get/list
- `pods/portforward`: create
- `deployments` (apps): get/list/watch/create/update/patch
- `ingresses`, `networkpolicies` (networking.k8s.io): get/list/watch/create/update/patch

**Lesson (recurring pain point — has caused multiple hotfixes):** several
hotfixes were needed because this Role didn't originally grant what the
production smoke-test step in `deploy-production.yml` actually needed (the
`pods` get/list and `pods/portforward` create verbs above exist *because of*
that history). Whenever the "Service smoke checks" step in
`.github/workflows/deploy-production.yml` changes what it curls,
port-forwards, or otherwise calls against the cluster:
1. Check `deploy/k8s/deploy-access/role.yaml` verbs FIRST — don't wait for a
   failed workflow run to discover a missing permission.
2. Update `tests/config/tools-kubernetes.test.ts` in lockstep — it asserts on
   the literal `resources: [...]` strings in `role.yaml` (services, pods,
   pods/portforward, deployments, ingresses/networkpolicies). A verb added to
   `role.yaml` without a matching test update (or vice versa) means the test
   suite isn't actually guarding the thing that broke production before.

## The two-workflow split

- **`publish-image.yml`** (`.github/workflows/publish-image.yml`): triggered
  on push to master or manual dispatch. Builds the image with
  `docker/build-push-action`, runs Trivy (HIGH/CRITICAL, os+library,
  ignore-unfixed, `exit-code: 1` — a scan failure blocks the push), uploads
  SARIF, then pushes to `ghcr.io/lamemustafa/complyeaze-tools:<sha>` and
  resolves+outputs the immutable digest. This is where provenance/SBOM-style
  supply-chain evidence for a given commit is produced.
- **`deploy-production.yml`**: `workflow_dispatch`-only, requires explicit
  `source_sha` and `image_digest` inputs (regex-validated). It does NOT trust
  the caller — it runs `gh run list --workflow publish-image.yml --commit
  <source_sha> --status success` and greps the returned `headSha` to confirm
  a real successful publish run produced that commit, then
  `docker buildx imagetools inspect` to confirm the digest actually resolves
  in the registry, before touching the cluster. Only after both checks pass
  does it configure kubeconfig, render manifests, and apply.

Never propose collapsing these into one workflow or skipping the
digest/commit verification step — it's the control that stops an unreviewed
or unscanned image from ever reaching production.

## Placeholder-digest substitution

`deploy/k8s/base/deployment.yaml` hardcodes a placeholder image reference
(`ghcr.io/lamemustafa/complyeaze-tools@sha256:000...000`, 64 zeros) that is
never applied as-is. `deploy-production.yml`'s "Render digest-pinned
manifests" step copies `deploy/k8s` to a temp dir and runs a small Python
regex substitution
(`ghcr\.io/lamemustafa/complyeaze-tools@sha256:[0-9a-f]{64}` -> the real
`IMAGE_REF`) that asserts exactly one replacement occurred before running
`kubectl kustomize` on the production overlay. If you ever change the image
repo name, the placeholder digest format, or add a second container/image
reference in `deployment.yaml`, update this regex and its `count=1` assertion
together, or the substitution will silently no-op or replace the wrong thing.

A later step also asserts it drops exactly one `Namespace` document
(`complyeaze-tools`) from the rendered output before `kubectl apply`, since
namespace creation is bootstrap-only and not part of routine deploys.

## Before touching anything here

Run (at minimum) `pnpm scan:k8s`, and re-check
`tests/config/docker-static.test.ts` / `tests/config/tools-kubernetes.test.ts`
directly rather than assuming they still say what this file says — they are
the ground truth, this file is a map to them.
