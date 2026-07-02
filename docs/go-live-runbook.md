# Go-Live Runbook

This runbook turns the local standalone repo into the live
`tools.complyeaze.com` deployment.

## Preconditions

- GitHub repository: public `lamemustafa/complyeaze-tools`.
- GitHub Actions secret: `TOOLS_PROD_KUBECONFIG_B64` containing the production
  namespace-scoped deployer kubeconfig. Do not use a workstation kubeconfig that
  depends on `doctl` or another local exec credential plugin.
- GHCR package: public `ghcr.io/lamemustafa/complyeaze-tools`.
- Cluster: ingress-nginx installed, `letsencrypt-prod` ClusterIssuer ready.
- DNS: `tools.complyeaze.com` points to the production ingress address.

## Local Checks

```bash
git status --short --branch
pnpm install --frozen-lockfile
pnpm verify
pnpm preflight:live -- --image-digest sha256:<published-image-digest>
kubectl kustomize deploy/k8s/overlays/production >/tmp/complyeaze-tools.yaml
kubectl get clusterissuer letsencrypt-prod
dig +short tools.complyeaze.com
```

`pnpm preflight:live` is read-only. It checks GitHub auth/repo access, Docker,
published image pullability, DNS, cert-manager, the production Kustomize render,
deploy-secret presence, and namespace existence.

The production render must include:

- `Namespace/complyeaze-tools`
- `Ingress/tools.complyeaze.com`
- `NetworkPolicy/complyeaze-tools-deny-egress`
- digest-pinned image reference
- no `imagePullSecrets`, `envFrom`, database, Redis, or application secrets

## Remote Setup

```bash
gh auth status
gh repo create lamemustafa/complyeaze-tools --public --source . --remote origin --push
```

If the repo already exists:

```bash
git remote add origin git@github.com:lamemustafa/complyeaze-tools.git
git push -u origin tapish-codex/tools-v0
```

Open a PR to `main`, wait for CI, merge, then run the `Publish Image` workflow.

## Production Promotion

Apply deploy access once before the first GitHub Actions deployment:

```bash
kubectl apply -k deploy/k8s/deploy-access
```

Generate `TOOLS_PROD_KUBECONFIG_B64` from the
`complyeaze-tools-deployer-token` service-account token, then set it with:

```bash
gh secret set TOOLS_PROD_KUBECONFIG_B64 --repo lamemustafa/complyeaze-tools --body "<base64-kubeconfig>"
```

1. Copy the digest printed by `Publish Image`; it must match
   `sha256:[0-9a-f]{64}`.
2. Run `Deploy Production` with that digest.
3. Wait for rollout:

   ```bash
   kubectl -n complyeaze-tools rollout status deployment/complyeaze-tools --timeout=180s
   ```

4. Verify the live host:

   ```bash
   curl -I https://tools.complyeaze.com/
   curl -I https://tools.complyeaze.com/-/health
   ```

5. Confirm cert-manager created `complyeaze-tools-tls`:

   ```bash
   kubectl -n complyeaze-tools get secret complyeaze-tools-tls
   ```

Do not promote a mutable tag or manually edit the live deployment image outside
the digest-pinned workflow.
