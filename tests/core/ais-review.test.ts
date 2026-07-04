import { describe, expect, it } from "vitest";
import { buildTaxStatementMismatchReview } from "../../packages/core/src/ais";

describe("buildTaxStatementMismatchReview", () => {
  it("normalizes AIS/Form 26AS rows into tax-statement review items", () => {
    const review = buildTaxStatementMismatchReview(
      [
        "source,tan,section,category,amount,recordsAmount,note,feedbackAction",
        "AIS,SYNTH12345A,194A,Interest,5400,0,missing in books,Check AIS feedback",
        "Form 26AS,SYNTH54321B,194C,TDS,1200,1000,TDS mismatch,Ask deductor to verify",
      ].join("\n"),
    );

    expect(review).toHaveLength(2);
    expect(review[0]).toEqual(
      expect.objectContaining({
        source: "AIS",
        tan: "SYNTH12345A",
        section: "194A",
        category: "Interest",
        difference: 5400,
        feedbackAction: "Check AIS feedback",
      }),
    );
  });

  it("classifies structured AIS/Form 26AS mismatch categories", () => {
    const review = buildTaxStatementMismatchReview(
      [
        "source,deductor,tan,section,category,recordsCategory,amount,recordsAmount,tdsTcsAmount,note,reviewAction",
        "AIS,Metro Bank,SYNTH12345A,194A,Interest,Interest,5400,0,540,missing in books,Review AIS row against books",
        "Form 26AS,Northline Works,SYNTH54321B,194C,Contract,Contract,1200,1000,120,TDS amount mismatch,Ask deductor to verify",
        "AIS,Acme Advisors,SYNTH22222C,194J,Professional fees,Professional fees,0,5000,,missing in AIS,Review reporting source",
        "AIS,Acme Advisors,SYNTH22222C,194J,Professional fees,Rent,5000,5000,,category mismatch,Review category before tax-record review",
      ].join("\n"),
    );

    expect(review.map((row) => row.mismatchCategory)).toEqual([
      "reported-not-in-records",
      "amount-difference",
      "records-not-in-statement",
      "identity-or-section-review",
    ]);
    expect(review[0]).toEqual(
      expect.objectContaining({
        deductor: "Metro Bank",
        deductorKey: "SYNTH12345A",
        tdsTcsAmount: "540",
        reviewAction: "Review AIS row against books",
        correctionDraft: expect.stringContaining("Metro Bank (SYNTH12345A)"),
      }),
    );
    expect(review[2]?.correctionDraft).toContain("missing from AIS/Form 26AS");
    expect(review[3]?.correctionDraft).toContain("category or section mismatch");
  });

  it("flags duplicate statement rows before treating them as matched", () => {
    const review = buildTaxStatementMismatchReview(
      [
        "source,deductor,tan,section,category,amount,recordsAmount",
        "AIS,Metro Bank,SYNTH12345A,194A,Interest,5400,5400",
        "AIS,Metro Bank,SYNTH12345A,194A,Interest,5400,5400",
      ].join("\n"),
    );

    expect(review.map((row) => row.mismatchCategory)).toEqual([
      "duplicate-statement",
      "duplicate-statement",
    ]);
    expect(review[0]?.correctionDraft).toContain("duplicate statement rows");
  });

  it("uses canonical category labels and avoids negative match labels being matched", () => {
    const review = buildTaxStatementMismatchReview(
      [
        "source,deductor,tan,section,category,recordsCategory,amount,recordsAmount,mismatchCategory",
        "AIS,Metro Bank,SYNTH12345A,194A,Interest,Interest,5400,0,reported-not-in-records",
        "AIS,Northline Works,SYNTH54321B,194C,Contract,Contract,1200,1000,not matched",
      ].join("\n"),
    );

    expect(review.map((row) => row.mismatchCategory)).toEqual([
      "reported-not-in-records",
      "amount-difference",
    ]);
  });

  it("does not dedupe missing identities or distinct signed amounts", () => {
    const missingIdentityRows = buildTaxStatementMismatchReview(
      [
        "source,deductor,tan,section,category,amount,recordsAmount",
        "AIS,,,194A,Interest,5400,5400",
        "AIS,,,194A,Interest,5400,5400",
      ].join("\n"),
    );
    const signedAmountRows = buildTaxStatementMismatchReview(
      [
        "source,deductor,tan,section,category,amount,recordsAmount",
        "AIS,Metro Bank,SYNTH12345A,194A,Interest,-100,0",
        "AIS,Metro Bank,SYNTH12345A,194A,Interest,100,0",
      ].join("\n"),
    );

    expect(missingIdentityRows.map((row) => row.mismatchCategory)).toEqual(["matched", "matched"]);
    expect(signedAmountRows.map((row) => row.mismatchCategory)).toEqual([
      "amount-difference",
      "reported-not-in-records",
    ]);
  });

  it("preserves descriptive missing-in-books and missing-in-AIS labels", () => {
    const review = buildTaxStatementMismatchReview(
      [
        "source,category,recordsCategory,amount,recordsAmount,mismatchCategory",
        "AIS,Interest,Interest,5400,0,amount missing in books",
        "AIS,Interest,Interest,0,5000,missing from AIS",
      ].join("\n"),
    );

    expect(review.map((row) => row.mismatchCategory)).toEqual([
      "reported-not-in-records",
      "records-not-in-statement",
    ]);
  });
});
