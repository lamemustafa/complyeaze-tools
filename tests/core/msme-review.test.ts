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
        reviewBasis:
          "No written agreement: candidate marker uses the day after 15 days from acceptance/deemed acceptance.",
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
        reviewBasis: "Written agreement: user-entered payment period used for candidate marker.",
        possibleFlag: "review-needed",
      }),
    );
    expect(rows[1]).toEqual(
      expect.objectContaining({
        reviewDate: "2026-06-16",
        reviewBasis:
          "Written agreement exceeds 45 days: candidate marker capped at 45 days from acceptance/deemed acceptance.",
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
    expect(rows[1].evidenceChecks).toContain(
      "Review dispute correspondence separately before sending a vendor or management follow-up.",
    );
    expect(rows[1].evidenceChecks).toContain("Confirm whether the paid amount is partial and whether a balance remains open.");
  });

  it("keeps every review basis framed as a candidate marker instead of a conclusion", () => {
    const rows = buildMsmePayableReview(
      [
        "vendor,amount,acceptanceDate,writtenAgreement,agreedPaymentDays,udyamEvidence",
        "No Agreement,10000,2026-05-01,no,,available",
        "Written Under Cap,10000,2026-05-01,yes,30,available",
        "Written Over Cap,10000,2026-05-01,yes,60,available",
        "Written Missing,10000,2026-05-01,yes,,available",
        "Unknown Agreement,10000,2026-05-01,unknown,,available",
      ].join("\n"),
      new Date("2026-07-02"),
    );

    expect(rows.map((row) => row.reviewBasis)).toEqual([
      "No written agreement: candidate marker uses the day after 15 days from acceptance/deemed acceptance.",
      "Written agreement: user-entered payment period used for candidate marker.",
      "Written agreement exceeds 45 days: candidate marker capped at 45 days from acceptance/deemed acceptance.",
      "Written agreement entered without payment days: confirm terms before relying on this row.",
      "Agreement not provided: 45-day screening marker used until terms are confirmed.",
    ]);
    expect(rows.map((row) => row.reviewBasis).join(" ").toLowerCase()).not.toMatch(
      /due date|deadline|legal default|interest payable|43b\(h\) compliant|filing-ready|msefc-ready|eligible to file|admissible claim|recoverable amount|verified udyam/u,
    );
  });

  it("exposes review-start basis and candidate marker without treating invoice fallback as a statutory date", () => {
    const rows = buildMsmePayableReview(
      [
        "vendor,amount,invoiceDate,writtenAgreement,udyamEvidence",
        "Invoice Fallback Vendor,125000,2026-05-01,unknown,missing",
      ].join("\n"),
      new Date("2026-07-02"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        reviewStartSource: "invoice-date-fallback",
        reviewStartDate: "2026-05-01",
        candidateReviewMarkerDate: "2026-06-15",
        applicableLimitDays: 45,
        daysPastCandidateMarker: 17,
        possibleFlag: "review-needed",
      }),
    );
    expect(rows[0].missingFactChecks).toContain(
      "Confirm acceptance or deemed acceptance date; invoice date is only a fallback for screening.",
    );
    expect(rows[0].nextReviewActions).toContain(
      "Confirm acceptance/deemed-acceptance evidence before using the marker in a management note.",
    );
  });

  it("uses objection resolution date as a review-start basis when entered", () => {
    const rows = buildMsmePayableReview(
      [
        "vendor,amount,acceptanceDate,objectionRaisedDate,objectionResolvedDate,writtenAgreement,agreedPaymentDays,udyamEvidence",
        "Objection Vendor,50000,2026-05-01,2026-05-10,2026-05-20,yes,30,available",
      ].join("\n"),
      new Date("2026-07-02"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        reviewStartSource: "objection-resolved-date",
        reviewStartDate: "2026-05-20",
        candidateReviewMarkerDate: "2026-06-19",
        applicableLimitDays: 30,
      }),
    );
    expect(rows[0].missingFactChecks).toContain(
      "Review objection correspondence; objection fields are screening prompts, not dispute adjudication.",
    );
  });

  it("keeps payment date without amount as unknown balance context", () => {
    const rows = buildMsmePayableReview(
      "vendor,amount,acceptanceDate,writtenAgreement,paymentDate\nPayment Context Vendor,10000,2026-05-01,no,2026-05-20",
      new Date("2026-07-02"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        paymentStatus: "unknown",
        openBalance: null,
      }),
    );
    expect(rows[0].missingFactChecks).toContain(
      "Payment date was entered without paidAmount; confirm whether any balance remains open.",
    );
  });

  it("flags Udyam registration after invoice date as prior-registration review context", () => {
    const rows = buildMsmePayableReview(
      [
        "vendor,amount,invoiceDate,acceptanceDate,writtenAgreement,udyamEvidence,udyamRegistrationDate",
        "Late Udyam Vendor,25000,2026-05-01,2026-05-02,no,available,2026-05-10",
      ].join("\n"),
      new Date("2026-07-02"),
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        udyamEvidenceStatus: "available",
        udyamRegistrationDate: "2026-05-10",
      }),
    );
    expect(rows[0].missingFactChecks).toContain(
      "Review whether Udyam/MSE evidence predates the disputed invoice; this tool does not decide admissibility.",
    );
  });
});
