---
name: docker-base-image-bump
description: Checklist for safely bumping the base images in deploy/docker/Dockerfile (the node:22-alpine builder stage and/or the nginxinc/nginx-unprivileged runtime stage). This changes what actually runs in production, so only invoke it when a person explicitly asks for a base-image bump — do not trigger it automatically.
disable-model-invocation: true
---

# Docker base-image bump

`deploy/docker/Dockerfile` builds the only image this repo ships
(`ghcr.io/lamemustafa/complyeaze-tools`, published by `.github/workflows/publish-image.yml`
and deployed by `.github/workflows/deploy-production.yml`). Its base images have churned
repeatedly (alpine tag -> floating `mainline` tag -> pinned bookworm/debian tag, plus an
`apt-get upgrade` layer added for OS-level CVE patching), and that churn has caused
multiple hotfixes. Follow this checklist in order for any change to either `FROM` line.

## 1. Digest-pin only — never a floating tag

Every `FROM` line must resolve to an exact, fully-qualified digest:

```
FROM <image>:<tag>@sha256:<digest>
```

Never land a bare tag (`nginx:mainline`, `node:22-alpine`, `node:22-alpine-latest`, etc.)
even temporarily. Floating tags are exactly what caused the original churn — they drift
under you with no diff to review.

To resolve a fresh digest for a tag:

```bash
docker pull <image>:<tag>
docker inspect --format='{{index .RepoDigests 0}}' <image>:<tag>
```

Cross-check the digest against the vendor's published image (Docker Hub / GHCR page) before
trusting a locally cached pull.

## 2. Update the Dockerfile and the test assertions together, in the same change

`tests/config/docker-static.test.ts` asserts on literal substrings from the Dockerfile. See
`deploy/CLAUDE.md` ("Docker: digest-pinning discipline") for the current assertion strings
— read that file and `docker-static.test.ts` directly rather than trusting a copy here,
since it drifts. If you bump a tag (e.g. the nginx-unprivileged bookworm line -> a newer
release, or a distro switch), update the corresponding `toContain(...)` assertion in the
same commit as the Dockerfile change. A Dockerfile change that lands without a matching
test update is the single most common way this has broken before — do not split them
across commits.

## 3. Consciously decide on the `apt-get upgrade` layer

The runtime stage currently runs:

```dockerfile
USER root
RUN apt-get update \
  && apt-get upgrade -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*
USER 101
```

This exists to pick up OS-level CVE patches on the Debian-based `nginx-unprivileged`
image. For every base-image bump, explicitly decide — don't just carry it forward blindly:

- Still on a Debian/Ubuntu-based image (e.g. `-bookworm`, `-trixie`)? Keep the
  `apt-get upgrade` layer, and make sure `USER root` / `USER 101` still bracket it
  correctly and `rm -rf /var/lib/apt/lists/*` still runs to avoid bloating the layer.
- Switching to an Alpine-based runtime image? `apt-get` does not exist there — replace the
  layer with the Alpine equivalent (`apk update && apk upgrade --no-cache`) or drop it if
  the base image's own release cadence is trusted, and say so explicitly in the PR
  description.
- Either way, re-verify `USER 101` (or whatever the non-root UID is on the new base) is
  still valid after the switch — some images use a different unprivileged UID.

## 4. Re-verify the HEALTHCHECK still passes

The HEALTHCHECK hits the app's own health endpoint:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1:8080/-/health || exit 1
```

After swapping a base image, `wget` may not exist on the new image (common on minimal
distroless-style bases) or the port/path may need to change. Concretely:

```bash
docker build -f deploy/docker/Dockerfile -t complyeaze-tools:base-bump-check .
docker run --rm -d -p 8080:8080 --name base-bump-check complyeaze-tools:base-bump-check
sleep 2
docker inspect --format='{{.State.Health.Status}}' base-bump-check
curl -i http://127.0.0.1:8080/-/health
docker stop base-bump-check
```

Confirm the health status reaches `healthy` and the curl returns 200 before moving on.

## 5. Re-run the gates

After the Dockerfile and test file are both updated:

```bash
pnpm scan:k8s
pnpm test
```

`pnpm scan:k8s` runs `tests/config/tools-kubernetes.test.ts` — it won't catch Dockerfile
regressions directly, but base-image changes are frequently bundled with other
`deploy/` changes, so run it as a matter of habit whenever anything under `deploy/`
moves. `pnpm test` runs the full Vitest suite, which includes
`tests/config/docker-static.test.ts` and will fail loudly if the Dockerfile and test
assertions drifted apart.

Do not consider the bump done until both the local Docker health check (step 4) and
`pnpm test` are green.
