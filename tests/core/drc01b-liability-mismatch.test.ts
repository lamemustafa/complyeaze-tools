import { describe, expect, it } from "vitest";
import { buildDrc01bLiabilityMismatchReview } from "../../packages/core/src/drc01b-liability-mismatch";

describe("buildDrc01bLiabilityMismatchReview", () => {
  it("flags periods where GSTR-1 liability exceeds GSTR-3B liability", () => {
    const rows = buildDrc01bLiabilityMismatchReview(
      [
        "gstin,period,gstr1Liability,gstr3bLiability",
        "SYNTH-ACME-GSTIN,2026-05,412000,398500",
      ].join("\n"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        flag: "review-needed",
        difference: 13500,
      }),
    );
  });

  it("does not flag periods where GSTR-3B liability is equal to or higher than GSTR-1", () => {
    const rows = buildDrc01bLiabilityMismatchReview(
      [
        "gstin,period,gstr1Liability,gstr3bLiability",
        "SYNTH-NORTH-GSTIN,2026-05,275000,275000",
        "SYNTH-DELTA-GSTIN,2026-05,190000,215000",
      ].join("\n"),
    );

    expect(rows[0].flag).toBe("no-drc01b-risk");
    expect(rows[1].flag).toBe("no-drc01b-risk");
    expect(rows[1].difference).toBe(-25000);
  });

  it("marks rows with non-numeric liability figures as missing data", () => {
    const rows = buildDrc01bLiabilityMismatchReview(
      "gstin,period,gstr1Liability,gstr3bLiability\nSYNTH-ACME-GSTIN,2026-05,not-a-number,398500",
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        flag: "missing-data",
        difference: null,
      }),
    );
  });

  it("does not assert a specific Rs or percentage threshold in the note", () => {
    const rows = buildDrc01bLiabilityMismatchReview(
      "gstin,period,gstr1Liability,gstr3bLiability\nSYNTH-ACME-GSTIN,2026-05,412000,398500",
    );

    expect(rows[0].note.toLowerCase()).not.toMatch(/\brs\.?\s*\d/);
    expect(rows[0].note).toContain("does not publish the exact");
  });

  it("flags a nil prior GSTR-3B liability without dividing by zero", () => {
    const rows = buildDrc01bLiabilityMismatchReview(
      "gstin,period,gstr1Liability,gstr3bLiability\nSYNTH-ACME-GSTIN,2026-05,50000,0",
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        flag: "review-needed",
        difference: 50000,
        percentDifference: null,
      }),
    );
  });
});
