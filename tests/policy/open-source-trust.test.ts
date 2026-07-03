import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function readJson(path: string) {
  return JSON.parse(read(path)) as {
    license?: string;
    homepage?: string;
    repository?: { url?: string; directory?: string };
    bugs?: { url?: string };
  };
}

describe("open-source trust surface", () => {
  it("shows source, license, build, and provenance links publicly", () => {
    const layout = read("apps/site/src/layouts/BaseLayout.astro");
    const readme = read("README.md");

    expect(layout).toContain("https://github.com/lamemustafa/complyeaze-tools");
    expect(layout).toContain("Source code");
    expect(layout).toContain("Apache-2.0 license");
    expect(layout).toContain("Reproducible build gates");
    expect(layout).toContain("SBOM and provenance workflow");
    expect(readme).toContain("| Tool | Workflow | Supported input | Output | Source posture |");
    expect(readme).toContain("https://tools.complyeaze.com");
    expect(readme).toContain("https://complyeaze.com/axal");
  });

  it("publishes security and governance routes with private reporting guidance", () => {
    const securityPage = read("apps/site/src/pages/security.astro");
    const securityPolicy = read("SECURITY.md");

    expect(securityPage).toContain("security@complyeaze.com");
    expect(securityPolicy).toContain("security@complyeaze.com");
    expect(securityPolicy).toContain("Supported Versions");
    expect(securityPolicy).toContain("Safe Harbor");
    expect(existsSync(join(root, "GOVERNANCE.md"))).toBe(true);
    expect(existsSync(join(root, "MAINTAINERS.md"))).toBe(true);
    expect(existsSync(join(root, "SUPPORT.md"))).toBe(true);
    expect(existsSync(join(root, "docs", "third-party-licenses.md"))).toBe(true);
    expect(existsSync(join(root, ".github", "PULL_REQUEST_TEMPLATE.md"))).toBe(true);
  });

  it("uses canonical Apache licensing with a separate notice file", () => {
    const license = read("LICENSE");
    const notice = read("NOTICE");

    expect(license.startsWith("Apache License\nVersion 2.0, January 2004")).toBe(true);
    expect(notice).toContain("ComplyEaze Tools");
    expect(notice).toContain("SPMS Comply Eaze Solutions LLP");
  });

  it("keeps package metadata license-aware", () => {
    const packagePaths = [
      "package.json",
      "apps/site/package.json",
      "packages/artifacts/package.json",
      "packages/core/package.json",
      "packages/parsers/package.json",
      "packages/safety/package.json",
      "packages/source-register/package.json",
      "packages/ui-react/package.json",
    ];

    for (const packagePath of packagePaths) {
      const pkg = readJson(packagePath);
      expect(pkg.license, packagePath).toBe("Apache-2.0");
      expect(pkg.homepage, packagePath).toBe("https://tools.complyeaze.com");
      expect(pkg.repository?.url, packagePath).toBe(
        "git+https://github.com/lamemustafa/complyeaze-tools.git",
      );
      expect(pkg.bugs?.url, packagePath).toBe(
        "https://github.com/lamemustafa/complyeaze-tools/issues",
      );
    }
  });
});
