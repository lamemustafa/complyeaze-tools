# Branch Protection

Protect `main` before production promotion. The public repository should use a
GitHub branch protection rule or repository ruleset with these requirements:

- Require pull requests before merge.
- Require the `verify` status check from `.github/workflows/ci.yml`.
- Require the `Review gate` status check from
  `.github/workflows/review-gate.yml`; this blocks unresolved current-head
  review findings without requiring an approving reviewer. Branch protection
  should block on review findings, not on an approving reviewer count.
- Require pull request reviews with `required_approving_review_count: 0`.
  This does not create a self-review approval deadlock, but it lets GitHub
  natively block pending or rejected reviews immediately. The Review gate then
  handles unresolved current-head review threads and bot-review freshness.
- After the first successful run, also require the `Analyze` and
  `Review dependency changes` check contexts so CodeQL and dependency review
  block unsafe pull requests.
- Require branches to be up to date before merge.
- Require conversation resolution before merge. Codex and other automated review
  comments count through unresolved review threads, not through an approving
  reviewer requirement.
- After resolving review conversations without pushing a new commit, manually
  re-run the latest trusted `Review gate` check from the Checks UI; GitHub
  Actions does not expose a review-thread resolution trigger for this workflow.
- If an unresolved review thread is resolved but GitHub does not rerun the
  custom check automatically, rerun the `Review gate` check from the Checks UI
  before merging.
- The `Review gate` workflow intentionally runs on `pull_request_target` and
  schedule. It updates the `Review gate` commit status for
  PR heads from trusted default-branch code without running PR-controlled
  workflow code. Native required pull request reviews with zero required
  approvals are the immediate guard for pending or rejected reviews; the
  scheduled Review gate sweep is only the trusted status-refresh backstop after
  review threads are resolved, reviews are dismissed, or old statuses need to be
  corrected. Targeted PR/manual runs must fail after waiting for Codex when no
  formal current-head bot review object is present. Scheduled all-open sweeps may
  use the missing-review bypass so they still catch unresolved threads and
  requested-changes reviews without flipping every open PR red before Codex
  responds, but they must skip writing a green status when the only passing
  condition is an allowed missing current-head review. Do not use
  `pull_request_review` or `pull_request_review_comment` as status-writing
  triggers; they do not provide the same trusted default-branch/write-token
  posture as `pull_request_target` and schedule. Do not expose
  `workflow_dispatch` on the privileged status-writer workflow because manual
  dispatch can be started from a non-default workflow ref.
- Do not require an approving human review while the repo has only one eligible
  maintainer. A required self-review creates a permanent merge deadlock. Keep the
  required review count at zero unless a second eligible maintainer is active.
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
Required review findings check: Review gate
Required security checks: Analyze, Review dependency changes
Required pull request reviews: enabled with required approving reviews = 0
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
- Require status checks to pass: verify, Review gate.
- Add security status checks after their first run: Analyze,
  Review dependency changes.
- Require branches to be up to date before merging: enabled.
- Require conversation resolution before merging: enabled.
- Require pull request reviews before merging: enabled.
- Required approving reviews: 0 until a backup maintainer or valid
  tools-maintainers team exists.
- Code Owner reviews: disabled until a backup maintainer or valid
  tools-maintainers team exists.
```
