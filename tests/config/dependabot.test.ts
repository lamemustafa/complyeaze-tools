import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const config = readFileSync(
  join(process.cwd(), ".github", "dependabot.yml"),
  "utf8",
);

describe("Dependabot configuration", () => {
  it("uses GitHub's default labels instead of referencing a missing custom label", () => {
    expect(config).not.toMatch(/^\s+labels:/m);
  });

  it("groups compatible frontend toolchain updates without folding in majors", () => {
    expect(config).toContain("frontend-toolchain:");
    expect(config).toContain('          - "@astrojs/*"');
    expect(config).toContain('          - "@vitejs/*"');
    expect(config).toMatch(/update-types:\n\s+- minor\n\s+- patch/);
  });

  it("keeps CodeQL actions coordinated and suppresses Node type majors", () => {
    expect(config).toContain("codeql-actions:");
    expect(config).toContain('          - "github/codeql-action/*"');
    expect(config).toContain("ci-actions:");
    expect(config).toContain("        exclude-patterns:");
    expect(config).toContain('      - dependency-name: "@types/node"');
    expect(config).toContain('          - "version-update:semver-major"');
  });
});
