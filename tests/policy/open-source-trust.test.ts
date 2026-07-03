import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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
    scripts?: Record<string, string>;
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

    expect(securityPage).toContain("security at complyeaze dot com");
    expect(securityPage).not.toContain("security@complyeaze.com");
    expect(securityPolicy).toContain("security@complyeaze.com");
    expect(securityPolicy).toContain("Supported Versions");
    expect(securityPolicy).toContain("Safe Harbor");
    expect(existsSync(join(root, "GOVERNANCE.md"))).toBe(true);
    expect(existsSync(join(root, "MAINTAINERS.md"))).toBe(true);
    expect(existsSync(join(root, "SUPPORT.md"))).toBe(true);
    expect(existsSync(join(root, "docs", "third-party-licenses.md"))).toBe(true);
    expect(existsSync(join(root, ".github", "PULL_REQUEST_TEMPLATE.md"))).toBe(true);
    expect(existsSync(join(root, ".github", "CODEOWNERS"))).toBe(true);
    expect(existsSync(join(root, "docs", "branch-protection.md"))).toBe(true);
    expect(existsSync(join(root, ".github", "ISSUE_TEMPLATE", "config.yml"))).toBe(true);
    expect(existsSync(join(root, ".github", "ISSUE_TEMPLATE", "source_freshness.yml"))).toBe(
      true,
    );
  });

  it("discloses Cloudflare security checks where the public host uses them", () => {
    const privacyPage = read("apps/site/src/pages/privacy.astro");
    const privacyDoc = read("docs/privacy-local-first.md");
    const loggingDoc = read("docs/logging-and-metadata.md");

    for (const source of [privacyPage, privacyDoc, loggingDoc]) {
      expect(source).toContain("Cloudflare");
      expect(source).toContain("cf_clearance");
    }
  });

  it("documents protected branch and review gates", () => {
    const branchProtection = read("docs/branch-protection.md");
    const codeowners = read(".github/CODEOWNERS");
    const prTemplate = read(".github/PULL_REQUEST_TEMPLATE.md");
    const agents = read("AGENTS.md");

    expect(branchProtection).toContain("Required status check: verify");
    expect(branchProtection).toContain("Required conversation gate");
    expect(branchProtection).toContain("Required approving reviews / Code Owner reviews: disabled");
    expect(codeowners).toContain("/deploy/");
    expect(codeowners).toContain("/packages/source-register/");
    expect(prTemplate).toContain("Branch Protection Impact");
    expect(agents).toContain("The protected branch check name is `verify`");
  });

  it("keeps public issue intake synthetic and disables blank issues", () => {
    const issueConfig = read(".github/ISSUE_TEMPLATE/config.yml");
    const sourceFreshness = read(".github/ISSUE_TEMPLATE/source_freshness.yml");
    const toolRequest = read(".github/ISSUE_TEMPLATE/tool_request.md");

    expect(issueConfig).toContain("blank_issues_enabled: false");
    expect(sourceFreshness).toContain("required: true");
    expect(sourceFreshness).toContain("synthetic context only");
    expect(toolRequest).toContain("Safety confirmation");
  });

  it("automates source freshness issues and deploy provenance checks", () => {
    const freshnessWorkflow = read(".github/workflows/source-freshness.yml");
    const deployWorkflow = read(".github/workflows/deploy-production.yml");
    const releaseGates = read("docs/release-gates.md");

    expect(freshnessWorkflow).toContain("cron:");
    expect(freshnessWorkflow).toContain("source-freshness-report.md");
    expect(freshnessWorkflow).toContain("gh issue create");
    expect(freshnessWorkflow).toContain("gh pr create");
    expect(readJson("package.json").scripts?.["audit:high"]).toBe(
      "pnpm audit --audit-level high",
    );
    expect(read(".github/workflows/ci.yml")).toContain("pnpm audit:high");
    expect(deployWorkflow).toContain("source_sha");
    expect(deployWorkflow).toContain("Verify reviewed publish run");
    expect(releaseGates).toContain("docs/branch-protection.md");
    expect(releaseGates).toContain("pnpm scan:source-freshness");
  });

  it("pins GitHub Actions to reviewed commit SHAs", () => {
    const workflowDir = join(root, ".github", "workflows");
    const offenders = readdirSync(workflowDir)
      .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
      .flatMap((name) => {
        const workflow = read(join(".github", "workflows", name));

        return [...workflow.matchAll(/uses:\s+([^@\s]+)@([^\s#]+)/g)]
          .filter((match) => !/^[0-9a-f]{40}$/.test(match[2]))
          .map((match) => `${name}: ${match[0]}`);
      });

    expect(offenders).toEqual([]);
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
