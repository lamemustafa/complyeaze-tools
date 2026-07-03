import { describe, expect, it } from "vitest";
import { TOOLS } from "../../packages/source-register/src/tools";
import { validateToolMeta } from "../../packages/source-register/src/validation";

const expectedSlugs = [
  "/msme-45-day-payment-due-date-calculator",
  "/gstr-2b-missing-invoice-vendor-follow-up",
  "/gstr-2b-purchase-reconciliation-triage",
  "/ais-form-26as-mismatch-checker",
  "/gst-portal-issue-evidence-memo",
  "/privacy/review-copy-builder",
];

describe("tool source register", () => {
  it("registers every launch tool with required trust metadata", () => {
    const asOf = process.env.SOURCE_REGISTER_AS_OF ?? new Date().toISOString().slice(0, 10);

    expect(TOOLS.map((tool) => tool.slug)).toEqual(expectedSlugs);

    for (const tool of TOOLS) {
      expect(validateToolMeta(tool, asOf)).toEqual([]);
      expect(tool.privacyMode).toBe("browser-only");
      expect(tool.accountRequired).toBe(false);
      expect(tool.fileUploadRequired).toBe(false);
      expect(tool.telemetry).toBe("none");
      expect(tool.officialSources.length).toBeGreaterThan(0);
      expect(tool.unsupportedCases.length).toBeGreaterThan(0);
      expect(tool.relatedSlugs.length).toBeGreaterThanOrEqual(2);
      expect(tool.axalUpgradePath).toMatch(/\bAxal\b/);
    }
  });

  it("keeps related tool links within the launch register", () => {
    const slugs = new Set(TOOLS.map((tool) => tool.slug));

    for (const tool of TOOLS) {
      for (const relatedSlug of tool.relatedSlugs) {
        expect(slugs.has(relatedSlug), `${tool.slug} -> ${relatedSlug}`).toBe(true);
      }
    }
  });

  it("fails validation after the source stale-after window expires", () => {
    const errors = validateToolMeta(TOOLS[0], "2026-08-20");

    expect(errors).toContain("MSME Samadhaan delayed payment monitoring system source review is stale");
  });
});
