# Uptime Monitoring

ComplyEaze Tools needs external monitoring because deploy smoke checks only
prove the site immediately after rollout. Monitoring must check the public
Cloudflare/TLS path, not only Kubernetes service health.

## Required Monitors

Create HTTPS monitors for:

| Target | Expected result |
| --- | --- |
| `https://tools.complyeaze.com/` | HTTP 200 and page body contains `ComplyEaze Tools` |
| `https://tools.complyeaze.com/-/health` | HTTP 200 and exact body `ok` |
| `https://tools.complyeaze.com/gstr-2b-purchase-reconciliation-triage/` | HTTP 200 and no `:8080` redirect |
| `https://tools.complyeaze.com/sanchika/` | HTTP 200 and page body contains `Sanchika` |
| `https://tools.complyeaze.com/sitemap.xml` | HTTP 200 and body contains `https://tools.complyeaze.com` |
| `https://tools.complyeaze.com/site.webmanifest` | HTTP 200 and `application/manifest+json` content type |

Use Cloudflare Health Checks, Better Stack, UptimeRobot, or another external
provider that can alert outside GitHub Actions. GitHub scheduled curl checks are
acceptable only as a backup because they do not provide independent alerting or
incident routing.

## Alerting

- Alert at least two maintainers or one maintainer plus an operations mailbox.
- Page on three consecutive failures or five minutes of continuous failure.
- Warn on TLS expiry under 14 days, unexpected 3xx to `:8080`, 4xx/5xx, body
  mismatch, or manifest content-type mismatch.
- Do not send pasted tool inputs, generated drafts, identifiers, or screenshots
  to the monitoring provider.

## Incident Workflow

1. Check the monitor location and error class.
2. Run:

   ```bash
   pnpm preflight:live -- --image-digest sha256:<current-deployed-digest>
   ```

3. Inspect the latest `Deploy Production` and `Publish Image` runs.
4. Check DNS and Cloudflare edge status.
5. Check Kubernetes rollout and ingress status from an admin workstation.
6. If `/sanchika/` returns `403` while the deploy workflow service smoke passed,
   capture response headers such as `cf-ray` and review Cloudflare security
   events before changing Kubernetes.
7. If the failure is caused by a bad deploy, redeploy the previous reviewed
   digest through `Deploy Production`; do not mutate the live deployment by hand.

## Public Status Page Boundary

`/status/` may describe controls and monitoring coverage, but it must not claim
real-time uptime until an external monitor is configured and linked. The page may
say deploy smoke checks and live preflight exist because those are repo-owned
verification gates.
