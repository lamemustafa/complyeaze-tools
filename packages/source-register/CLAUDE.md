# packages/source-register

This package is the compliance/legal backbone of the whole repo — the single
most legally sensitive package here. It is consumed both by the UI (every
tool page renders its `ToolMeta`) and by the compliance review process
(the scan gates below gate CI). Treat any edit here as a legal-copy change,
not a routine code change.

## Files

- `src/types.ts` — the `ToolMeta` / `ToolSource` contract.
- `src/tools.ts` — hardcoded array (`TOOLS: ToolMeta[]`) of every published
  tool's full metadata: slug, SEO fields, audience, privacy mode, supported
  inputs, unsupported cases, output artifacts, official government sources,
  related tools, Axal upsell copy, trust copy, banned-claims list.
- `src/claims.ts` — `BANNED_PUBLIC_CLAIMS` and `STANDARD_TRUST_COPY`.
- `src/validation.ts` — `validateToolMeta(tool, asOf)`, the runtime shape/
  freshness/host-allowlist checks behind `scan:source-register`.

## The ToolMeta/ToolSource contract

Every tool in `TOOLS` must carry, per `validation.ts`:

- Non-empty `slug` (must start with `/`), `h1`, `seoTitle`, `metaDescription`,
  `title`, `axalUpgradePath` (must mention "Axal").
- `privacyMode: "browser-only"`, `accountRequired: false`,
  `fileUploadRequired: false`, `telemetry: "none"` — hardcoded, not
  configurable per tool.
- At least one `officialSources` entry, and every source must have
  `sourceType: "official"`, an ISO `lastReviewedAt` that is not in the
  future, a positive `staleAfterDays`, and a `url` whose hostname is on the
  hardcoded `officialHosts` allowlist in `validation.ts` (e.g.
  `www.incometax.gov.in`, `samadhaan.msme.gov.in`, `tutorial.gst.gov.in`,
  `selfservice.gstsystem.in`, `www.dcmsme.gov.in`, `egazette.gov.in`).
  **Adding a source from a new domain means updating `officialHosts` in the
  same change** — read that list before assuming a URL will pass.
- Non-empty `supportedInputs`, `unsupportedCases`, `outputArtifacts`,
  `trustCopy`, `bannedClaims`, and at least 2 `relatedSlugs` that point at
  other real slugs in `TOOLS` (and not at itself).
- A `seoDepth` block with `inputGuide` (>=2), `exampleWorkflow` (>=3),
  `commonMistakes` (>=2), `reviewChecklist` (>=3), `faqItems` (>=2), and a
  non-empty `sourceExplainer`.

`tests/source-register/tools-meta.test.ts` pins the exact expected slug list
(currently 6 tools) and re-runs `validateToolMeta` against every entry, so
adding, removing, or renaming a tool means updating that expected-slugs array
in the same change, not just `tools.ts`.

## Banned claims — quote the real list, don't invent one

Read `src/claims.ts` before writing any public copy or FAQ content. As of
this check, `BANNED_PUBLIC_CLAIMS` includes phrases such as `"legally
compliant"`, `"permanent redaction"`, `"zero data collection"`, `"dpdp
compliant"`, `"audit-proof"`, `"ca verified"`, `"government approved"`,
`"itc eligible"`, `"final liability"`, and `"final disallowance"` — this list
drifts over time (it has already grown beyond older internal digests), so
verify it fresh each session rather than trusting a remembered copy. Every
tool's `bannedClaims` field and all public-facing copy in `apps/site` must
avoid every phrase currently in this array; `pnpm scan:copy`
(`tests/policy/copy-claims.test.ts`) enforces this against rendered content.
`STANDARD_TRUST_COPY` is the canonical trust-copy wording every tool page
must carry (browser-only processing, no account, no upload, draft-for-review,
not government-affiliated) — prefer reusing these exact strings over
paraphrasing.

## The two scan gates this package owns

- `pnpm scan:source-register` runs `tests/source-register/tools-meta.test.ts`
  — the shape/contract checks above, plus the pinned slug list and the
  MSME-tool boundary-copy assertions.
- `pnpm scan:source-freshness` runs `scripts/source-freshness.mjs
  --fail-on-stale`, which parses `tools.ts`'s string constants directly (not
  via TypeScript import), computes `ageDays` for each `ToolSource` against
  today, and fails if any source's age exceeds its own `staleAfterDays`. The
  unauthenticated `pnpm source:freshness` variant (no `--fail-on-stale`)
  just renders the markdown report — used by the weekly
  `source-freshness.yml` workflow that auto-files a stale-source issue.
  Because the freshness script does simple regex/text parsing of `tools.ts`
  rather than importing it, keep new `ToolSource` literals in the same
  plain-object-with-string-fields style as the existing ones — don't
  refactor them into computed/dynamic expressions or the freshness parser
  will silently miss them.

## Why this package is high-stakes

Nothing here is cosmetic copy: `officialSources`, `unsupportedCases`, and
`bannedClaims` are the artifacts a compliance reviewer (human or the repo's
review bot) checks against government notification text and against the
DPDP/ASCI-style banned-claims policy before a tool can ship or change. A bad
edit here (a stale review date, a claim that slips past `bannedClaims`, an
`officialSources` entry pointing at a non-government host) fails CI via
`scan:source-register` / `scan:source-freshness` / `scan:copy`, but more
importantly it is the actual legal defensibility record for every statutory
claim the product makes. When touching this package, prefer running
`pnpm scan:source-register`, `pnpm scan:source-freshness`, and `pnpm
scan:copy` locally before considering the change done — don't rely on
`pnpm verify` alone, since (per the root `CLAUDE.md`) it does not include
`scan:source-register`.
