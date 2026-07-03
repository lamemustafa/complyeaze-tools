@AGENTS.md

## Claude Code

This addendum is Claude-Code-specific context layered on top of `AGENTS.md`
(the authoritative, tool-agnostic policy surface, imported above). Codex is
the primary engineering harness for this repo; treat `AGENTS.md` and any
nested `AGENTS.md` files as the source of truth for policy, and treat this
file (and any nested `CLAUDE.md`) as routing and mechanics for Claude Code
specifically.

### Repo shape, concretely

`AGENTS.md` names the top-level directories but is intentionally thin on what
each package actually does. For a cold start:

- `apps/site` (`@complyeaze-tools/site`) is the whole product: one `.astro`
  page per tool under `src/pages/` (currently the MSME 45-day payment due-date
  calculator, GSTR-2B purchase reconciliation triage, GSTR-2B missing-invoice
  vendor follow-up, AIS/Form 26AS mismatch checker, GST portal issue evidence
  memo, plus `privacy/review-copy-builder.astro` and the index/privacy/
  security/source/status/changelog pages). `src/components/ToolShell.astro`
  wraps every tool's chrome; `src/islands/ToolWorkbench.tsx` (with
  `tool-workbench-logic.ts`) is the interactive React island mounted per tool;
  `src/lib/tools.ts` and `src/lib/public-url.ts` are shared helpers.
- `packages/core` is pure domain logic per tool, no runtime dependencies:
  `csv.ts`, `msme.ts`, `gstr2b-reconciliation.ts`, `gstr2b-follow-up.ts`,
  `ais.ts`, `gst-portal-evidence.ts`.
- `packages/artifacts` builds the plain-text output artifacts users copy out
  (`text.ts` + `index.ts`).
- `packages/parsers` holds input-parsing helpers and depends on `core`.
- `packages/safety` holds `identifiers.ts` (regex-based PAN/GSTIN/TAN masking,
  e.g. `[PAN masked]`) and `spreadsheet.ts` (export/formula-injection safety).
- `packages/source-register` is the compliance/legal backbone: `types.ts`
  (`ToolMeta`/`ToolSource` shapes), `tools.ts` (every published tool's full
  metadata — slug, SEO fields, audience, privacy mode, supported inputs,
  unsupported cases, output artifacts, official government sources with
  URL/publisher/jurisdiction/review-date/stale-after-days, related tools, Axal
  upsell copy), `claims.ts` (the banned-claims list and
  `STANDARD_TRUST_COPY` — read this file directly, it has drifted from any
  summary written elsewhere and will drift again), and `validation.ts`. This
  package is consumed by both the UI and the compliance review process —
  treat it as the single most legally sensitive package in the repo.
- `packages/ui-react` is shared React primitives, early-stage/thin.
- `deploy/docker` has a 2-stage Dockerfile (`node:22-alpine` builder ->
  `nginxinc/nginx-unprivileged` bookworm runtime, both digest-pinned) plus
  `nginx.conf` (strict CSP, security headers, `/-/health`, GET/HEAD-only).
- `deploy/k8s/base` has namespace (restricted Pod Security Standard),
  deployment (2 replicas, non-root UID 101, read-only filesystem, no
  capabilities, readiness/liveness probes on `/-/health`), service, ingress
  (cert-manager TLS), network-policy (default-deny egress).
- `deploy/k8s/deploy-access` is a separate least-privilege
  ServiceAccount+Role+RoleBinding scoped to the deploy pipeline only, with no
  secrets access.
- `deploy/k8s/overlays/{staging,production}` are kustomize overlays
  re-namespacing and re-hosting the base.
- `infra/cloudflare` holds the Cloudflare DNS/cache/WAF Terraform for
  `tools.complyeaze.com` (`dns.tf`, `cache.tf`, `waf.tf`, `versions.tf`);
  `pnpm scan:cloudflare:iac` checks it.

### `pnpm verify` is not the full gate list

Read `package.json` directly before relying on this — it changes. As of this
worktree, the composite script is:

```
verify = typecheck && lint && test && scan:source-freshness
          && scan:cloudflare:iac && build && scan:built-runtime-network
```

That means `pnpm verify` (and therefore the required CI job also named
`verify`, which runs `pnpm audit:high` then `pnpm verify`) does **not** run
`scan:k8s`, `scan:copy`, `scan:fixtures`, or `scan:source-register`. Those four
must be run individually whenever a change could touch them (Kubernetes
manifests/RBAC, public copy, fixtures, or source-register metadata,
respectively) — do not treat a green `pnpm verify` as covering them. Full
current script names live in `package.json`; run the smallest relevant gate
first, then broaden, per the order in `AGENTS.md`.

