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
    expect(TOOLS.map((tool) => tool.slug)).toEqual(expectedSlugs);

    for (const tool of TOOLS) {
      expect(validateToolMeta(tool, "2026-07-02")).toEqual([]);
      expect(tool.privacyMode).toBe("browser-only");
      expect(tool.accountRequired).toBe(false);
      expect(tool.fileUploadRequired).toBe(false);
      expect(tool.telemetry).toBe("none");
      expect(tool.officialSources.length).toBeGreaterThan(0);
      expect(tool.unsupportedCases.length).toBeGreaterThan(0);
      expect(tool.axalUpgradePath).toMatch(/\bAxal\b/);
    }
  });
});
