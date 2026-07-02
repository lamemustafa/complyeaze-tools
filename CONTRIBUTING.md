# Contributing

ComplyEaze Tools handles sensitive compliance workflows. Contributions must:

- use synthetic fixtures only;
- keep all parsing and artifact generation browser-local;
- avoid telemetry, analytics, document upload, and backend APIs;
- add or update tests for source metadata, copy claims, fixture safety, and
  export safety when relevant;
- keep public claims source-linked and review-only.

Run `pnpm verify` before opening a pull request.

## Pull Request Checklist

Before opening a pull request:

1. Use synthetic input, fixtures, screenshots, and test data only.
2. Link official sources for rule, deadline, form, statute, or portal-behavior
   claims.
3. Update unsupported cases when the tool does less than a reader may assume.
4. Keep generated artifacts review-only; do not imply filing, correction,
   waiver, extension, eligibility, or legal conclusions.
5. Run `pnpm verify` and include the result in the PR.

## Dependency Policy

Do not add new runtime dependencies unless the behavior cannot be implemented
with existing local packages or platform APIs. New dependencies require a license
review and must preserve the static, browser-local, no-telemetry posture.

## Security Reports

Do not report vulnerabilities in public issues or pull requests. Follow
`SECURITY.md` and use security@complyeaze.com.