The remaining gates not folded into `verify` — `pnpm scan:k8s` (wraps
`tests/config/tools-kubernetes.test.ts`), `pnpm scan:copy` (wraps
`tests/policy/copy-claims.test.ts`), `pnpm scan:fixtures` (wraps
`tests/policy/fixtures.test.ts`), and `pnpm scan:source-register` (wraps
`tests/source-register/tools-meta.test.ts`) — map onto the review matrix in
`AGENTS.md`: run `scan:k8s` for deployment/Docker/Kubernetes/Actions changes,
`scan:copy` for privacy/security copy or public support surfaces, `scan:
source-register` (plus `scan:source-freshness`) for tool metadata/statutory
language/source URLs, and `scan:fixtures` for any change touching test data
under `tests/` or fixtures shipped with a tool. When in doubt about whether a
change needs one of these, prefer running it — they are read-only and fast.

### Nested CLAUDE.md files

- `apps/site/CLAUDE.md` — Astro/React island conventions, per-tool page
  structure, `ToolShell`/`ToolWorkbench` wiring, and the copy/trust-line
  requirements for anything under `src/pages/`.
- `packages/source-register/CLAUDE.md` — how to add or edit a `ToolMeta`
  entry, the shape of `ToolSource`, and the review discipline around
  `claims.ts` and stale-after policies.
- `deploy/CLAUDE.md` — Docker base-image and Kubernetes/RBAC conventions
  shared by `deploy/docker` and `deploy/k8s`.

Read the nested file for the directory you're editing before making changes;
it takes precedence over this root file for anything specific to that
subtree.

### Subagents

- `deploy-hardener` — triggers proactively on changes under `deploy/`.
  Specializes in Docker base-image bumps and Kubernetes manifest/RBAC changes;
  knows to update `tests/config/docker-static.test.ts` and
  `tests/config/tools-kubernetes.test.ts` in lockstep with any Dockerfile or
  `role.yaml` change, to run `pnpm scan:k8s`, and to check
  `deploy/k8s/deploy-access/role.yaml` verbs whenever
  `deploy-production.yml`'s smoke-test steps change.
- `compliance-copy-reviewer` — triggers proactively on changes to
  `apps/site` copy, `packages/source-register`, or any public-facing page.
  Specializes in reviewing copy and source-register entries against the
  banned-claims list and source-freshness policy, running `pnpm scan:copy`,
  `pnpm scan:source-register`, and `pnpm scan:source-freshness` before
  anything ships.

### Skills

- `docker-base-image-bump` — the checklist for safely updating
  `deploy/docker/Dockerfile`'s base images: digest-pin only (never a floating
  tag), update the matching digest-pin assertions in
  `tests/config/docker-static.test.ts` in the same change, consciously decide
  whether the `apt-get upgrade` layer is still needed, re-verify the
  `HEALTHCHECK` after any base swap. Manual-invocation only
  (`disable-model-invocation: true`) since it touches the production runtime
  image — invoke it explicitly rather than expecting it to trigger itself.
- `deploy-smoke-check` — the checklist for verifying or extending the
  production smoke test in `deploy-production.yml`, including checking
  `deploy/k8s/deploy-access/role.yaml` verbs first before adding any new curl
  or port-forward step. Manual-invocation only
  (`disable-model-invocation: true`) since it concerns production deploy
  verification.
- `new-tool-launch` — end-to-end checklist for adding a new browser tool: a
  `ToolMeta` entry in `packages/source-register` with a real official source,
  a `.astro` page under `apps/site`, workbench logic, synthetic-only
  fixtures, then the full gate list before merge. Normal low-risk content
  workflow; left at default invocation.

### Recurring pain points worth remembering

- **Docker base-image churn** and **K8s deploy-access RBAC gaps** are both
  documented in full in `deploy/CLAUDE.md` (the canonical restatement,
  including the current verb table and digest-pin assertion strings) — see
  that file rather than a copy here, since it drifts. Short version: any
  future Docker base-image change must stay digest-pinned, update
  `tests/config/docker-static.test.ts` in the same commit, and re-verify the
  `HEALTHCHECK` (see the `docker-base-image-bump` skill); any change to what
  `deploy-production.yml`'s smoke-test step curls or port-forwards must check
  `deploy/k8s/deploy-access/role.yaml`'s verbs first, then update
  `tests/config/tools-kubernetes.test.ts` in lockstep (see the
  `deploy-smoke-check` skill).
- **Runtime-network-zero enforcement.** `tests/policy/runtime-network.test.ts`
  and `tests/policy/built-runtime-network.test.ts` (via `pnpm
  scan:runtime-network` / `pnpm scan:built-runtime-network`) enforce that tool
  code makes zero fetch/XHR/WebSocket/beacon calls at runtime. This is easy to
  violate by accident while "improving" a tool — any change to
  `packages/core`, `packages/parsers`, or the workbench islands should be
  checked against this before it's considered done.

### This repo moves fast — verify, don't recall

This repo evolves through frequent automated PRs (release-please-style
hotfixes, dependency bumps, base-image swaps, RBAC patches). Package
versions, script names, workflow contents, and exact gate lists in this file
can go stale. Before relying on any version, tag, script name, or gate list —
here or in a nested CLAUDE.md — re-read the actual file (`package.json`,
`deploy/docker/Dockerfile`, `.github/workflows/*.yml`,
`deploy/k8s/deploy-access/role.yaml`) rather than trusting memory or this
document. Treat everything above as "true as of last verification," not as a
standing guarantee.
