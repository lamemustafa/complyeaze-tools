import { describe, expect, it } from "vitest";
import { parseDelimitedTable, parseSimpleCsv, normalizeHeaderKey } from "../../packages/core/src/csv";

describe("parseDelimitedTable", () => {
  it("handles BOM headers, quoted commas, escaped quotes, and multiline cells", () => {
    const parsed = parseDelimitedTable(
      '\uFEFFSupplier,Invoice Date,Note\n"Acme, Components",2026-05-01,"said ""review""\nagain"',
    );

    expect(parsed.delimiter).toBe(",");
    expect(parsed.headers).toEqual(["supplier", "invoiceDate", "note"]);
    expect(parsed.rows).toEqual([
      {
        supplier: "Acme, Components",
        invoiceDate: "2026-05-01",
        note: 'said "review"\nagain',
      },
    ]);
    expect(parsed.issues).toEqual([]);
  });

  it("supports Excel and Google Sheets TSV paste with normalized headers", () => {
    const parsed = parseDelimitedTable(
      "Vendor Name\tTax Amount\tRecords Amount\nNorthline Supplies\t18,000.50\t18000.50",
    );

    expect(parsed.delimiter).toBe("\t");
    expect(parsed.rows[0]).toEqual({
      vendorName: "Northline Supplies",
      taxAmount: "18,000.50",
      recordsAmount: "18000.50",
    });
  });

  it("supports semicolon-delimited paste", () => {
    const parsed = parseDelimitedTable("source;supplier;invoice\n2b;Metro Inputs;INV-777");

    expect(parsed.delimiter).toBe(";");
    expect(parsed.rows[0]).toEqual({
      source: "2b",
      supplier: "Metro Inputs",
      invoice: "INV-777",
    });
  });

  it("reports blank, missing-cell, and extra-cell diagnostics without throwing", () => {
    const parsed = parseDelimitedTable(
      ["source,supplier,invoice", "", "purchase,Acme Components", "2b,Metro Inputs,INV-777,extra"].join("\n"),
    );

    expect(parsed.skippedBlankRows).toBe(1);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.issues).toEqual([
      expect.objectContaining({
        code: "missing-cell",
        rowNumber: 3,
        column: "invoice",
      }),
      expect.objectContaining({
        code: "extra-cell",
        rowNumber: 4,
      }),
    ]);
  });

  it("keeps parseSimpleCsv as a compatibility wrapper over normalized rows", () => {
    expect(parseSimpleCsv("Invoice Date,Tax Amount\n2026-05-01,18000")).toEqual([
      {
        invoiceDate: "2026-05-01",
        taxAmount: "18000",
      },
    ]);
  });
});

describe("normalizeHeaderKey", () => {
  it("normalizes common compliance headers to stable keys", () => {
    expect(normalizeHeaderKey("Invoice Date")).toBe("invoiceDate");
    expect(normalizeHeaderKey("invoice_date")).toBe("invoiceDate");
    expect(normalizeHeaderKey("GSTIN")).toBe("gstin");
    expect(normalizeHeaderKey("TDS/TCS Amount")).toBe("tdsTcsAmount");
  });
});
