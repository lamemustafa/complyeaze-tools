import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("review findings gate", () => {
  it("exposes a Pack-style current-head review gate without requiring approvals", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      scripts: Record<string, string>;
    };
    const workflow = read(".github/workflows/review-gate.yml");
    const syncScript = read("scripts/sync-review-gate-status.mjs");
    const branchProtection = read("docs/branch-protection.md");

    expect(existsSync(join(root, "scripts", "check-pr-review-gate.mjs"))).toBe(true);
    expect(existsSync(join(root, "scripts", "sync-review-gate-status.mjs"))).toBe(true);
    expect(packageJson.scripts["review:gate"]).toBe("node scripts/check-pr-review-gate.mjs");

    expect(workflow).toContain("name: Review findings gate");
    expect(workflow).toContain("pull_request_target:");
    expect(workflow).toContain("schedule:");
    expect(workflow).toContain("cron: \"*/5 * * * *\"");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("pull-requests: read");
    expect(workflow).toContain("statuses: write");
    expect(workflow).toContain("GH_TOKEN: ${{ github.token }}");
    expect(workflow).toContain("repository: ${{ github.repository }}");
    expect(workflow).toContain("ref: ${{ github.event.repository.default_branch }}");
    expect(workflow).not.toContain("pull_request_review:");
    expect(workflow).not.toContain("pull_request_review_comment:");
    expect(workflow).not.toContain("github.event.pull_request.base.sha");
    expect(workflow).not.toContain("github.event.pull_request.base.sha || github.sha");
    expect(workflow).toContain("node scripts/sync-review-gate-status.mjs");
    expect(workflow).toContain("--strict-head-review");
    expect(workflow).toContain("--required-review-author chatgpt-codex-connector");
    expect(workflow).toContain("--skip-pending-status");
    expect(workflow).toContain(
      'args+=(--all-open --wait-head-review-ms 0 --allow-missing-head-review --skip-pending-status)',
    );
    expect(workflow).toContain('args+=(--pr "${PR_NUMBER}" --wait-head-review-ms 180000)');
    expect(workflow).not.toContain(
      'args+=(--pr "${PR_NUMBER}" --wait-head-review-ms 180000 --allow-missing-head-review)',
    );
    expect(syncScript).toContain("readLatestReviewGateStatus");
    expect(syncScript).toContain("Review gate status already");
    expect(syncScript).toContain("pullRequests(states:OPEN,first:100");
    expect(syncScript).toContain("pageInfo{hasNextPage endCursor}");
    expect(syncScript).not.toContain('"pr",\n    "list"');
    expect(workflow).not.toContain("steps.resolve-pr.outputs.head_repo");
    expect(workflow).not.toContain("steps.resolve-pr.outputs.head_sha");
    expect(workflow).not.toContain("pnpm install --frozen-lockfile");
    expect(workflow).not.toContain("pnpm review:gate");
    expect(workflow).not.toContain("issue_comment:");
    expect(workflow).not.toContain("required approving review");

    expect(branchProtection).toContain("Review gate");
    expect(branchProtection).toContain("unresolved review threads");
    expect(branchProtection).toContain("not on an approving reviewer count");
    expect(branchProtection).toContain("required_approving_review_count: 0");
    expect(branchProtection).toContain("pending or rejected reviews");
    expect(branchProtection).toContain("immediate guard");
    expect(branchProtection).toContain("trusted status-refresh backstop");
    expect(branchProtection).toContain("Scheduled all-open sweeps may");
    expect(branchProtection).toContain("rerun the `Review gate` check");
    expect(branchProtection).toContain("Manual dispatches must run trusted default-branch workflow code");
  });
});
