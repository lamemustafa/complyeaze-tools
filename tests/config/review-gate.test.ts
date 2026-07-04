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
    const branchProtection = read("docs/branch-protection.md");

    expect(existsSync(join(root, "scripts", "check-pr-review-gate.mjs"))).toBe(true);
    expect(packageJson.scripts["review:gate"]).toBe("node scripts/check-pr-review-gate.mjs");

    expect(workflow).toContain("name: Review findings gate");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("pull_request_review:");
    expect(workflow).toContain("pull_request_review_comment:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("pull-requests: read");
    expect(workflow).toContain("GH_TOKEN: ${{ github.token }}");
    expect(workflow).toContain("baseRepository,baseRefOid");
    expect(workflow).toContain("Checkout trusted base code");
    expect(workflow).toContain("repository: ${{ steps.resolve-pr.outputs.base_repo }}");
    expect(workflow).toContain("ref: ${{ steps.resolve-pr.outputs.base_sha }}");
    expect(workflow).toContain("--strict-head-review");
    expect(workflow).toContain("--required-review-author chatgpt-codex-connector");
    expect(workflow).toContain("--allow-missing-head-review");
    expect(workflow).not.toContain("ref: ${{ steps.resolve-pr.outputs.head_sha }}");
    expect(workflow).not.toContain("issue_comment:");
    expect(workflow).not.toContain("required approving review");

    expect(branchProtection).toContain("Review gate");
    expect(branchProtection).toContain("unresolved review threads");
    expect(branchProtection).toContain("not on an approving reviewer count");
  });
});
