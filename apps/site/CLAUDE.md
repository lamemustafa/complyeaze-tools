# apps/site — Claude Code notes

No sibling `AGENTS.md` exists in this directory; this file is native and
covers architecture for `@complyeaze-tools/site`, the Astro static site that
is the entire product. See the root `CLAUDE.md` (which imports the root
`AGENTS.md`) for repo-wide gates, non-negotiables, and the banned-claims list.

## Page-per-tool convention

Every tool is one `.astro` page under `src/pages/`, named after the tool's
slug (e.g. `msme-45-day-payment-due-date-calculator.astro`,
`gstr-2b-purchase-reconciliation-triage.astro`,
`gstr-2b-missing-invoice-vendor-follow-up.astro`,
`ais-form-26as-mismatch-checker.astro`,
`gst-portal-issue-evidence-memo.astro`). Non-tool pages live alongside them
(`index.astro`, `privacy.astro`, `security.astro`, `source.astro`,
`status.astro`, `changelog.astro`, plus `privacy/review-copy-builder.astro`).

A tool page is intentionally thin — it looks up its own metadata by slug and
hands everything else to shared chrome:

```astro
const tool = getToolBySlug("/msme-45-day-payment-due-date-calculator");
---
<BaseLayout title={tool.seoTitle} description={tool.metaDescription}>
  <ToolShell tool={tool} />
</BaseLayout>
```

Do not hardcode copy, sources, FAQs, or trust strings in the page itself —
all of that comes from `@complyeaze-tools/source-register` via
`getToolBySlug`/`getLaunchTools` in `src/lib/tools.ts`. If a tool's SEO copy,
official sources, supported inputs, unsupported cases, or FAQ needs to
change, edit the `ToolMeta` entry in `packages/source-register`, not the
`.astro` file.

## ToolShell.astro is the one shared chrome

`src/components/ToolShell.astro` renders everything around the interactive
part for every tool page: hero + trust strip (`tool.trustCopy`), the
`ToolWorkbench` island mount, the source-posture/output-artifacts/
supported-inputs/unsupported-cases grid, the SEO-depth workflow sections,
FAQ accordion, the Axal upgrade band, and the `WebApplication` +
`FAQPage` JSON-LD schema. New tool pages should reuse `ToolShell` rather than
duplicating this structure — if a tool needs a genuinely different layout,
treat that as a signal to discuss it first, since deviation here tends to
mean the trust copy or JSON-LD got dropped by accident.

`ToolShell` is also where the mandated trust copy and the JSON-LD schema are
wired up, so any change here is compliance-adjacent — check against
`packages/source-register/src/claims.ts` before editing its markup.

## Interactive logic lives in src/islands/*.tsx as React islands

`ToolShell` mounts exactly one interactive island, `src/islands/ToolWorkbench.tsx`
(`client:load`), passing a minimal projection of `ToolMeta` (slug, h1,
official sources, unsupported cases) rather than the full object. Per-tool
input/output behavior (parsing, computation, formatting) is factored into
`src/islands/tool-workbench-logic.ts` (`configs`, `buildOutput`,
`isBlockingOutput`) instead of being inlined in the component — new tools
add a config entry there, not new branching inside `ToolWorkbench.tsx` (the
existing per-slug `if` branches for extra controls like the as-of-date
picker and the strict-match checkbox are the exception, kept minimal and
tool-specific).

Astro components (`.astro`) are not interactive by default — anything that
needs `useState`/event handlers must be a React component under `src/islands/`
mounted with an explicit `client:*` directive. Keep islands focused: they
call into `packages/core` (via `tool-workbench-logic.ts`) for actual domain
logic rather than reimplementing it.

## CSP implications of adding any script

`deploy/docker/nginx.conf` sets a strict CSP:

```
script-src 'self' 'unsafe-inline'; script-src-attr 'none'; ...
connect-src 'none'; worker-src 'self' blob:; object-src 'none';
```

`connect-src 'none'` means the browser will block any fetch/XHR/WebSocket
target even if the JS tries to call one — this is a second enforcement
layer on top of the zero-runtime-network rule below. There is no allowance
for third-party script origins, remote fonts, or remote workers: `script-src`
is `'self'` only, `font-src` is `'self'` only, and `worker-src` allows only
`'self'` and `blob:` (for local, in-browser workers). Do not add a
`<script src="https://...">`, a Google Fonts link, or any CDN reference to a
page or component — it will be blocked in production and violates the
non-negotiables in the root config regardless. Any new inline script must
stay compatible with `'unsafe-inline'` (no nonces/hashes are wired up); if a
change seems to need `unsafe-eval` or a relaxed `script-src`, that requires
the reviewed design + test evidence bar from the root `CLAUDE.md`, not a
quiet nginx.conf edit.

## Zero-runtime-network-calls rule

Tool code (everything under `apps/` and `packages/`) must make no network
calls at runtime — no `fetch`, `XMLHttpRequest`, `navigator.sendBeacon`,
`WebSocket`, `EventSource`, or `serviceWorker.register`. This is enforced by
`tests/policy/runtime-network.test.ts`, which greps every `.astro/.css/.ts/
.tsx/.js/.jsx/.mjs/.cjs` file under `apps/` and `packages/` for those
patterns, plus the `pnpm scan:runtime-network` gate. It is easy to trip this
accidentally while "improving" a tool (e.g. adding a fetch-based font
loader, an analytics snippet, or a fetch-based validation call) — if you add
any of the forbidden patterns anywhere in a runtime file, the test fails
regardless of whether the code path is ever reached in the browser.
