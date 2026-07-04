import { describe, expect, it } from "vitest";
import {
  buildTdsSectionTranslation,
  VERIFIED_TDS_MAPPINGS,
} from "../../packages/core/src/it-act-2025-tds-translator";

describe("buildTdsSectionTranslation", () => {
  it("matches a verified old section against its new-Act citation", () => {
    const results = buildTdsSectionTranslation("oldSection\n194C");

    expect(results[0]).toEqual(
      expect.objectContaining({
        status: "matched",
        mapping: expect.objectContaining({
          newCitation: "Section 393(1), Table Sl. No. 6(i)/(ii)",
        }),
      }),
    );
  });

  it("matches regardless of a Section prefix or hyphenation", () => {
    const results = buildTdsSectionTranslation("oldSection\nSection 194-IA");

    expect(results[0].status).toBe("matched");
    expect(results[0].mapping?.paymentType).toContain("immovable property");
  });

  it("includes the stamp-duty value condition for Section 194-IA mappings", () => {
    const results = buildTdsSectionTranslation("oldSection\n194-IA");

    expect(results[0].status).toBe("matched");
    expect(results[0].mapping?.rate).toContain("higher of consideration and stamp-duty value");
    expect(results[0].mapping?.threshold).toContain("stamp-duty value");
    expect(results[0].mapping?.threshold).toContain("Rs 50 lakh");
  });

  it("does not collapse sub-clause suffixes into a different old section", () => {
    const results = buildTdsSectionTranslation("oldSection\n194-I(a)");

    expect(results[0]).toEqual(
      expect.objectContaining({
        status: "not-verified",
        mapping: null,
      }),
    );
    expect(results[0].note).toContain("Sub-clause-qualified section");
  });

  it("marks unverified sections as not-verified instead of guessing", () => {
    const results = buildTdsSectionTranslation("oldSection\n194N");

    expect(results[0]).toEqual(
      expect.objectContaining({
        status: "not-verified",
        mapping: null,
      }),
    );
    expect(results[0].note).toContain("Not in the independently verified mapping set");
  });

  it("flags a row with no section entered as missing input", () => {
    const results = buildTdsSectionTranslation("oldSection,note\n,no section entered");

    expect(results[0]).toEqual(
      expect.objectContaining({
        status: "missing-input",
        mapping: null,
      }),
    );
  });

  it("keeps every verified mapping citation traceable to Section 392, 393, or 394", () => {
    for (const mapping of VERIFIED_TDS_MAPPINGS) {
      expect(mapping.newCitation).toMatch(/Section 39[234]/);
    }
  });
});
