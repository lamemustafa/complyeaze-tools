# Deploy Credential Rotation

`TOOLS_PROD_KUBECONFIG_B64` is the GitHub Actions secret used by
`.github/workflows/deploy-production.yml` to deploy the static tools workload.
It must contain only the namespace-scoped `complyeaze-tools-deployer` kubeconfig
from `deploy/k8s/deploy-access`.

## Cadence

- Rotate at least every 60 days.
- Rotate immediately after maintainer offboarding, suspected leak, failed
  secret handling, unexpected deploy activity, or broad GitHub permission
  change.
- Keep the recurring issue from `.github/workflows/deploy-credential-rotation.yml`
  open until validation passes.

## Rotation Steps

Run from an admin workstation with cluster-admin access:

```bash
kubectl -n complyeaze-tools delete secret complyeaze-tools-deployer-token
kubectl apply -k deploy/k8s/deploy-access
kubectl -n complyeaze-tools get secret complyeaze-tools-deployer-token
```

Build a kubeconfig that points to the production cluster, uses only the new
`complyeaze-tools-deployer-token`, and cannot mutate resources outside the
`complyeaze-tools` namespace. Store the base64 value in a protected local
environment variable or password manager prompt, then stream it to GitHub
without putting the secret value in the command line:

```bash
printf '%s' "$TOOLS_PROD_KUBECONFIG_B64" | gh secret set TOOLS_PROD_KUBECONFIG_B64 --repo lamemustafa/complyeaze-tools
```

## Validation

After updating the secret:

```bash
pnpm preflight:live -- --image-digest sha256:<current-deployed-digest>
```

Then run `Deploy Production` with the current reviewed source SHA and current
image digest. The workflow must be able to inspect the image, render manifests,
apply namespace-scoped workload resources, and complete the service smoke
checks.

## Emergency Revocation

If the secret may be exposed:

```bash
kubectl -n complyeaze-tools delete secret complyeaze-tools-deployer-token
gh secret delete TOOLS_PROD_KUBECONFIG_B64 --repo lamemustafa/complyeaze-tools
```

Do not recreate or set the secret until the GitHub repository, Actions audit
history, maintainer access, and cluster namespace are reviewed.

## Future Direction

Prefer GitHub OIDC or another short-lived credential path when the cluster
identity provider and reviewer controls are ready. Until then, this long-lived
token must stay namespace-scoped, manually rotated, and absent from logs,
issues, PRs, and local shell history.
