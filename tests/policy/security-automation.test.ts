import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("security automation", () => {
  it("runs CodeQL for JavaScript and TypeScript on PRs, default-branch pushes, and a schedule", () => {
    const workflowPath = ".github/workflows/codeql.yml";
    const workflow = read(workflowPath);

    expect(existsSync(join(root, workflowPath))).toBe(true);
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("cron:");
    expect(workflow).toContain("security-events: write");
    expect(workflow).toContain("github/codeql-action/init@99df26d4f13ea111d4ec1a7dddef6063f76b97e9");
    expect(workflow).toContain("github/codeql-action/analyze@99df26d4f13ea111d4ec1a7dddef6063f76b97e9");
    expect(workflow).toContain("languages: javascript-typescript");
    expect(workflow).toContain("queries: security-extended,security-and-quality");
  });

  it("runs dependency review on pull requests with high-severity enforcement", () => {
    const workflow = read(".github/workflows/dependency-review.yml");

    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("pull-requests: read");
    expect(workflow).toContain(
      "actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294",
    );
    expect(workflow).toContain("fail-on-severity: high");
    expect(workflow).toContain("retry-on-snapshot-warnings: true");
  });

  it("scans the final published image and uploads SARIF", () => {
    const workflow = read(".github/workflows/publish-image.yml");

    expect(workflow).toContain("security-events: write");
    expect(workflow).toContain("aquasecurity/trivy-action@ed142fd0673e97e23eac54620cfb913e5ce36c25");
    expect(workflow).toContain("load: true");
    expect(workflow).toContain("image-ref: ${{ env.IMAGE_NAME }}:${{ github.sha }}");
    expect(workflow).toContain("docker push \"${IMAGE_NAME}:${GITHUB_SHA}\"");
    expect(workflow).toContain("format: sarif");
    expect(workflow).toContain("severity: HIGH,CRITICAL");
    expect(workflow).toContain("exit-code: \"1\"");
    expect(workflow).toContain("github/codeql-action/upload-sarif@99df26d4f13ea111d4ec1a7dddef6063f76b97e9");
    expect(workflow.indexOf("aquasecurity/trivy-action")).toBeLessThan(
      workflow.indexOf("Push scanned image"),
    );
  });

  it("documents security checks in branch protection and release gates", () => {
    const branchProtection = read("docs/branch-protection.md");
    const releaseGates = read("docs/release-gates.md");

    expect(branchProtection).toContain("Analyze");
    expect(branchProtection).toContain("Review dependency changes");
    expect(releaseGates).toContain("CodeQL");
    expect(releaseGates).toContain("dependency-review");
    expect(releaseGates).toContain("Trivy");
    expect(releaseGates).toContain("pnpm scan:built-runtime-network");
  });

  it("runs built-output network scanning after the static build", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };

    expect(pkg.scripts["scan:built-runtime-network"]).toBe(
      "node scripts/scan-built-runtime-network.mjs",
    );
    expect(pkg.scripts.verify).toContain("pnpm build && pnpm scan:built-runtime-network");
  });
});
