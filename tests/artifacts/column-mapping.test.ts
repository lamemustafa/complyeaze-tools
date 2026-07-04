import { describe, expect, it } from "vitest";
import { parseDelimitedTable } from "../../packages/core/src/csv";
import { applyColumnMapping } from "../../packages/artifacts/src/column-mapping";
import {
  buildToolReviewArtifact,
  type ArtifactToolContext,
} from "../../packages/artifacts/src/tool-output";

const gstrTool: ArtifactToolContext = {
  slug: "/gstr-2b-purchase-reconciliation-triage",
  title: "GSTR-2B Purchase Reconciliation Triage",
  officialSources: [
    {
      publisher: "GST Tutorials",
      title: "GSTR-2B User Manual",
      url: "https://tutorial.gst.gov.in/userguide/returns/Manual_gstr2b.htm",
      lastReviewedAt: "2026-07-02",
    },
  ],
  unsupportedCases: ["Does not determine ITC eligibility."],
};

describe("applyColumnMapping", () => {
  it("copies detected source columns into expected artifact columns", () => {
    const parsed = parseDelimitedTable("Party Name,Bill No,Tax\nAcme Components,INV-102,18000");
    const mapped = applyColumnMapping(parsed, {
      supplier: "partyName",
      invoice: "billNo",
      taxAmount: "tax",
    });

    expect(mapped.headers).toEqual([
      "partyName",
      "billNo",
      "tax",
      "supplier",
      "invoice",
      "taxAmount",
    ]);
    expect(mapped.rows[0]).toEqual(
      expect.objectContaining({
        partyName: "Acme Components",
        billNo: "INV-102",
        tax: "18000",
        supplier: "Acme Components",
        invoice: "INV-102",
        taxAmount: "18000",
      }),
    );
    expect(mapped.originalHeaders).toEqual(["Party Name", "Bill No", "Tax"]);
    expect(parsed.rows[0]).not.toHaveProperty("supplier");
  });

  it("ignores mappings whose source column is not present", () => {
    const parsed = parseDelimitedTable("Party Name,Bill No\nAcme Components,INV-102");
    const mapped = applyColumnMapping(parsed, {
      taxAmount: "tax",
    });

    expect(mapped.headers).toEqual(["partyName", "billNo"]);
    expect(mapped.rows[0]).not.toHaveProperty("taxAmount");
  });

  it("ignores unsafe object keys in mapping definitions", () => {
    const parsed = parseDelimitedTable("Party Name\nAcme Components");
    const protoKey = ["__", "proto__"].join("");
    const mapping = Object.fromEntries([
      [protoKey, "partyName"],
      ["constructor", "partyName"],
      ["prototype", "partyName"],
    ]);
    const mapped = applyColumnMapping(parsed, mapping);

    expect(mapped.headers).toEqual(["partyName"]);
    expect(mapped.rows[0]).not.toHaveProperty("__proto__");
    expect(mapped.rows[0]).not.toHaveProperty("constructor");
    expect(mapped.rows[0]).not.toHaveProperty("prototype");
  });

  it("allows digit-leading parsed headers as mapping sources", () => {
    const parsed = parseDelimitedTable("3B Error\nTimed out");
    const mapped = applyColumnMapping(parsed, {
      error: "3bError",
    });

    expect(mapped.headers).toEqual(["3bError", "error"]);
    expect(mapped.rows[0]).toEqual(
      expect.objectContaining({
        "3bError": "Timed out",
        error: "Timed out",
      }),
    );
  });

  it("lets table artifact builders use mapped columns before required-column validation", () => {
    const result = buildToolReviewArtifact({
      tool: gstrTool,
      input: [
        "Source Type,Party Name,Bill No,Tax",
        "purchase,Acme Components,INV-102,18000",
        "2b,Acme Components,INV-102,18000",
      ].join("\n"),
      options: {
        columnMapping: {
          source: "sourceType",
          supplier: "partyName",
          invoice: "billNo",
          taxAmount: "tax",
        },
      },
    });

    expect(result.status).toBe("ready");
    expect(result.text).toContain("GSTR-2B purchase reconciliation triage");
    expect(result.text).toContain("Matched within tolerance: 1");
    expect(result.text).toContain("Column mapping: source<-sourceType, supplier<-partyName, invoice<-billNo, taxAmount<-tax");
  });

  it("reports only effective mappings for expected artifact columns", () => {
    const result = buildToolReviewArtifact({
      tool: gstrTool,
      input: [
        "Source Type,Party Name,Bill No,Tax",
        "purchase,Acme Components,INV-102,18000",
        "2b,Acme Components,INV-102,18000",
      ].join("\n"),
      options: {
        columnMapping: {
          source: "sourceType",
          supplier: "partyName",
          invoice: "billNo",
          taxAmount: "tax",
          arbitraryNote: "partyName",
        },
      },
    });

    expect(result.status).toBe("ready");
    expect(result.text).toContain("Column mapping: source<-sourceType, supplier<-partyName, invoice<-billNo, taxAmount<-tax");
    expect(result.text).toContain("Input headers: Source Type, Party Name, Bill No, Tax");
    expect(result.text).not.toContain("mapped from");
    expect(result.text).not.toContain("arbitraryNote<-partyName");
  });
});
