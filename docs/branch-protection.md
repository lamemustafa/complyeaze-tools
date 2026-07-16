# Branch Protection

Protect `master` before production promotion. The public repository should use a
GitHub branch protection rule or repository ruleset with these requirements:

- Require pull requests before merge.
- Require the `verify` status check from `.github/workflows/ci.yml`.
- Require the `Review gate` commit-status context written by
  `.github/workflows/review-gate.yml`; this blocks unresolved current-head
  review findings without requiring an approving reviewer. The Actions job is
  named `Review gate status sync` so GitHub does not require both a check run
  and a commit status named `Review gate`. Branch protection should block on
  review findings, not on an approving reviewer count.
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
- Same-repository pull request lifecycle, review, and inline review-comment
  events reconcile immediately. Review and comment events from forks are
  intentionally skipped because their tokens are read-only; a later trusted
  `pull_request_target` lifecycle event or the daily default-branch sweep repairs
  the current fork head.
- GitHub Actions does not expose a dedicated review-thread resolution or
  reopening event. After a thread-only change, wait for the daily sweep (a
  maximum delay of about 24 hours) or re-run a trusted pull-request lifecycle
  run from the Checks UI.
- The `Review gate` workflow intentionally combines `pull_request_target`,
  same-repository review/comment events, and one daily schedule. Every
  status-writing path checks out and executes only trusted default-branch code;
  it never runs PR-controlled workflow or package code. Native required pull
  request reviews with zero required approvals are the immediate guard for
  pending or rejected reviews. The daily all-open sweep is the bounded repair
  path for thread-only changes, read-only fork review/comment events, and stale
  current-head statuses; it does not poll between runs.
- Both targeted PR events and daily all-open sweeps may record an audited success
  when no formal current-head Codex review object exists, as long as the
  evaluated PR head exactly matches the status SHA and there are no unresolved
  current-head review threads or requested-changes reviews. The status
  description must make the missing Codex review explicit instead of pretending
  a bot review happened. The daily writer compares the latest GitHub Actions
  `Review gate` status before its final write and skips if a newer event result
  landed, leaving the next daily run available for repair.
- Do not expose `workflow_dispatch` on the privileged status-writer workflow
  because manual dispatch can be started from a non-default workflow ref.
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
Required review findings status context: Review gate
Required security checks: Analyze, Review dependency changes
Required pull request reviews: enabled with required approving reviews = 0
Required conversation gate: all current-head review threads resolved
Sensitive owner paths: .github/, deploy/, packages/source-register/,
packages/safety/, infra/cloudflare/, privacy/security/source pages,
SECURITY.md, AGENTS.md
```

After enabling the rules, verify:

```bash
gh api repos/lamemustafa/complyeaze-tools/branches/master --jq '.protected'
gh api repos/lamemustafa/complyeaze-tools/branches/master/protection --jq '.required_status_checks.contexts'
```

If applying the settings from the GitHub UI, use:

```text
Repository settings:
- Pull Requests: allow squash merge only.
- Automatically delete head branches: enabled.

Ruleset target:
- Include default branch/master.
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
