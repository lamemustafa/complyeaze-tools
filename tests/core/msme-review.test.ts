import { describe, expect, it } from "vitest";
import { buildMsmePayableReview } from "../../packages/core/src/msme";

describe("buildMsmePayableReview", () => {
  it("flags rows older than 45 days while keeping newer rows reviewable", () => {
    const rows = buildMsmePayableReview(
      [
        "vendor,amount,invoiceDate,acceptanceDate",
        "Acme Components,125000,2026-05-01,2026-05-03",
        "Northline Supplies,42000,2026-06-20,2026-06-21",
      ].join("\n"),
      new Date("2026-07-02"),
    );

    expect(rows).toEqual([
      expect.objectContaining({
        vendor: "Acme Components",
        ageDays: 60,
        possibleFlag: "review-needed",
      }),
      expect.objectContaining({
        vendor: "Northline Supplies",
        ageDays: 11,
        possibleFlag: "within-review-window",
      }),
    ]);
  });

  it("marks missing or invalid acceptance dates without inventing a deadline", () => {
    const rows = buildMsmePayableReview(
      "vendor,amount,acceptanceDate\nAcme Components,125000,not-a-date",
      new Date("2026-07-02"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        ageDays: null,
        possibleFlag: "missing-review-date",
      }),
    );
  });

  it("accepts Excel-style headers after paste normalization", () => {
    const rows = buildMsmePayableReview(
      "Vendor Name\tAmount\tInvoice Date\tAcceptance Date\nNorthline Supplies\t42000\t2026-06-20\t2026-06-21",
      new Date("2026-07-02"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        vendor: "Northline Supplies",
        amount: "42000",
        invoiceDate: "2026-06-20",
        acceptanceDate: "2026-06-21",
        ageDays: 11,
        possibleFlag: "within-review-window",
      }),
    );
  });

  it("uses appointed-day review basis when no written agreement is present", () => {
    const rows = buildMsmePayableReview(
      [
        "vendor,amount,acceptanceDate,writtenAgreement,udyamEvidence",
        "Acme Components,125000,2026-05-01,no,available",
      ].join("\n"),
      new Date("2026-07-02"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        reviewDate: "2026-05-17",
        reviewBasis: "No written agreement: appointed-day review date after 15 days from acceptance/deemed acceptance.",
        daysPastReviewDate: 46,
        possibleFlag: "review-needed",
      }),
    );
  });

  it("uses written agreement days but caps review at 45 days when terms exceed 45", () => {
    const rows = buildMsmePayableReview(
      [
        "vendor,amount,acceptanceDate,writtenAgreement,agreedPaymentDays,udyamEvidence",
        "Northline Supplies,42000,2026-05-02,yes,30,available",
        "Delta Traders,54000,2026-05-02,yes,60,available",
      ].join("\n"),
      new Date("2026-06-20"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        reviewDate: "2026-06-01",
        reviewBasis: "Written agreement: user-entered payment period used for review.",
        possibleFlag: "review-needed",
      }),
    );
    expect(rows[1]).toEqual(
      expect.objectContaining({
        reviewDate: "2026-06-16",
        reviewBasis: "Written agreement exceeds 45 days: review capped at 45 days from acceptance/deemed acceptance.",
        possibleFlag: "review-needed",
      }),
    );
  });

  it("keeps paid, disputed, partial, and missing Udyam evidence as review context", () => {
    const rows = buildMsmePayableReview(
      [
        "vendor,amount,acceptanceDate,writtenAgreement,agreedPaymentDays,paymentDate,paidAmount,disputeStatus,udyamEvidence",
        "Paid Vendor,10000,2026-05-01,yes,30,2026-05-25,10000,,available",
        "Disputed Vendor,20000,2026-05-01,no,,,5000,disputed,missing",
      ].join("\n"),
      new Date("2026-07-02"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        possibleFlag: "paid-review-context",
        paymentStatus: "paid",
      }),
    );
    expect(rows[1]).toEqual(
      expect.objectContaining({
        possibleFlag: "disputed-review-context",
        paymentStatus: "partly-paid",
        udyamEvidenceStatus: "missing",
      }),
    );
    expect(rows[1].evidenceChecks).toContain("Collect or verify Udyam/MSE evidence before relying on this row.");
    expect(rows[1].evidenceChecks).toContain("Review dispute correspondence separately before sending a demand or management note.");
    expect(rows[1].evidenceChecks).toContain("Confirm whether the paid amount is partial and whether a balance remains open.");
  });
});
