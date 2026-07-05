import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("operations hardening", () => {
  it("documents deploy credential rotation and opens a recurring reminder issue", () => {
    const rotationDoc = read("docs/deploy-credential-rotation.md");
    const workflow = read(".github/workflows/deploy-credential-rotation.yml");

    expect(existsSync(join(root, "docs", "deploy-credential-rotation.md"))).toBe(true);
    expect(rotationDoc).toContain("Rotate at least every 60 days");
    expect(rotationDoc).toContain("TOOLS_PROD_KUBECONFIG_B64");
    expect(rotationDoc).toContain("Emergency Revocation");
    expect(rotationDoc).toContain("Prefer GitHub OIDC");
    expect(workflow).toContain("cron: \"23 4 1 * *\"");
    expect(workflow).toContain("deploy-credential-rotation");
    expect(workflow).toContain("gh issue create");
    expect(workflow).not.toContain("${{ secrets.TOOLS_PROD_KUBECONFIG_B64 }}");
  });

  it("documents external uptime monitor targets without claiming real-time status", () => {
    const uptimeDoc = read("docs/uptime-monitoring.md");
    const statusPage = read("apps/site/src/pages/status.astro");

    for (const target of [
      "https://tools.complyeaze.com/",
      "https://tools.complyeaze.com/-/health",
      "https://tools.complyeaze.com/gstr-2b-purchase-reconciliation-triage/",
      "https://tools.complyeaze.com/sanchika/",
      "https://tools.complyeaze.com/sitemap.xml",
      "https://tools.complyeaze.com/site.webmanifest",
    ]) {
      expect(uptimeDoc).toContain(target);
    }

    expect(uptimeDoc).toMatch(/must not claim\s+real-time uptime/);
    expect(statusPage).toContain("External monitor targets are defined");
    expect(statusPage).toContain("do not treat this page as a real-time uptime feed");
  });

  it("documents Sanchika public-edge triage separately from Kubernetes deploys", () => {
    const goLive = read("docs/go-live-runbook.md");

    expect(goLive).toContain("curl --fail --location https://tools.complyeaze.com/sanchika/");
    expect(goLive).toContain("public `/sanchika/` route returns `403`");
    expect(goLive).toContain("Cloudflare, DNS, or WAF edge behavior");
    expect(goLive).toContain("cf-ray");
    expect(goLive).toContain("do not redeploy or mutate Kubernetes");
  });

  it("links operational docs from release and deployment runbooks", () => {
    const releaseGates = read("docs/release-gates.md");
    const k8s = read("docs/k8s-deployment.md");
    const goLive = read("docs/go-live-runbook.md");
    const readme = read("README.md");

    for (const doc of [releaseGates, k8s, goLive, readme]) {
      expect(doc).toContain("docs/deploy-credential-rotation.md");
    }

    for (const doc of [releaseGates, goLive, readme]) {
      expect(doc).toContain("docs/uptime-monitoring.md");
    }

    expect(releaseGates).toContain("infra/cloudflare");
    expect(readme).toContain("infra/cloudflare");
  });

  it("documents the backup-maintainer path without fake CODEOWNER entries", () => {
    const maintainers = read("MAINTAINERS.md");
    const governance = read("GOVERNANCE.md");
    const codeowners = read(".github/CODEOWNERS");
    const onboarding = read("docs/maintainer-onboarding.md");

    expect(onboarding).toContain("Add A Backup Reviewer");
    expect(onboarding).toContain("Solo-Maintainer Exception");
    expect(maintainers).toMatch(/backup\s+maintainer/);
    expect(governance).toContain("second maintainer or platform/security review");
    expect(governance).toContain("review thread is resolved or answered with evidence");
    expect(onboarding).toMatch(/required\s+checks\s+and\s+unresolved\s+review\s+conversations/);
    expect(codeowners).toContain("Add the backup maintainer");
    expect(codeowners).not.toContain("@complyeaze/tools-maintainers");
  });
});
