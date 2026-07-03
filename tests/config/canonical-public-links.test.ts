import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { publicSiteUrl } from "../../apps/site/src/lib/public-url";

describe("canonical public links", () => {
  it("builds no-port HTTPS links that do not inherit a stale browser port", () => {
    const toolUrl = publicSiteUrl("/msme-45-day-payment-due-date-calculator");

    expect(toolUrl).toBe(
      "https://tools.complyeaze.com/msme-45-day-payment-due-date-calculator/",
    );
    expect(new URL(toolUrl, "https://tools.complyeaze.com:8080/").href).toBe(toolUrl);
  });

  it("keeps generated static directory links on trailing-slash URLs", () => {
    expect(publicSiteUrl("/gst-portal-issue-evidence-memo")).toBe(
      "https://tools.complyeaze.com/gst-portal-issue-evidence-memo/",
    );
  });

  it("keeps sitemap loc entries on trailing-slash URLs", () => {
    const sitemap = readFileSync(
      join(process.cwd(), "apps", "site", "public", "sitemap.xml"),
      "utf8",
    );

    expect(sitemap).toContain(
      "<loc>https://tools.complyeaze.com/gst-portal-issue-evidence-memo/</loc>",
    );
    expect(sitemap).not.toContain(
      "<loc>https://tools.complyeaze.com/gst-portal-issue-evidence-memo</loc>",
    );
  });
});
