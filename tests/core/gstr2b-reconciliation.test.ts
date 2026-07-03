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
});
