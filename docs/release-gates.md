# Release Gates

Run the full repo verification before a public deploy:

```bash
pnpm install --frozen-lockfile
pnpm audit:high
pnpm verify
```

Policy scans are part of `pnpm verify`, but can be run individually:

```bash
pnpm scan:copy
pnpm scan:fixtures
pnpm scan:cloudflare:iac
pnpm scan:k8s
pnpm scan:runtime-network
pnpm scan:source-freshness
pnpm scan:source-register
pnpm build
pnpm scan:built-runtime-network
```

Deployment should use a reviewed image digest. Do not promote a build if source
metadata is stale, public copy includes banned claims, fixture scans fail, or the
runtime gains data network APIs. The final published image must also pass Trivy
HIGH/CRITICAL scanning and upload SARIF evidence from
`.github/workflows/publish-image.yml`.

`main` must be protected before production promotion. Required branch controls
are listed in `docs/branch-protection.md`; the required CI check name is
`verify` and the required review-findings status context is `Review gate`.

To go live:

1. Create/push the reviewed commit to the public
   `lamemustafa/complyeaze-tools` repository.
2. Run `Publish Image` on the reviewed commit.
3. Make the GHCR package public, or the cluster will be unable to pull the
   image because the workload intentionally has no image-pull secret.
4. Copy the printed `sha256:...` digest.
5. Copy the reviewed source commit SHA that produced the published image.
6. Run `Deploy Production` with that source SHA and digest after
   `TOOLS_PROD_KUBECONFIG_B64`, ingress-nginx, cert-manager, and DNS are
   verified.

`TOOLS_PROD_KUBECONFIG_B64` must use the namespace-scoped
`complyeaze-tools-deployer` ServiceAccount from `deploy/k8s/deploy-access`, not
a local admin kubeconfig. Rotate it with `docs/deploy-credential-rotation.md`.

CodeQL and dependency-review workflows run independently from `verify` because
they depend on GitHub code scanning and dependency graph services. Keep them as
required or reviewer-visible checks once GitHub exposes their stable check names
for this repository.

Cloudflare edge configuration lives under `infra/cloudflare` as import-first
Terraform. Do not apply it until the existing dashboard-managed DNS/cache/WAF
state has been imported and the plan is attached to the deployment notes.

Use `docs/go-live-runbook.md` for the exact live cutover checks and
`docs/uptime-monitoring.md` for external monitor targets.

## CSP Direction

Production currently allows first-party inline script/style blocks because Astro
islands and JSON-LD emit inline bootstrap content in the static build. Keep
`connect-src 'none'` and `script-src-attr 'none'` as hard backstops. The long-term
target is to replace `unsafe-inline` with generated hashes or nonce-aware edge
handling after a browser-verified design proves Astro hydration, JSON-LD, and
Cloudflare security checks still work.
