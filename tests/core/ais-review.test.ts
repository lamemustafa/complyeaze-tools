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
});
