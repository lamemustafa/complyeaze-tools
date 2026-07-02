import { describe, expect, it } from "vitest";
import { maskIndianIdentifiers } from "../../packages/safety/src/identifiers";

describe("maskIndianIdentifiers", () => {
  it("masks PAN, TAN, and GSTIN-like values in pasted review text", () => {
    expect(
      maskIndianIdentifiers(
        "PAN ABCDE1234F, TAN ABCD12345E, GSTIN 27ABCDE1234F1Z5",
      ),
    ).toBe("PAN [PAN masked], TAN [TAN masked], GSTIN [GSTIN masked]");
  });

  it("does not rewrite ordinary compliance prose", () => {
    expect(maskIndianIdentifiers("Vendor requested invoice follow-up.")).toBe(
      "Vendor requested invoice follow-up.",
    );
  });
});
