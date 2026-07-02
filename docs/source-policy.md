# Source Policy

Each launch tool needs a source-register record in
`packages/source-register/src/tools.ts`.

Required fields:

- official source URL
- publisher
- jurisdiction
- review date
- stale-after policy
- supported inputs
- unsupported cases
- Axal upgrade path

Use official or primary sources for statutory, portal, tax, compliance, and
privacy claims. If an official source is unavailable or stale, weaken the public
copy instead of adding an unsupported claim.
