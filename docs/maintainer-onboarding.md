# Maintainer Onboarding

This repo should not depend on one GitHub account for production-sensitive
changes. The current CODEOWNERS entries stay on `@lamemustafa` until a backup
maintainer or GitHub team exists.

## Add A Backup Reviewer

1. Invite the backup maintainer to `lamemustafa/complyeaze-tools`, or create a
   GitHub team for tools maintainers.
2. Update `.github/CODEOWNERS` for sensitive paths:
   `.github/`, `deploy/`, `infra/cloudflare/`, `packages/source-register/`,
   `packages/safety/`, privacy/security/source pages, `SECURITY.md`,
   `AGENTS.md`, and release/credential/uptime docs.
3. Add the backup maintainer or team as a production environment reviewer.
4. After the first successful checks for the new workflows, require `verify`,
   `CodeQL / Analyze`, and `Dependency Review / Review dependency changes` in
   branch protection.
5. Enable required approving review or CODEOWNER review only after the backup
   reviewer or team is valid on GitHub and can review the latest pusher's work.
6. Consider requiring two approvals for deploy, security, privacy, Cloudflare,
   and source-register changes once the backup path is proven.

## Solo-Maintainer Exception

Until a backup reviewer exists, branch protection should block on required
checks and unresolved review conversations, not on an approving-review count.
Codex and other automated review comments are considered through the
conversation-resolution gate: fix valid findings, resolve stale threads with
evidence, and document any accepted follow-up before merge.

Sensitive PRs must document why the change is safe to merge under the
solo-maintainer model, link passing verification, and note any manual post-merge
checks. Do not use this exception for suspected credential exposure or
production incidents where another trusted reviewer is available.
