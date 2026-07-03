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
        possibleFlag: "review",
      }),
      expect.objectContaining({
        vendor: "Northline Supplies",
        ageDays: 11,
        possibleFlag: "within-window",
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
        possibleFlag: "missing-date",
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
        possibleFlag: "within-window",
      }),
    );
  });
});
