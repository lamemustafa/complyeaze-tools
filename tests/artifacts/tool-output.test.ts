import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildToolReviewArtifact,
  buildOutput,
  configs,
  getToolArtifactDefinition,
  type WorkbenchTool,
} from "../../packages/artifacts/src/index";

const msmeTool: WorkbenchTool = {
  slug: "/msme-45-day-payment-due-date-calculator",
  h1: "MSME Payables Age Triage",
  officialSources: [
    {
      publisher: "Development Commissioner MSME",
      title: "DC-MSME FAQ",
      url: "https://www.dcmsme.gov.in/old/faq/faq.htm",
      lastReviewedAt: "2026-07-02",
    },
  ],
  unsupportedCases: ["Does not decide final interest, disallowance, or legal default."],
};

const gstr2bTool: WorkbenchTool = {
  slug: "/gstr-2b-purchase-reconciliation-triage",
  h1: "GSTR-2B Purchase Reconciliation Triage",
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

const gstrFollowUpTool: WorkbenchTool = {
  slug: "/gstr-2b-missing-invoice-vendor-follow-up",
  h1: "GSTR-2B Missing Invoice Vendor Follow-up Generator",
  officialSources: gstr2bTool.officialSources,
  unsupportedCases: ["Does not determine ITC eligibility."],
};

describe("tool output artifact contract", () => {
  it("includes row-count, source, boundary, and trust links for every parsed tool output", () => {
    for (const [slug, config] of Object.entries(configs)) {
      if (slug === "/privacy/review-copy-builder") continue;

      const result = buildToolReviewArtifact({
        tool: {
          slug,
          title: config.outputLabel,
          officialSources: gstr2bTool.officialSources,
          unsupportedCases: ["Synthetic boundary for test."],
        },
        input: config.sample,
        asOfDate: slug === "/msme-45-day-payment-due-date-calculator" ? "2026-07-02" : "",
      });

      expect(result.status, slug).toBe("ready");
      expect(result.text, slug).toContain("Rows parsed:");
      expect(result.text, slug).toContain("rows accepted for output:");
      expect(result.text, slug).toContain("Sources to verify:");
      expect(result.text, slug).toContain("Tool boundary:");
      expect(result.text, slug).toContain("Source register: https://tools.complyeaze.com/source/");
      expect(result.text, slug).toContain("Terms and disclaimer: https://tools.complyeaze.com/terms/");
      expect(result.text, slug).toContain("Privacy notes: https://tools.complyeaze.com/privacy/");
      expect(result.text, slug).toContain(
        "Browser-local draft: files are processed in your browser. No account or file upload required.",
      );
    }
  });

  it("returns explicit ready or blocked results instead of requiring text-prefix checks", () => {
    const result = buildToolReviewArtifact({
      tool: {
        slug: "/gstr-2b-purchase-reconciliation-triage",
        title: "GSTR-2B Purchase Reconciliation Triage",
        officialSources: gstr2bTool.officialSources,
        unsupportedCases: gstr2bTool.unsupportedCases,
      },
      input: "source,supplier,invoice,taxAmount\n2b,Metro Inputs,INV-777,900",
    });

    expect(result.status).toBe("ready");
    expect(result.text).toContain("GSTR-2B purchase reconciliation triage");

    const blocked = buildToolReviewArtifact({
      tool: {
        slug: "/gstr-2b-purchase-reconciliation-triage",
        title: "GSTR-2B Purchase Reconciliation Triage",
        officialSources: gstr2bTool.officialSources,
        unsupportedCases: gstr2bTool.unsupportedCases,
      },
      input: "",
    });

    expect(blocked).toEqual({
      status: "blocked",
      text: "Paste rows to create a draft output.",
      reason: "empty-input",
    });
  });

  it("keeps artifacts independent from source-register runtime imports", () => {
    const source = readFileSync(
      join(process.cwd(), "packages", "artifacts", "src", "tool-output.ts"),
      "utf8",
    );

    expect(source).not.toContain("@complyeaze-tools/source-register");
    expect(getToolArtifactDefinition("/gstr-2b-purchase-reconciliation-triage")).toEqual({
      requiredColumns: ["source", "supplier", "invoice", "taxAmount or split igst/cgst/sgst"],
      requiredColumnGroups: [
        ["source"],
        ["supplier"],
        ["invoice"],
        ["taxAmount", "itcAmount", "amount", "igst", "cgst", "sgst"],
      ],
      requiredValueColumnGroups: [["source"], ["supplier"], ["invoice"]],
      sourceLabel: "GSTR-2B reconciliation triage rows",
    });
  });

  it("keeps artifact URL normalization free of regex-based path trimming", () => {
    const source = readFileSync(
      join(process.cwd(), "packages", "artifacts", "src", "tool-output-footer.ts"),
      "utf8",
    );

    expect(source).not.toContain(".replace(/\\/+$/");
    expect(source).not.toContain("/\\/+$/");
    expect(source).not.toContain("/\\.[a-zA-Z0-9]+$/");
  });

  it("excludes rows with blank required cells from MSME output and reports diagnostics", () => {
    const output = buildOutput(
      msmeTool,
      [
        "vendor,amount,acceptanceDate,writtenAgreement,agreedPaymentDays,udyamEvidence",
        "Acme Components,125000,2026-05-01,no,,missing",
        ",42000,2026-05-01,yes,30,available",
      ].join("\n"),
      configs["/msme-45-day-payment-due-date-calculator"],
      "2026-07-02",
    );

    expect(output).toContain("Acme Components | review-start age");
    expect(output).not.toContain("Unnamed vendor | review-start age");
    expect(output).toContain(
      "Rows parsed: 2; rows accepted for output: 1; blank rows skipped: 0; invalid rows needing review: 1.",
    );
    expect(output).toContain(
      "Row 3: required-cell-empty - Missing required value for vendor.",
    );
  });

  it("preserves MSME rows with blank review dates for missing-date manual review", () => {
    const output = buildOutput(
      msmeTool,
      ["vendor,amount,acceptanceDate", "Acme Components,125000,"].join("\n"),
      configs["/msme-45-day-payment-due-date-calculator"],
      "2026-07-02",
    );

    expect(output).toContain("Acme Components | review-start age missing days");
    expect(output).toContain("review date missing");
    expect(output).toContain("missing-review-date");
    expect(output).toContain(
      "Rows parsed: 1; rows accepted for output: 1; blank rows skipped: 0; invalid rows needing review: 0.",
    );
    expect(output).not.toContain("required-cell-empty");
  });

  it("preserves MSME rows that use deemed acceptance date instead of acceptance date", () => {
    const output = buildOutput(
      msmeTool,
      [
        "vendor,amount,acceptanceDate,deemedAcceptanceDate,writtenAgreement",
        "Acme Components,125000,,2026-05-04,no",
      ].join("\n"),
      configs["/msme-45-day-payment-due-date-calculator"],
      "2026-07-02",
    );

    expect(output).toContain("Acme Components | review-start age");
    expect(output).toContain("review date 2026-05-20");
    expect(output).toContain(
      "Rows parsed: 1; rows accepted for output: 1; blank rows skipped: 0; invalid rows needing review: 0.",
    );
    expect(output).not.toContain("required-cell-empty");
  });

  it("reports optional trailing missing cells without excluding otherwise valid rows", () => {
    const output = buildOutput(
      msmeTool,
      [
        "vendor,amount,acceptanceDate,paymentDate",
        "Acme Components,125000,2026-05-01",
      ].join("\n"),
      configs["/msme-45-day-payment-due-date-calculator"],
      "2026-07-02",
    );

    expect(output).toContain("Acme Components | review-start age");
    expect(output).toContain(
      "Rows parsed: 1; rows accepted for output: 1; blank rows skipped: 0; invalid rows needing review: 0.",
    );
    expect(output).toContain("Row 2: missing-cell - Missing value for paymentDate.");
  });

  it("skips parser-shape issues before GSTR reconciliation domain output", () => {
    const output = buildOutput(
      gstr2bTool,
      [
        "source,supplier,invoice,taxAmount",
        "purchase,Acme Components,INV-102,18000",
        "2b,,INV-999,900",
        "2b,Acme Components,INV-102,18000",
      ].join("\n"),
      configs["/gstr-2b-purchase-reconciliation-triage"],
      "",
    );

    expect(output).toContain("Rows reviewed: 2");
    expect(output).not.toContain("Bad Supplier");
    expect(output).toContain(
      "Rows parsed: 3; rows accepted for output: 2; blank rows skipped: 0; invalid rows needing review: 1.",
    );
    expect(output).toContain("Row 3: required-cell-empty - Missing required value for supplier.");
  });

  it("preserves GSTR reconciliation rows that use split tax components instead of taxAmount", () => {
    const output = buildOutput(
      gstr2bTool,
      [
        "source,supplier,invoice,taxAmount,igst,cgst,sgst",
        "purchase,Acme Components,INV-102,,0,9000,9000",
        "2b,Acme Components,INV-102,,0,9000,9000",
      ].join("\n"),
      configs["/gstr-2b-purchase-reconciliation-triage"],
      "",
    );

    expect(output).toContain("Rows reviewed: 2");
    expect(output).toContain("Matched within tolerance: 1");
    expect(output).toContain(
      "Rows parsed: 2; rows accepted for output: 2; blank rows skipped: 0; invalid rows needing review: 0.",
    );
    expect(output).not.toContain("required-cell-empty");
  });

  it("surfaces professional GSTR-2B context flags in strict-match output", () => {
    const output = buildOutput(
      gstr2bTool,
      [
        "source,supplier,gstin,invoice,invoiceDate,documentType,taxAmount,itcAvailability,imsStatus",
        "purchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,2026-05-01,Invoice,18000,,",
        "2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,2026-05-01,Invoice,18000,No,Rejected",
      ].join("\n"),
      configs["/gstr-2b-purchase-reconciliation-triage"],
      "",
      { strictGstrMatch: true },
    );

    expect(output).toContain(
      "Match mode: GSTIN/supplier + invoice + invoice date + document type + amendment table context",
    );
    expect(output).toContain("ITC/IMS context review: 1");
    expect(output).toContain("context-review | Acme Components | inv102");
    expect(output).toContain(
      "Professional context: ITC availability marked not available; IMS status marked rejected",
    );
  });

  it("preserves blank-tax GSTR rows so reconciliation can surface amount mismatches", () => {
    const output = buildOutput(
      gstr2bTool,
      [
        "source,supplier,invoice,taxAmount",
        "purchase,Acme Components,INV-102,",
        "2b,Acme Components,INV-102,18000",
      ].join("\n"),
      configs["/gstr-2b-purchase-reconciliation-triage"],
      "",
    );

    expect(output).toContain("Rows reviewed: 2");
    expect(output).toContain("Value mismatch: 1");
    expect(output).toContain("value-mismatch | Acme Components | inv102");
    expect(output).toContain(
      "Rows parsed: 2; rows accepted for output: 2; blank rows skipped: 0; invalid rows needing review: 0.",
    );
    expect(output).not.toContain("extra-in-2b | Acme Components");
  });

  it("uses rich public sample fields for supplier follow-up drafts", () => {
    const output = buildOutput(
      gstrFollowUpTool,
      configs["/gstr-2b-missing-invoice-vendor-follow-up"].sample,
      configs["/gstr-2b-missing-invoice-vendor-follow-up"],
      "",
    );

    expect(output).toContain("Email draft");
    expect(output).toContain("WhatsApp-ready summary");
    expect(output).toContain("GSTIN: 27ABCDE1234F1Z5");
    expect(output).toContain("Tax period: May 2026");
    expect(output).toContain("Document type: Tax Invoice");
    expect(output).toContain("Tax amount: 18000");
  });
});
