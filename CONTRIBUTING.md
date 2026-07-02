# Contributing

ComplyEaze Tools handles sensitive compliance workflows. Contributions must:

- use synthetic fixtures only;
- keep all parsing and artifact generation browser-local;
- avoid telemetry, analytics, document upload, and backend APIs;
- add or update tests for source metadata, copy claims, fixture safety, and
  export safety when relevant;
- keep public claims source-linked and review-only.

Run `pnpm verify` before opening a pull request.
