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
  unsupportedCases: ["Does not decide final interest, tax, or recovery positions."],
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

const aisTool: WorkbenchTool = {
  slug: "/ais-form-26as-mismatch-checker",
  h1: "AIS and Form 26AS Mismatch Checker",
  officialSources: [
    {
      publisher: "Income Tax Department",
      title: "Annual Information Statement FAQ",
      url: "https://www.incometax.gov.in/iec/foportal/ais-faq",
      lastReviewedAt: "2026-07-02",
    },
  ],
  unsupportedCases: ["Does not compute ITR tax payable, refunds, or upload AIS feedback."],
};

const gstPortalTool: WorkbenchTool = {
  slug: "/gst-portal-issue-evidence-memo",
  h1: "GST Portal Issue Evidence Memo Builder",
  officialSources: [
    {
      publisher: "GST System",
      title: "GST self-service complaint portal",
      url: "https://selfservice.gstsystem.in/",
      lastReviewedAt: "2026-07-02",
    },
  ],
  unsupportedCases: [
    "Does not prove the GST portal was globally unavailable.",
    "Does not guarantee extension, waiver, or condonation.",
  ],
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
      optionalMappableColumns: [
        "invoiceDate",
        "documentType",
        "amendmentType",
        "itcAvailability",
        "imsStatus",
        "reverseCharge",
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
    expect(output).toContain("candidate marker missing");
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
    expect(output).toContain("candidate marker 2026-05-20");
    expect(output).toContain(
      "Rows parsed: 1; rows accepted for output: 1; blank rows skipped: 0; invalid rows needing review: 0.",
    );
    expect(output).not.toContain("required-cell-empty");
  });

  it("documents acquisition evidence for Schedule 112A grandfathering inputs", () => {
    const config = configs["/schedule-112a-capital-gains-csv-builder"];
    const definition = getToolArtifactDefinition("/schedule-112a-capital-gains-csv-builder");

    expect(config.guidance).toContain("acquisitionDate");
    expect(config.guidance).toContain("purchaseDate");
    expect(config.guidance).toContain("acquiredBefore31Jan2018");
    expect(config.sample).toContain("acquisitionDate");
    expect(config.sample).toContain("2017-12-15");
    expect(definition.requiredColumns).toContain(
      "acquisitionDate, purchaseDate, or acquiredBefore31Jan2018 when fmv31Jan2018PerUnit is used",
    );
  });

  it("lets GSTR-3B pre-lock rows with blank amount values reach missing-data review", () => {
    const output = buildOutput(
      {
        slug: "/gstr3b-outward-liability-prelock-gap-checker",
        h1: "GSTR-3B Outward Liability Pre-lock Gap Checker",
        officialSources: gstr2bTool.officialSources,
        unsupportedCases: ["Synthetic boundary for test."],
      },
      "lineRef,table,booksValue,autoPopulatedValue\nB2B outward,3.1,,405000",
      configs["/gstr3b-outward-liability-prelock-gap-checker"],
      "",
    );

    expect(output).toContain("Table 3.1 | B2B outward");
    expect(output).toContain("| missing-data |");
    expect(output).toContain("booksValue and autoPopulatedValue must both be numbers");
    expect(output).toContain("Rows parsed: 1; rows accepted for output: 1");
    expect(output).not.toContain("required-cell-empty");
  });

  it("uses MSME candidate marker language instead of statutory due-date wording", () => {
    const output = buildOutput(
      msmeTool,
      [
        "vendor,amount,invoiceDate,writtenAgreement,udyamEvidence",
        "Invoice Fallback Vendor,125000,2026-05-01,unknown,missing",
      ].join("\n"),
      configs["/msme-45-day-payment-due-date-calculator"],
      "2026-07-02",
    );

    expect(output).toContain("candidate marker 2026-06-15");
    expect(output).toContain("days past candidate marker 17");
    expect(output).toContain("Review start basis: invoice-date-fallback");
    expect(output).toContain("Missing facts:");
    expect(output).toContain("invoice date is only a fallback for screening");
    expect(output).toContain("Next review actions:");
    expect(output.toLowerCase()).not.toContain("statutory due date");
    expect(output.toLowerCase()).not.toContain("legal default");
    expect(output.toLowerCase()).not.toContain("interest payable");
    expect(output.toLowerCase()).not.toContain("statutory interest calculated");
    expect(output.toLowerCase()).not.toContain("43b(h) compliant");
    expect(output.toLowerCase()).not.toContain("eligible to file");
    expect(output.toLowerCase()).not.toContain("msefc-ready");
    expect(output.toLowerCase()).not.toContain("admissible claim");
    expect(output.toLowerCase()).not.toContain("recoverable amount");
    expect(output.toLowerCase()).not.toContain("verified udyam");
  });

  it("surfaces GST portal evidence references as user-entered context only", () => {
    const output = buildOutput(
      gstPortalTool,
      [
        "attemptedAt,timezone,action,error,retryCount,complaintReference,screenshotHash,browser,device,networkContext",
        "2026-07-02 20:10,Asia/Kolkata,File GSTR-3B,Submit button failed,3,SR-123,sha256:abc123,Brave 1.68,macOS desktop,office broadband",
      ].join("\n"),
      configs["/gst-portal-issue-evidence-memo"],
      "",
    );

    expect(output).toContain("GST portal issue evidence memo");
    expect(output).toContain("Screenshot/evidence reference: sha256:abc123");
    expect(output).toContain("Browser/context: Brave 1.68; macOS desktop; office broadband");
    expect(output).toContain("Evidence checks:");
    expect(output).toContain("user-entered references only");
    expect(output).toContain("Next review actions:");
    expect(output).toContain("Rows parsed: 1; rows accepted for output: 1");
    expect(output).toContain("Tool boundary:");
    expect(output.toLowerCase()).not.toContain("portal outage proven");
    expect(output.toLowerCase()).not.toContain("extension granted");
    expect(output.toLowerCase()).not.toContain("complaint-ready");
    expect(output.toLowerCase()).not.toContain("condonation approved");
  });

  it("blocks unsafe GST portal memo cells without echoing the offending value", () => {
    const result = buildToolReviewArtifact({
      tool: {
        slug: gstPortalTool.slug,
        title: gstPortalTool.h1,
        officialSources: gstPortalTool.officialSources,
        unsupportedCases: gstPortalTool.unsupportedCases,
      },
      input: [
        "attemptedAt,action,error,screenshotBase64,gstin,otpNote",
        "2026-07-02 20:10,Login,OTP page timed out,data:image/png;base64,SYNTHETIC-SECRET,27ABCDE1234F1Z5,OTP 123456",
      ].join("\n"),
    });

    expect(result.status).toBe("blocked");
    if (result.status !== "blocked") throw new Error("Expected blocked GST portal input");
    expect(result.reason).toBe("unsafe-gst-portal-input");
    expect(result.text).toContain("Do not paste screenshots, files, base64, local paths, GSTINs, OTPs, cookies, or credentials.");
    expect(result.text).toContain("Use screenshot reference/hash text only.");
    expect(result.text).not.toContain("SYNTHETIC-SECRET");
    expect(result.text).not.toContain("27ABCDE1234F1Z5");
    expect(result.text).not.toContain("123456");
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

  it("uses a user-selected GSTR-2B tax tolerance in reconciliation output", () => {
    const input = [
      "source,supplier,invoice,taxAmount",
      "purchase,Acme Components,INV-102,18000",
      "2b,Acme Components,INV-102,18004",
    ].join("\n");
    const defaultOutput = buildOutput(
      gstr2bTool,
      input,
      configs["/gstr-2b-purchase-reconciliation-triage"],
      "",
    );
    const widerToleranceOutput = buildOutput(
      gstr2bTool,
      input,
      configs["/gstr-2b-purchase-reconciliation-triage"],
      "",
      { gstrTolerance: 5 },
    );

    expect(defaultOutput).toContain("Value mismatch: 1");
    expect(defaultOutput).toContain("Selected options: tolerance=2");
    expect(widerToleranceOutput).toContain("Value mismatch: 0");
    expect(widerToleranceOutput).toContain("Matched within tolerance: 1");
    expect(widerToleranceOutput).toContain("Selected options: tolerance=5");
  });

  it("maps optional GSTR-2B professional context fields before strict review", () => {
    const output = buildOutput(
      gstr2bTool,
      [
        "Source Type,Party Name,Bill No,Tax,Bill Date,Doc Type,ITC,IMS",
        "purchase,Acme Components,INV-102,18000,2026-05-01,Invoice,,",
        "2b,Acme Components,INV-102,18000,2026-05-01,Invoice,No,Rejected",
      ].join("\n"),
      configs["/gstr-2b-purchase-reconciliation-triage"],
      "",
      {
        strictGstrMatch: true,
        columnMapping: {
          source: "sourceType",
          supplier: "partyName",
          invoice: "billNo",
          taxAmount: "tax",
          invoiceDate: "billDate",
          documentType: "docType",
          itcAvailability: "itc",
          imsStatus: "ims",
        },
      },
    );

    expect(output).toContain("ITC/IMS context review: 1");
    expect(output).toContain("Professional context: ITC availability marked not available; IMS status marked rejected");
    expect(output).toContain(
      "Column mapping: source<-sourceType, supplier<-partyName, invoice<-billNo, taxAmount<-tax, invoiceDate<-billDate, documentType<-docType, itcAvailability<-itc, imsStatus<-ims",
    );
  });

  it("falls back to the default GSTR-2B tolerance when the option is invalid", () => {
    const output = buildOutput(
      gstr2bTool,
      [
        "source,supplier,invoice,taxAmount",
        "purchase,Acme Components,INV-102,18000",
        "2b,Acme Components,INV-102,18004",
      ].join("\n"),
      configs["/gstr-2b-purchase-reconciliation-triage"],
      "",
      { gstrTolerance: -1 },
    );

    expect(output).toContain("Value mismatch: 1");
    expect(output).toContain("Selected options: tolerance=2");
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
    expect(output).toContain("GSTIN: SYNTH-ACME-GSTIN");
    expect(output).toContain("Tax period: May 2026");
    expect(output).toContain("Document type: Tax Invoice");
    expect(output).toContain("Tax amount: 18000");
  });

  it("groups AIS/Form 26AS mismatch output by category and deductor", () => {
    const output = buildOutput(
      aisTool,
      [
        "source,deductor,tan,section,category,recordsCategory,amount,recordsAmount,tdsTcsAmount,note,reviewAction",
        "AIS,Metro Bank,SYNTH12345A,194A,Interest,Interest,5400,0,540,missing in books,Review AIS row against books",
        "Form 26AS,Northline Works,SYNTH54321B,194C,Contract,Contract,1200,1000,120,TDS amount mismatch,Ask deductor to verify",
        "AIS,Acme Advisors,SYNTH22222C,194J,Professional fees,Professional fees,0,5000,,missing in AIS,Review reporting source",
      ].join("\n"),
      configs["/ais-form-26as-mismatch-checker"],
      "",
    );

    expect(output).toContain("Reported not in records: 1");
    expect(output).toContain("Records not in AIS/Form 26AS: 1");
    expect(output).toContain("Amount difference: 1");
    expect(output).toContain("Deductor-wise verification drafts");
    expect(output).toContain("Metro Bank (SYNTH12345A)");
    expect(output).toContain("Northline Works (SYNTH54321B)");
    expect(output).toContain("Ask deductor to verify");
  });
});
