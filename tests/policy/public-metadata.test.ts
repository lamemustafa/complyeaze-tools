import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TOOLS } from "../../packages/source-register/src/tools";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("public metadata", () => {
  it("publishes crawl, social, icon, and AI summary metadata", () => {
    const layout = read("apps/site/src/layouts/BaseLayout.astro");

    expect(layout).toContain('property="og:image"');
    expect(layout).toContain('property="og:image:type" content="image/png"');
    expect(layout).toContain('property="og:image:width" content="1200"');
    expect(layout).toContain('property="og:image:height" content="630"');
    expect(layout).toContain('name="twitter:card"');
    expect(layout).toContain('rel="icon"');
    expect(layout).toContain('rel="manifest"');
    expect(layout).toContain("SoftwareSourceCode");
    expect(layout).toContain("WebSite");
    expect(existsSync(join(root, "apps", "site", "public", "favicon.svg"))).toBe(true);
    expect(existsSync(join(root, "apps", "site", "public", "social-card.svg"))).toBe(true);
    expect(existsSync(join(root, "apps", "site", "public", "social-card.png"))).toBe(true);
    expect(existsSync(join(root, "apps", "site", "public", "site.webmanifest"))).toBe(true);
    expect(existsSync(join(root, "apps", "site", "public", "llms.txt"))).toBe(true);
  });

  it("uses page-specific trust page descriptions", () => {
    const pages = [
      "apps/site/src/pages/privacy.astro",
      "apps/site/src/pages/terms.astro",
      "apps/site/src/pages/security.astro",
      "apps/site/src/pages/source.astro",
      "apps/site/src/pages/status.astro",
      "apps/site/src/pages/changelog.astro",
      "apps/site/src/pages/sanchika.astro",
    ];

    for (const pagePath of pages) {
      expect(read(pagePath), pagePath).toContain("description=");
    }
  });

  it("explains tool clusters and Axal upgrade paths on the homepage", () => {
    const homepage = read("apps/site/src/pages/index.astro");

    expect(homepage).toContain("Reconciliation and vendor follow-up");
    expect(homepage).toContain("Evidence and review copy");
    expect(homepage).toContain("Open Sanchika docs");
    expect(homepage).toContain("Need the shared UI package boundary?");
    expect(homepage).toContain("Need saved mappings, evidence trails, and recurring workflows?");
    expect(homepage).toContain("https://complyeaze.com/axal");
  });

  it("shows a direct Axal upgrade CTA on every tool page shell", () => {
    const shell = read("apps/site/src/components/ToolShell.astro");

    expect(shell).toContain("Open Axal");
    expect(shell).toContain("https://complyeaze.com/axal");
    expect(shell).toContain("Need this as a recurring workflow?");
    expect(shell).toContain("officialSources: tool.officialSources.map");
    expect(shell).toContain("lastReviewedAt: source.lastReviewedAt");
    expect(shell).toContain("unsupportedCases: tool.unsupportedCases");
    expect(shell).not.toContain("tool={tool}");
    expect(shell).toContain("Related local tools");
    expect(shell).toContain("Common questions");
    expect(shell).toContain("Input guide");
    expect(shell).toContain("Common mistakes");
    expect(shell).toContain("Review checklist");
    expect(shell).toContain("Downloaded draft includes");
    expect(shell).toContain("Terms and disclaimer reference");
    expect(shell).toContain("termsOfService");
    expect(shell).toContain("BreadcrumbList");
    expect(shell).toContain("WebPage");
    expect(shell).toContain("citation: tool.officialSources.map");
    expect(shell).toContain("tool.seoDepth.exampleWorkflow");
    expect(shell).toContain("FAQPage");
    expect(shell).toContain("refresh after {source.staleAfterDays} days");
  });

  it("renders unsupported cases on the source register page", () => {
    const sourcePage = read("apps/site/src/pages/source.astro");

    expect(sourcePage).toContain("Unsupported cases");
    expect(sourcePage).toContain("tool.unsupportedCases.map");
  });

  it("keeps llms.txt aligned with launch tools", () => {
    const llms = read("apps/site/public/llms.txt");

    for (const tool of TOOLS) {
      expect(llms).toContain(`https://tools.complyeaze.com${tool.slug}/`);
      expect(llms).toContain(tool.h1);
    }
    expect(llms).toContain("Terms and disclaimer: https://tools.complyeaze.com/terms/");
    expect(llms).toContain(
      "Sanchika evidence-loop page: https://tools.complyeaze.com/sanchika/",
    );
  });

  it("keeps robots permissive for public static pages", () => {
    const robots = read("apps/site/public/robots.txt");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://tools.complyeaze.com/sitemap.xml");
    expect(robots).not.toContain("Disallow: /");
  });

  it("publishes sitemap freshness for every listed URL", () => {
    const sitemap = read("apps/site/public/sitemap.xml");
    const urls = sitemap.match(/<url>/g) ?? [];
    const lastmods = sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) ?? [];

    expect(urls.length).toBeGreaterThan(0);
    expect(lastmods.length).toBe(urls.length);
    expect(sitemap).toContain("<loc>https://tools.complyeaze.com/sanchika/</loc>");
    expect(sitemap).toContain("<loc>https://tools.complyeaze.com/terms/</loc>");
  });
});
