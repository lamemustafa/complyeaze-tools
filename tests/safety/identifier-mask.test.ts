import { describe, expect, it } from "vitest";
import {
  maskIndianIdentifiers,
  maskIndianIdentifiersWithReport,
} from "../../packages/safety/src/identifiers";

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

  it("masks common identifiers case-insensitively and returns a review report", () => {
    const result = maskIndianIdentifiersWithReport(
      "pan abcde1234f, aadhaar 1234 5678 9012, email owner@example.com, phone +91 98765 43210, IFSC HDFC0001234, UPI payee@okhdfcbank, account 123456789012",
    );

    expect(result.text).toContain("[PAN masked]");
    expect(result.text).toContain("[Aadhaar-like number masked]");
    expect(result.text).toContain("[email masked]");
    expect(result.text).toContain("[phone-like number masked]");
    expect(result.text).toContain("[IFSC masked]");
    expect(result.text).toContain("[UPI ID masked]");
    expect(result.text).toContain("[bank-account-like number masked]");
    expect(result.counts).toMatchObject({
      pan: 1,
      aadhaar: 1,
      email: 1,
      phone: 1,
      ifsc: 1,
      upi: 1,
      bankAccount: 1,
    });
    expect(result.notChecked).toContain("names");
    expect(result.notChecked).toContain("addresses");
    expect(result.warning).toContain("not irreversible redaction");
  });
});
