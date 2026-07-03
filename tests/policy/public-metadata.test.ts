import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("public metadata", () => {
  it("publishes crawl, social, icon, and AI summary metadata", () => {
    const layout = read("apps/site/src/layouts/BaseLayout.astro");

    expect(layout).toContain('property="og:image"');
    expect(layout).toContain('name="twitter:card"');
    expect(layout).toContain('rel="icon"');
    expect(layout).toContain('rel="manifest"');
    expect(layout).toContain("SoftwareSourceCode");
    expect(layout).toContain("WebSite");
    expect(existsSync(join(root, "apps", "site", "public", "favicon.svg"))).toBe(true);
    expect(existsSync(join(root, "apps", "site", "public", "social-card.svg"))).toBe(true);
    expect(existsSync(join(root, "apps", "site", "public", "site.webmanifest"))).toBe(true);
    expect(existsSync(join(root, "apps", "site", "public", "llms.txt"))).toBe(true);
  });

  it("explains tool clusters and Axal upgrade paths on the homepage", () => {
    const homepage = read("apps/site/src/pages/index.astro");

    expect(homepage).toContain("Reconciliation and vendor follow-up");
    expect(homepage).toContain("Evidence and review copy");
    expect(homepage).toContain("Need saved mappings, evidence trails, and recurring workflows?");
    expect(homepage).toContain("https://complyeaze.com/axal");
  });

  it("shows a direct Axal upgrade CTA on every tool page shell", () => {
    const shell = read("apps/site/src/components/ToolShell.astro");

    expect(shell).toContain("Open Axal");
    expect(shell).toContain("https://complyeaze.com/axal");
    expect(shell).toContain("Need this as a recurring workflow?");
  });
});
