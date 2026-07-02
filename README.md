# ComplyEaze Tools

Private browser tools that turn messy Indian compliance records into
review-ready action packs.

Files are processed in your browser. No account or file upload is required.
The site may receive normal web request metadata when serving pages and static
assets; tool files are not intentionally sent to ComplyEaze by these tools.

## Launch Surface

- `tools.complyeaze.com`
- Static Astro site
- Browser-local parsing and artifact generation
- Kubernetes static container only

## Initial Tools

- MSME 45-Day Payment Due Date Calculator
- GSTR-2B Missing Invoice Follow-up Generator
- AIS and Form 26AS Mismatch Checker
- GST Portal Issue Evidence Memo Builder
- Review Copy Builder

Each tool creates a local working artifact for review. It does not provide legal
advice, tax advice, filing advice, final compliance conclusions, or portal
automation.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Deployment

See `docs/k8s-deployment.md`. The Kubernetes runtime serves static files only
and must not receive application secrets, database credentials, Redis
credentials, service account tokens, or egress access.

Use `docs/go-live-runbook.md` for the first `tools.complyeaze.com` cutover.
