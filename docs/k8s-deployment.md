# Kubernetes Deployment

`tools.complyeaze.com` is deployed as a static site container. It must remain
separate from the root ComplyEaze Next.js app and from Pack.

## Runtime Boundary

- Static files are built by Astro and served by nginx on port `8080`.
- No application server, database, Redis, queue, object storage, or app secret is
  mounted into the workload.
- Pods run as non-root with a read-only root filesystem and
  `automountServiceAccountToken: false`.
- The production namespace is declared in the manifest set and bootstrapped by
  the production deploy workflow before apply.
- The GHCR package should be public. The workload intentionally has no
  image-pull secret dependency.
- Egress is denied by default through `deploy/k8s/base/network-policy.yaml`.
- Ingress exposes only `tools.complyeaze.com` with its own TLS secret.

## Image Flow

The Dockerfile builds `apps/site/dist` and copies it into the static nginx
image. `.github/workflows/publish-image.yml` pushes to GHCR and prints the
published image digest. Production promotion must use that digest through
`.github/workflows/deploy-production.yml`, not a mutable tag in the live cluster.

The base manifest contains an all-zero digest placeholder so accidental manual
applies do not silently deploy a mutable tag. The deploy workflow replaces it
with the reviewed digest before applying manifests.

## Preflight

Run these before applying manifests:

```bash
pnpm verify
pnpm scan:k8s
```

Then review the rendered manifest:

```bash
kubectl kustomize deploy/k8s/base
```
