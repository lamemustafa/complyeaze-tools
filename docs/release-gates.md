# Release Gates

Run the full repo verification before a public deploy:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

Policy scans are part of `pnpm verify`, but can be run individually:

```bash
pnpm scan:copy
pnpm scan:fixtures
pnpm scan:k8s
pnpm scan:runtime-network
pnpm scan:source-register
```

Deployment should use a reviewed image digest. Do not promote a build if source
metadata is stale, public copy includes banned claims, fixture scans fail, or the
runtime gains data network APIs.

To go live:

1. Create/push the reviewed commit to the public
   `lamemustafa/complyeaze-tools` repository.
2. Run `Publish Image` on the reviewed commit.
3. Make the GHCR package public, or the cluster will be unable to pull the
   image because the workload intentionally has no image-pull secret.
4. Copy the printed `sha256:...` digest.
5. Run `Deploy Production` with that digest after
   `TOOLS_PROD_KUBECONFIG_B64`, ingress-nginx, cert-manager, and DNS are
   verified.

Use `docs/go-live-runbook.md` for the exact live cutover checks.
