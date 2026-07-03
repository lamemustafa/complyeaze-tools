# Cloudflare IaC

This directory is the intended Terraform home for the `tools.complyeaze.com`
Cloudflare edge configuration.

It is deliberately scoped to the tools subdomain only. Do not add apex
`complyeaze.com`, `pack.complyeaze.com`, root ComplyEaze app, Pack, analytics,
Zaraz, Workers, Pages, R2, or redirect ownership here.

## Ownership Rules

- Import existing dashboard-managed Cloudflare resources before any
  `terraform apply`.
- Keep Terraform state outside git. Use a private remote backend or an ignored
  local state file during migration.
- Authenticate with `CLOUDFLARE_API_TOKEN` from the shell or a secret manager.
  Do not commit provider tokens, zone IDs, account IDs, state, or `.tfvars`.
- Review every plan manually. This repo must not add an automatic Cloudflare
  apply workflow until imported state, rollback, and reviewer controls are
  proven.
- Keep every ruleset expression constrained to `tools.complyeaze.com`.

## Migration Sequence

1. Create a Cloudflare API token with the minimum zone-scoped permissions needed
   for DNS and ruleset reads/writes.
2. Export `CLOUDFLARE_API_TOKEN` locally.
3. Import the existing DNS record and any existing cache/WAF rules that already
   affect `tools.complyeaze.com`.
4. Run `terraform plan` and confirm the plan is a no-op or the exact intended
   change.
5. Apply only after a reviewed PR updates this directory and the plan has been
   attached to the PR or deployment notes.

Example commands after the current resource IDs are known:

```bash
terraform init
terraform import cloudflare_dns_record.tools "<zone_id>/<record_id>"
terraform plan -var "cloudflare_zone_id=<zone_id>" -var "tools_origin_target=174.138.123.141"
```

## Configured Surfaces

- `dns.tf`: proxied `tools.complyeaze.com` DNS record.
- `cache.tf`: long edge/browser cache for immutable Astro assets under
  `/_astro/`.
- `waf.tf`: host-scoped custom WAF rule to block non-standard edge ports on the
  tools host.

External uptime monitoring is intentionally documented in
`docs/uptime-monitoring.md` rather than configured here until the chosen monitor
provider and alert recipients are known.
