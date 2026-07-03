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
- This Terraform package may manage the `tools.complyeaze.com` DNS record. It
  must not declare `cloudflare_ruleset` zone phase resources unless the whole
  Cloudflare phase is intentionally imported and represented in this repo's
  state. The cache and WAF files are reviewed host-specific snippets only.

## Migration Sequence

1. Create a Cloudflare API token with the minimum zone-scoped permissions needed
   for DNS and ruleset reads/writes.
2. Export `CLOUDFLARE_API_TOKEN` locally.
3. Import the existing DNS record. Treat existing cache/WAF rules as
   dashboard-managed unless a separate reviewed migration imports and preserves
   every rule in the target Cloudflare phase.
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
- `cache.tf`: host-specific cache rule snippet for immutable Astro assets under
  `/_astro/`. It is not an applied Terraform resource.
- `waf.tf`: host-specific custom WAF rule snippet to block non-standard edge
  ports on the tools host. It is not an applied Terraform resource.

External uptime monitoring is intentionally documented in
`docs/uptime-monitoring.md` rather than configured here until the chosen monitor
provider and alert recipients are known.
