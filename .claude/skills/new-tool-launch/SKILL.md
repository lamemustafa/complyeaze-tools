---
name: new-tool-launch
description: End-to-end checklist for adding a new browser-local compliance tool to tools.complyeaze.com — source-register metadata, the Astro page, workbench logic, synthetic fixtures, and the full pre-merge gate list. Normal, low-risk content workflow.
---

# New Tool Launch

Use this when adding a brand-new tool page to the site (not for editing an
existing tool's logic or copy only). Every step below is required before the
tool is considered mergeable — this repo has one human maintainer and an
automated review bot standing in as the second reviewer, so gaps here surface
as blocking review comments or, worse, ship a banned claim or a stale
statutory reference.

## 1. Confirm it belongs here

Tools = one-off, browser-local artifact builders only. If the idea involves
persistence, accounts, recurring workflows, document vaults, task assignment,
or an audit trail across sessions, it belongs in Axal, not here. Do not add a
backend, API route, database, analytics, or file upload to make it work.

## 2. Add the `ToolMeta` entry first

Before writing any UI, add an entry to `packages/source-register/src/tools.ts`
following the `ToolMeta` shape in `packages/source-register/src/types.ts`.
Required, non-optional pieces:

- `slug`, `h1`, `seoTitle`, `metaDescription`, `title`, `status` (start at
  `"landing"` or `"mvp"`), `audiences`.
- `privacyMode: "browser-only"`, `accountRequired: false`,
  `fileUploadRequired: false` (unless the tool genuinely needs client-side
  file parsing — still no upload to a server), `telemetry: "none"`.
- `supportedInputs`, `outputArtifacts`, and an honest `unsupportedCases` list —
  do not let the copy imply broader coverage than the logic actually handles.
- `officialSources`: at least one real `ToolSource` with a working
  government/official `url`, correct `publisher`, `jurisdiction: "IN"`,
  `lastReviewedAt` (today's review date), and a deliberately chosen
  `staleAfterDays`. Never fabricate or guess a source — if you can't verify an
  official source for the claim, the tool isn't ready to ship.
- `relatedSlugs` pointing at real existing slugs.
- `axalUpgradePath`: one line of honest upsell copy, not a feature promise.
- `seoDepth`: fill `inputGuide`, `exampleWorkflow`, `commonMistakes`,
  `reviewChecklist`, `sourceExplainer`, `faqItems` — thin/empty arrays here
  will likely fail SEO/content review even if tests pass.
- `trustCopy`: reuse `STANDARD_TRUST_COPY` from
  `packages/source-register/src/claims.ts` rather than re-typing the mandated
  disclosure. The literal sentence "Files are processed in your browser. No
  account or file upload required." (or the equivalent standard copy array)
  must appear on the page.
- `bannedClaims`: do not restate the banned list from memory — import/check
  against `BANNED_PUBLIC_CLAIMS` in `packages/source-register/src/claims.ts`
  directly, since that list changes independently of this skill.

## 3. Add the Astro page

Create `apps/site/src/pages/<slug>.astro` (slug without the leading `/`,
matching the `slug` field). Use `src/components/ToolShell.astro` for the page
chrome — do not hand-roll layout/nav/footer. Pull copy from the `ToolMeta`
entry rather than duplicating strings inline where possible, so source and
page can't drift.

## 4. Wire up the workbench logic

- Put pure domain logic in `packages/core` (new module or extend an existing
  one) — no runtime dependencies, no fetch/XHR/WebSocket calls.
- Put output-artifact generation (the copyable text/table the user exports)
  in `packages/artifacts`.
- Put input parsing in `packages/parsers` if the tool accepts pasted/uploaded
  text or CSV.
- Route any PAN/GSTIN/TAN-shaped values through `packages/safety`'s
  identifier maskers before they hit rendered output or exported artifacts.
- Mount the interactive piece as a React island via
  `src/islands/ToolWorkbench.tsx` (or a new sibling island), following the
  pattern of existing tool pages.
- Zero runtime network calls, ever — no fetch, XHR, WebSocket, or beacon calls
  from tool code. This is easy to violate by accident (e.g. adding a font
  fetch, an analytics snippet, or a "check latest rate" call) and is enforced
  by `scan:runtime-network` / `scan:built-runtime-network`, but treat it as a
  design constraint from the start, not a gate to fix at the end.

## 5. Fixtures: synthetic only

Any test fixtures, example inputs, or sample screenshots must be synthetic.
Never commit real PAN, GSTIN, Aadhaar, bank account numbers, taxpayer names,
portal screenshots, notices, ledgers, invoices, local file paths, or
filenames — including in test data, comments, or SEO example content.
`scan:fixtures` checks for this, but don't rely on the gate to catch it.

## 6. Run the full gate list before merge

Run these individually — `pnpm verify` does **not** cover all of them (as of
this writing it runs `typecheck && lint && test && scan:source-freshness &&
scan:cloudflare:iac && build && scan:built-runtime-network`; re-check
`package.json` since this composition drifts). For a new tool, run at least:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm scan:copy
pnpm scan:fixtures
pnpm scan:source-freshness
pnpm scan:source-register
pnpm scan:runtime-network
pnpm scan:built-runtime-network
```

Add `pnpm scan:k8s` and `pnpm scan:cloudflare:iac` only if you also touched
`deploy/` or `infra/cloudflare` — a new tool page normally shouldn't. If it
does, use the `deploy-hardener` subagent instead of doing that part solo.

## 7. Final read-through

Before calling it done, re-read the rendered page copy against
`BANNED_PUBLIC_CLAIMS` and the mandated trust copy one more time by eye — the
scans catch literal phrase matches, not every rephrasing.
