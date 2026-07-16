import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("default branch policy", () => {
  it("uses master for protected workflows, generated PRs, and public links", () => {
    for (const workflow of ["ci.yml", "codeql.yml", "publish-image.yml"]) {
      const contents = read(`.github/workflows/${workflow}`);
      expect(contents).toContain("      - master");
      expect(contents).not.toContain("      - main");
    }

    const sourceFreshness = read(".github/workflows/source-freshness.yml");
    expect(sourceFreshness).toContain('--base master');
    expect(sourceFreshness).not.toContain('--base main');

    const baseLayout = read("apps/site/src/layouts/BaseLayout.astro");
    expect(baseLayout).toContain("/blob/master/LICENSE");
    expect(baseLayout).toContain("/blob/master/docs/release-gates.md");
    expect(baseLayout).not.toContain("/blob/main/");

    const branchProtection = read("docs/branch-protection.md");
    expect(branchProtection).toContain("branches/master/protection");
    expect(branchProtection).not.toContain("branches/main/protection");
  });
});
