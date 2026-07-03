# Branch Protection

Protect `main` before production promotion. The public repository should use a
GitHub branch protection rule or repository ruleset with these requirements:

- Require pull requests before merge.
- Require the `verify` status check from `.github/workflows/ci.yml`.
- After the first successful run, also require the `Analyze` and
  `Review dependency changes` check contexts so CodeQL and dependency review
  block unsafe pull requests.
- Require branches to be up to date before merge.
- Require conversation resolution before merge. Codex and other automated review
  comments count through unresolved review threads, not through an approving
  reviewer requirement.
- Do not require an approving human review while the repo has only one eligible
  maintainer. A required self-review creates a permanent merge deadlock.
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
Required security checks: Analyze, Review dependency changes
Required conversation gate: all current-head review threads resolved
Sensitive owner paths: .github/, deploy/, packages/source-register/,
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
- Add security status checks after their first run: Analyze,
  Review dependency changes.
- Require branches to be up to date before merging: enabled.
- Require conversation resolution before merging: enabled.
- Required approving reviews / Code Owner reviews: disabled until a backup
  maintainer or valid tools-maintainers team exists.
```
