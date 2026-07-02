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
pnpm scan:source-register
pnpm scan:runtime-network
```

If browser behavior changes, verify with Playwright or a real browser that no
runtime data network calls occur and only same-origin static GET/HEAD asset
requests are made.
