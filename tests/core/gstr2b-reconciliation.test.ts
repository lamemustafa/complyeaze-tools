import { describe, expect, it } from "vitest";
import { buildGstr2bReconciliationTriage } from "../../packages/core/src/gstr2b-reconciliation";

describe("buildGstr2bReconciliationTriage", () => {
  it("classifies matched, missing, extra, and mismatch rows", () => {
    const summary = buildGstr2bReconciliationTriage(
      [
        "source,supplier,gstin,invoice,taxAmount",
        "purchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000",
        "2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000",
        "purchase,Northline Supplies,SYNTH-NORTH-GSTIN,INV-205,7560",
        "2b,Northline Supplies,SYNTH-NORTH-GSTIN,INV-205,7000",
        "purchase,Delta Traders,SYNTH-DELTA-GSTIN,INV-301,5400",
        "2b,Metro Inputs,SYNTH-METRO-GSTIN,INV-777,900",
      ].join("\n"),
    );

    expect(summary.totalRows).toBe(6);
    expect(summary.counts).toMatchObject({
      matched: 1,
      "missing-in-2b": 1,
      "extra-in-2b": 1,
      "value-mismatch": 1,
      "duplicate-key": 0,
    });
    expect(summary.issues.map((issue) => issue.status)).toEqual([
      "missing-in-2b",
      "extra-in-2b",
      "value-mismatch",
      "matched",
    ]);
  });

  it("flags duplicate keys before treating rows as matched", () => {
    const summary = buildGstr2bReconciliationTriage(
      [
        "source,supplier,gstin,invoice,taxAmount",
        "purchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000",
        "purchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000",
        "2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000",
      ].join("\n"),
    );

    expect(summary.counts["duplicate-key"]).toBe(1);
    expect(summary.issues[0]).toEqual(
      expect.objectContaining({
        status: "duplicate-key",
        supplier: "Acme Components",
      }),
    );
  });

  it("routes rows with missing comparison amounts to value mismatch review", () => {
    const summary = buildGstr2bReconciliationTriage(
      [
        "source,supplier,gstin,invoice,taxAmount",
        "purchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,",
        "2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000",
      ].join("\n"),
    );

    expect(summary.counts["value-mismatch"]).toBe(1);
    expect(summary.counts.matched).toBe(0);
  });

  it("accepts pre-parsed rows and reports rows skipped by domain normalization", () => {
    const summary = buildGstr2bReconciliationTriage([
      {
        source: "purchase",
        supplier: "Acme Components",
        gstin: "SYNTH-ACME-GSTIN",
        invoice: "INV-102",
        invoiceDate: "2026-05-01",
        taxAmount: "18000",
      },
      {
        source: "2b",
        supplier: "Acme Components",
        gstin: "SYNTH-ACME-GSTIN",
        invoice: "INV-102",
        invoiceDate: "2026-05-01",
        taxAmount: "18000",
      },
      {
        source: "",
        supplier: "Skipped Supplier",
        invoice: "INV-404",
        taxAmount: "900",
      },
    ]);

    expect(summary.totalRows).toBe(2);
    expect(summary.skippedRowCount).toBe(1);
    expect(summary.counts.matched).toBe(1);
  });

  it("can use invoice date and document type in a stricter review key", () => {
    const basic = buildGstr2bReconciliationTriage(
      [
        "source,supplier,gstin,invoice,invoiceDate,documentType,taxAmount",
        "purchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,2026-05-01,Invoice,18000",
        "2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,2026-05-02,Credit Note,18000",
      ].join("\n"),
    );
    const strict = buildGstr2bReconciliationTriage(
      [
        "source,supplier,gstin,invoice,invoiceDate,documentType,taxAmount",
        "purchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,2026-05-01,Invoice,18000",
        "2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,2026-05-02,Credit Note,18000",
      ].join("\n"),
      { matchFields: ["invoiceDate", "documentType"] },
    );

    expect(basic.counts.matched).toBe(1);
    expect(strict.counts["missing-in-2b"]).toBe(1);
    expect(strict.counts["extra-in-2b"]).toBe(1);
  });

  it("sums tax components when a total tax amount column is absent", () => {
    const summary = buildGstr2bReconciliationTriage(
      [
        "source,supplier,gstin,invoice,igst,cgst,sgst",
        "purchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,0,9000,9000",
        "2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,0,9000,8997",
      ].join("\n"),
      { tolerance: 2 },
    );

    expect(summary.counts["value-mismatch"]).toBe(1);
    expect(summary.issues[0]).toEqual(
      expect.objectContaining({
        difference: 3,
      }),
    );
  });

  it("uses supplier fallback when optional GSTIN and strict-match fields are absent", () => {
    const summary = buildGstr2bReconciliationTriage(
      [
        "source,supplier,invoice,taxAmount",
        "purchase,Acme Components,INV-102,18000",
        "2b,Acme Components,INV-102,18000",
        "2b,Skipped Supplier,,900",
      ].join("\n"),
      { matchFields: ["invoiceDate", "documentType"] },
    );

    expect(summary.totalRows).toBe(2);
    expect(summary.skippedRowCount).toBe(1);
    expect(summary.counts.matched).toBe(1);
  });

  it("skips rows without a real GSTIN or supplier key", () => {
    const summary = buildGstr2bReconciliationTriage(
      [
        "source,invoice,taxAmount",
        "purchase,INV-102,18000",
        "2b,INV-102,18000",
      ].join("\n"),
    );

    expect(summary.totalRows).toBe(0);
    expect(summary.skippedRowCount).toBe(2);
    expect(summary.counts.matched).toBe(0);
  });
});
