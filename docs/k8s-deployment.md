# Kubernetes Deployment

`tools.complyeaze.com` is deployed as a static site container. It must remain
separate from the root ComplyEaze Next.js app and from Pack.

## Runtime Boundary

- Static files are built by Astro and served by nginx on port `8080`.
- No application server, database, Redis, queue, object storage, or app secret is
  mounted into the workload.
- Pods run as non-root with a read-only root filesystem and
  `automountServiceAccountToken: false`.
- The production namespace is declared in the manifest set for admin bootstrap.
  GitHub Actions drops that namespace document and applies only namespace-scoped
  workload resources.
- The GHCR package should be public. The workload intentionally has no
  image-pull secret dependency.
- Egress is denied by default through `deploy/k8s/base/network-policy.yaml`.
- Ingress exposes only `tools.complyeaze.com` with its own TLS secret.
- GitHub deploy access is isolated in `deploy/k8s/deploy-access` as a
  namespace-scoped ServiceAccount, Role, and RoleBinding. Do not store a local
  `doctl` exec-plugin kubeconfig in GitHub Actions secrets.

## Image Flow

The Dockerfile builds `apps/site/dist` and copies it into the static nginx
image. `.github/workflows/publish-image.yml` pushes to GHCR and prints the
published image digest. Production promotion must use that digest through
`.github/workflows/deploy-production.yml`, not a mutable tag in the live cluster.

The base manifest contains an all-zero digest placeholder so accidental manual
applies do not silently deploy a mutable tag. The deploy workflow replaces it
with the reviewed digest before applying manifests.

## Deploy Access

Apply deploy access once from an admin workstation after the namespace exists:

```bash
kubectl apply -k deploy/k8s/deploy-access
```

Then create `TOOLS_PROD_KUBECONFIG_B64` from the
`complyeaze-tools-deployer-token` service-account token. Rotate it by deleting
and recreating that token secret, then updating the GitHub Actions secret.

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
