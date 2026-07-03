## Summary

## Verification

- [ ] `pnpm verify`
- [ ] `pnpm scan:source-freshness`
- [ ] Live preflight updated or run when deployment/runtime behavior changed

## Safety Checks

- [ ] Uses synthetic data only
- [ ] Keeps tool processing browser-local
- [ ] Adds or updates tests for source/copy/privacy/security impact
- [ ] Does not add telemetry, backend upload, accounts, or document storage
- [ ] Does not weaken CSP, branch protection, or GitHub Actions permissions without review
- [ ] Sensitive deploy, security, privacy, source, or Cloudflare changes have resolved review comments and a documented solo-maintainer exception or maintainer/platform review

## Source Review

List official sources reviewed, if this changes public claims or tool metadata.

Source freshness as-of date:

Unsupported cases changed:

## Dependency And License Review

List dependency, license, audit, or GitHub Action changes. Write "none" if not applicable.

## Branch Protection Impact

Does this rename required checks, CODEOWNER paths, deployment environments, or protected-branch assumptions?
