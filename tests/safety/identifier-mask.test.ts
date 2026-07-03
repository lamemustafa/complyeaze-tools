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
    expect(result).toHaveProperty("manualReviewChecklist");
    expect(result.manualReviewChecklist).toEqual([
      "Re-read names, addresses, and free-form client context.",
      "Check whether screenshots, PDFs, scanned text, or attachments were reviewed outside this text box.",
      "Confirm masked placeholders did not change the meaning of the review note.",
      "Share only the smallest excerpt needed for professional review.",
    ]);
    expect(result.checked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "pan",
          count: 1,
          status: "found-and-masked",
        }),
        expect.objectContaining({
          key: "gstin",
          count: 0,
          status: "checked-not-found",
        }),
      ]),
    );
  });

  it("masks conservative company and registration identifiers without generic number masking", () => {
    const result = maskIndianIdentifiersWithReport(
      "CIN U12345MH2020PLC123456, Udyam UDYAM-MH-12-1234567, DIN 01234567, LLPIN AAA-1234, Aadhaar 1234-5678-9012, loose 12345678",
    );

    expect(result.text).toContain("[CIN masked]");
    expect(result.text).toContain("[Udyam registration masked]");
    expect(result.text).toContain("DIN [DIN/DPIN-like number masked]");
    expect(result.text).toContain("LLPIN [LLPIN-like identifier masked]");
    expect(result.text).toContain("[Aadhaar-like number masked]");
    expect(result.text).toContain("loose 12345678");
    expect(result.counts).toMatchObject({
      cin: 1,
      udyam: 1,
      dinDpin: 1,
      llpin: 1,
      aadhaar: 1,
    });
  });
});
