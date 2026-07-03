# Branch Protection

Protect `main` before production promotion. The public repository should use a
GitHub branch protection rule or repository ruleset with these requirements:

- Require pull requests before merge.
- Require the `verify` status check from `.github/workflows/ci.yml`.
- Require branches to be up to date before merge.
- Require conversation resolution before merge.
- Require CODEOWNER review for paths listed in `.github/CODEOWNERS`.
- Block force pushes and branch deletion.
- Prefer squash merge and delete branches after merge.
- Keep admin bypass disabled except for documented break-glass recovery.

Production deploys also require the `production` environment on GitHub with a
maintainer reviewer. The `Deploy Production` workflow must be run with both the
reviewed source SHA and the digest produced by the `Publish Image` workflow for
that SHA.

Suggested GitHub checks:

```text
Required status check: verify
Required review paths: .github/, deploy/, packages/source-register/,
packages/safety/, privacy/security/source pages, SECURITY.md, AGENTS.md
```

After enabling the rules, verify:

```bash
gh api repos/lamemustafa/complyeaze-tools/branches/main --jq '.protected'
gh api repos/lamemustafa/complyeaze-tools/branches/main/protection --jq '.required_status_checks.contexts'
```
