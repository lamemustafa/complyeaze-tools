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

  it("masks separator-tolerant identifiers without masking ordinary amounts or invoice numbers", () => {
    const result = maskIndianIdentifiersWithReport(
      "PAN ABCDE-1234-F, GSTIN 27 ABCDE 1234 F 1 Z 5, TAN ABCD 12345 E, Udyam UDYAM MH 12 1234567, acct # 1234 5678 9012, phone (98765) 43210, invoice INV-102, amount 18000",
    );

    expect(result.text).toContain("[PAN masked]");
    expect(result.text).toContain("[GSTIN masked]");
    expect(result.text).toContain("[TAN masked]");
    expect(result.text).toContain("[Udyam registration masked]");
    expect(result.text).toContain("acct # [bank-account-like number masked]");
    expect(result.text).toContain("[phone-like number masked]");
    expect(result.text).toContain("invoice INV-102");
    expect(result.text).toContain("amount 18000");
    expect(result.counts).toMatchObject({
      pan: 1,
      gstin: 1,
      tan: 1,
      udyam: 1,
      bankAccount: 1,
      phone: 1,
    });
  });

  it("keeps identifier separator tolerance within a single line", () => {
    const result = maskIndianIdentifiersWithReport("PAN ABCDE\n1234F\nGSTIN 27ABCDE\n1234F1Z5");

    expect(result.counts.pan).toBe(0);
    expect(result.counts.gstin).toBe(0);
    expect(result.text).toContain("PAN ABCDE\n1234F");
  });

  it("does not mask compact phone-like digits inside alphanumeric references", () => {
    const result = maskIndianIdentifiersWithReport(
      "invoice INV9876543210, file REF9123456789, mobile +919876543210",
    );

    expect(result.text).toContain("invoice INV9876543210");
    expect(result.text).toContain("file REF9123456789");
    expect(result.text).toContain("mobile [phone-like number masked]");
    expect(result.counts.phone).toBe(1);
  });

  it("masks compact Indian phone numbers when a label directly precedes the plus sign", () => {
    const result = maskIndianIdentifiersWithReport("Mobile+919876543210");

    expect(result.text).toBe("Mobile[phone-like number masked]");
    expect(result.counts.phone).toBe(1);
  });

  it("makes residual manual-review risk explicit even when no supported patterns match", () => {
    const result = maskIndianIdentifiersWithReport(
      "Client reference Alpha review note for May ledger.",
    );

    expect(result.warning).toContain("not an all-clear");
    expect(result.notChecked).toEqual(
      expect.arrayContaining([
        "partial or non-standard identifiers",
        "file names",
        "client references",
      ]),
    );
  });
});
