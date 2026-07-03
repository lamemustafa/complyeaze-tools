# ComplyEaze Tools Agent Guide

ComplyEaze Tools is a standalone public repo for static, browser-local
compliance artifact builders at `tools.complyeaze.com`.

## Non-Negotiables

- Tools creates one-off local artifacts only. Axal owns persistence,
  collaboration, audit trails, recurring workflows, document vaults, and task
  assignment.
- Files must be processed in the browser. Do not add an application backend,
  API routes, accounts, database, analytics, telemetry, document upload, object
  storage, or root-app proxy.
- Do not add browser OCR, remote workers, remote WASM, remote fonts, third-party
  scripts, `unsafe-inline`, or `unsafe-eval` without a reviewed design and test
  evidence.
- Public copy must say "Files are processed in your browser. No account or file
  upload required." Do not say "zero data collection", "nothing leaves your
  device", "DPDP compliant", "forensic redaction", "filing-ready",
  "audit-proof", "CA verified", "official", or "government approved".
- Every statutory/compliance claim needs a source-register entry with an
  official source, review date, stale-after policy, and unsupported cases.
- Fixtures must be synthetic. Never commit real PAN, GSTIN, Aadhaar, bank
  account, taxpayer name, portal screenshots, notices, ledgers, invoices, local
  paths, or filenames.
- If Cloudflare or another edge security layer injects JavaScript or sets
  security cookies on the public host, disclose that on the privacy page and in
  `docs/privacy-local-first.md`. The tool runtime boundary still forbids sending
  pasted rows or generated drafts through application APIs.

## Repo Shape

- `apps/site` contains the Astro static site.
- `packages/source-register` owns tool metadata and source freshness.
- `packages/safety` owns redaction/masking/export safety helpers.
- `packages/artifacts`, `packages/core`, `packages/parsers`, and
  `packages/ui-react` must remain browser-safe and network-free.
- `deploy/docker` and `deploy/k8s` define static hosting only.

## Kubernetes Boundary

Kubernetes may host only a static site container. Mirror current ComplyEaze
infra conventions where they are verified, but do not reuse the root Next.js
image, Pack host-policy, app secrets, DB/Redis env, Prisma jobs, RBAC seed, or
worker manifests.

Tools pods must run non-root with a read-only filesystem, no service account
token, no app secrets, no PVC, and default-deny egress.

## Verification

Before declaring a change ready, run the smallest relevant gate, then broaden:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm scan:k8s
pnpm scan:copy
pnpm scan:fixtures
pnpm scan:cloudflare:iac
pnpm scan:source-freshness
pnpm scan:source-register
pnpm scan:runtime-network
pnpm build
pnpm scan:built-runtime-network
```

If browser behavior changes, verify with Playwright or a real browser that no
runtime data network calls occur and only same-origin static GET/HEAD asset
requests are made.

## Review Matrix

- Privacy/security copy, Cloudflare behavior, CSP, logs, cookies, or public
  support surfaces need a security/privacy review and copy-claim scan.
- Tool metadata, statutory language, source URLs, stale-after windows, or
  unsupported cases need source-register review and `pnpm scan:source-freshness`.
- Deployment, Docker, Kubernetes, GitHub Actions, or branch-protection changes
  need platform review, `pnpm scan:k8s`, and release-gate documentation updates.
- Cloudflare DNS/cache/WAF changes must stay under `infra/cloudflare`, remain
  scoped to `tools.complyeaze.com`, avoid committed state/secrets, and document
  import-first review before apply.
- Dependencies need a license/security review, `pnpm audit --audit-level high`,
  and a reason they preserve static browser-local operation.
- Public pages need metadata, sitemap, social image, internal-link, and
  accessibility review. Keep PNG social previews in sync with the SVG source.

The primary protected CI check name is `verify`; the protected review-findings
check name is `Review gate`. Do not rename either job without updating
`docs/branch-protection.md` and GitHub branch protection.

While this repo has only one eligible maintainer, branch protection should block
on required checks and unresolved review conversations, not on an approving
reviewer count. Treat Codex review comments as blocking when they create
current-head unresolved review threads or requested-changes reviews.
