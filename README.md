# ComplyEaze Tools

Browser-local draft tools for first-pass Indian compliance review.

Files are processed in your browser. No account or file upload is required.
The site may receive normal web request metadata when serving pages and static
assets. Cloudflare security checks may also process browser/security signals on
public page requests. Tool files are not intentionally sent to ComplyEaze by
these tools.

## Launch Surface

- `tools.complyeaze.com`
- Static Astro site
- Browser-local parsing and artifact generation
- Kubernetes static container only

## Tool Index

| Tool | Workflow | Supported input | Output | Source posture |
| --- | --- | --- | --- | --- |
| MSME Payables Age Triage | MSME payables review | Pasted CSV/TSV payables rows with optional agreement, objection, payment, open-balance, dispute, Udyam evidence, and Udyam registration date columns | Candidate review marker draft, missing-facts checklist, Udyam request text, management review note | MSME Samadhaan and DC-MSME sources reviewed |
| GSTR-2B Purchase Reconciliation Triage | Reconciliation triage | Pasted purchase-register and GSTR-2B rows with optional invoice date, document type, amendment table, ITC availability, and IMS status columns | Exception bucket summary, ITC/IMS context flags, supplier follow-up basis, review checklist | GSTR-2B manual reviewed |
| GSTR-2B Missing Invoice Follow-up Generator | Vendor follow-up | Pasted supplier issue rows with optional GSTIN, invoice date, period, document type, taxable value, tax amount, and escalation columns | Supplier-wise issue packet, email draft, WhatsApp-ready summary | GSTR-2B manual reviewed |
| AIS and Form 26AS Mismatch Checker | Tax information review | Pasted AIS/Form 26AS comparison rows with optional deductor, TAN, section, income category, TDS/TCS, amount in books, mismatch category, and review action columns | Mismatch category table, review checklist, deductor-wise verification draft | Income Tax AIS/TDS sources reviewed |
| GST Portal Issue Evidence Memo Builder | Portal issue evidence | Manual attempt timestamps, error labels, notes, complaint references, screenshot hash references, browser/device context, and retry context | Attempt timeline, client note, retry checklist, user-entered evidence reference checklist | GST self-service complaint portal reviewed |
| Review Copy Builder | Privacy-conscious handoff | Plain text | Masked review draft and review footer | DPDP Act source reviewed |

Each tool creates a local working artifact for review. It does not provide legal
advice, tax advice, filing advice, final compliance conclusions, or portal
automation.

Use `https://tools.complyeaze.com` for one-off drafts. Use Axal at
`https://complyeaze.com/axal` when the same work needs clients, saved mappings,
documents, assignments, credential-safe workflows, review history, and audit
trails.

## Trust Surface

- Source code: `https://github.com/lamemustafa/complyeaze-tools`
- Security policy: `SECURITY.md` and `https://tools.complyeaze.com/security/`
- Privacy posture: `docs/privacy-local-first.md` and
  `https://tools.complyeaze.com/privacy/`
- Terms and disclaimer: `https://tools.complyeaze.com/terms/`
- Source register: `packages/source-register` and
  `https://tools.complyeaze.com/source/`
- Release gates: `docs/release-gates.md`
- Deploy credential rotation: `docs/deploy-credential-rotation.md`
- External uptime monitoring: `docs/uptime-monitoring.md`
- Cloudflare IaC scaffold: `infra/cloudflare`
- Third-party license inventory: `docs/third-party-licenses.md`

Search and AI crawlers may index public static pages, `robots.txt`,
`sitemap.xml`, and `llms.txt`. Pasted tool inputs and generated drafts are not
published content and must not be placed in public issues, examples, screenshots,
or fixtures.

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
