# Branch Protection

Protect `main` before production promotion. The public repository should use a
GitHub branch protection rule or repository ruleset with these requirements:

- Require pull requests before merge.
- Require the `verify` status check from `.github/workflows/ci.yml`.
- After the first successful run, also require `CodeQL / Analyze` and
  `Dependency Review / Review dependency changes` so code scanning and
  dependency review block unsafe pull requests.
- Require branches to be up to date before merge.
- Require conversation resolution before merge.
- Require CODEOWNER review for paths listed in `.github/CODEOWNERS`.
- Block force pushes and branch deletion.
- Prefer squash merge and delete branches after merge.
- Keep admin bypass disabled except for documented break-glass recovery.

Repository merge settings should also be tightened:

- Enable squash merge.
- Disable merge commits and rebase merge.
- Enable delete branch on merge.
- Keep issues enabled and wiki disabled.

Production deploys also require the `production` environment on GitHub with a
maintainer reviewer. The `Deploy Production` workflow must be run with both the
reviewed source SHA and the digest produced by the `Publish Image` workflow for
that SHA.

Use `docs/maintainer-onboarding.md` before adding a second maintainer or
tools-maintainers team to CODEOWNERS, branch protection, or the production
environment. Do not add placeholder owners that do not exist on GitHub.

Suggested GitHub checks:

```text
Required status check: verify
Required security checks: CodeQL / Analyze, Dependency Review / Review dependency changes
Required review paths: .github/, deploy/, packages/source-register/,
packages/safety/, infra/cloudflare/, privacy/security/source pages,
SECURITY.md, AGENTS.md
```

After enabling the rules, verify:

```bash
gh api repos/lamemustafa/complyeaze-tools/branches/main --jq '.protected'
gh api repos/lamemustafa/complyeaze-tools/branches/main/protection --jq '.required_status_checks.contexts'
```

If applying the settings from the GitHub UI, use:

```text
Repository settings:
- Pull Requests: allow squash merge only.
- Automatically delete head branches: enabled.

Ruleset target:
- Include default branch/main.
- Restrict deletions: enabled.
- Require linear history: enabled.
- Require a pull request before merging: enabled.
- Require status checks to pass: verify.
- Add security status checks after their first run: CodeQL / Analyze,
  Dependency Review / Review dependency changes.
- Require branches to be up to date before merging: enabled.
- Require conversation resolution before merging: enabled.
- Require review from Code Owners: enabled.
```
