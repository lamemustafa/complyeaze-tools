import { describe, expect, it } from "vitest";
import {
  buildOutput,
  buildWorkbenchDiagnostics,
  configs,
  filterWorkbenchColumnMapping,
  getColumnMappingTargets,
  getToolArtifactDefinition,
  type WorkbenchTool,
} from "../../apps/site/src/islands/tool-workbench-logic";

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

const reviewCopyTool: WorkbenchTool = {
  slug: "/privacy/review-copy-builder",
  h1: "Review Copy Builder",
  officialSources: [
    {
      publisher: "Government of India eGazette",
      title: "Digital Personal Data Protection Act, 2023",
      url: "https://egazette.gov.in/WriteReadData/2023/248045.pdf",
      lastReviewedAt: "2026-07-02",
    },
  ],
  unsupportedCases: [
    "Does not perform browser OCR in V0.",
    "Does not provide forensic or legally irreversible redaction.",
  ],
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
  unsupportedCases: ["Does not prove global portal downtime or guarantee extension."],
};

const schedule112aTool: WorkbenchTool = {
  slug: "/schedule-112a-capital-gains-csv-builder",
  h1: "Schedule 112A Capital Gains CSV Builder",
  officialSources: [
    {
      publisher: "Income Tax Department",
      title: "ITR-2 validation rules",
      url: "https://www.incometax.gov.in/iec/foportal/sites/default/files/2025-07/CBDT__e-Filing_ITR%202_Validation%20Rules_AY%202025-26_V1.0.pdf",
      lastReviewedAt: "2026-07-02",
    },
  ],
  unsupportedCases: ["Does not confirm the live portal bulk-upload template."],
};

describe("tool workbench logic", () => {
  it("surfaces MSME review basis, candidate marker, and evidence checks in the draft", () => {
    const output = buildOutput(
      msmeTool,
      [
        "vendor,amount,acceptanceDate,writtenAgreement,agreedPaymentDays,udyamEvidence",
        "Acme Components,125000,2026-05-01,no,,missing",
      ].join("\n"),
      configs["/msme-45-day-payment-due-date-calculator"],
      "2026-07-02",
    );

    expect(output).toContain("MSME payables first-pass triage draft");
    expect(output).toContain("first-pass");
    expect(output).toContain("candidate marker 2026-05-17");
    expect(output).toContain("No written agreement: candidate marker uses the day after 15 days");
    expect(output).toContain("Collect or verify Udyam/MSE evidence");
    expect(output).toContain("Udyam evidence entered: missing");
    expect(output).toContain("Dates and statuses are based only on pasted rows.");
    expect(output).toContain("Draft local review artifact only.");
    expect(output).toContain("Tool page: https://tools.complyeaze.com/msme-45-day-payment-due-date-calculator/");
    expect(output).toContain("Tool package: complyeaze-tools@0.0.0");
    expect(output).toContain("Terms and disclaimer: https://tools.complyeaze.com/terms/");
    expect(output).toContain("Privacy notes: https://tools.complyeaze.com/privacy/");
    expect(output).toContain("Detected delimiter: comma");
    expect(output).toContain("Input headers: vendor, amount, acceptanceDate, writtenAgreement, agreedPaymentDays, udyamEvidence");
    expect(output.toLowerCase()).not.toContain("interest payable");
    expect(output.toLowerCase()).not.toContain("statutory interest calculated");
    expect(output.toLowerCase()).not.toContain("43b(h) compliant");
    expect(output.toLowerCase()).not.toContain("eligible to file");
    expect(output.toLowerCase()).not.toContain("msefc-ready");
    expect(output.toLowerCase()).not.toContain("admissible claim");
    expect(output.toLowerCase()).not.toContain("recoverable amount");
    expect(output.toLowerCase()).not.toContain("verified udyam");
  });

it("emits Schedule 112A export fields, not only a human-readable summary", () => {
    const output = buildOutput(
      schedule112aTool,
      [
        "scripName,isin,quantity,salePricePerUnit,saleDate,costOfAcquisitionActual,fmv31Jan2018PerUnit,acquisitionDate,expenditureOnTransfer",
        "Sample Equity Ltd,INSYNTH00001,100,420,2026-05-10,25000,320,2017-12-20,500",
      ].join("\n"),
      configs["/schedule-112a-capital-gains-csv-builder"],
      "",
    );

    expect(output).toContain("Schedule 112A field export");
    expect(output).toContain(
      "scripName,isin,quantity,salePricePerUnit,fullValueOfConsideration,saleDate,transferPeriod,costOfAcquisitionActual,fmv31Jan2018PerUnit,lowerOfFmvAndConsideration,costOfAcquisitionFinal,expenditureOnTransfer,totalDeductions,gainOrLoss",
    );
    expect(output).toContain(
      "Sample Equity Ltd,INSYNTH00001,100,420,42000,2026-05-10,AE,25000,320,32000,32000,500,32500,9500",
    );
  });

  it("makes Review Copy masking limits and manual checks visible in the draft", () => {
    const output = buildOutput(
      reviewCopyTool,
      "PAN abcde1234f, email owner@example.com, phone +91 98765 43210",
      configs["/privacy/review-copy-builder"],
      "",
    );

    expect(output).toContain("Review copy draft");
    expect(output).toContain("Not a redaction certificate");
    expect(output).toContain("Found and masked");
    expect(output).toContain("- pan: 1");
    expect(output).toContain("- email: 1");
    expect(output).toContain("- phone: 1");
    expect(output).toContain("Supported pattern checks with no match");
    expect(output).not.toContain("Checked, not found");
    expect(output).toContain("- gstin");
    expect(output).toContain("Not checked automatically");
    expect(output).toContain("Manual review checklist");
    expect(output).toContain("Re-read names, addresses, and free-form client context.");
    expect(output).toContain("Terms and disclaimer: https://tools.complyeaze.com/terms/");
    expect(output).toContain("Source register: https://tools.complyeaze.com/source/");
    expect(output.toLowerCase()).not.toContain("forensic redaction");
    expect(output.toLowerCase()).not.toContain("permanent redaction");
  });

  it("keeps GST portal evidence output bounded to user-observed evidence references", () => {
    const output = buildOutput(
      gstPortalTool,
      [
        "attemptedAt,timezone,action,error,screenshotHash,browser,device",
        "2026-07-02 20:10,Asia/Kolkata,Login,OTP page timed out,sha256:abc123,Chrome 126,Windows laptop",
      ].join("\n"),
      configs["/gst-portal-issue-evidence-memo"],
      "",
    );

    expect(output).toContain("GST portal issue evidence memo");
    expect(output).toContain("Screenshot/evidence reference: sha256:abc123");
    expect(output).toContain("Browser/context: Chrome 126; Windows laptop");
    expect(output).toContain("Evidence checks:");
    expect(output).toContain("Next review actions:");
    expect(output).toContain("Browser-local draft");
    expect(output.toLowerCase()).not.toContain("portal outage proven");
    expect(output.toLowerCase()).not.toContain("extension granted");
  });

  it("uses browser-local column mapping for pasted export headers", () => {
    const output = buildOutput(
      {
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
      },
      [
        "Source Type,Party Name,Bill No,Tax",
        "purchase,Acme Components,INV-102,18000",
        "2b,Acme Components,INV-102,18000",
      ].join("\n"),
      configs["/gstr-2b-purchase-reconciliation-triage"],
      "",
      {
        columnMapping: {
          source: "sourceType",
          supplier: "partyName",
          invoice: "billNo",
          taxAmount: "tax",
        },
      },
    );

    expect(output).toContain("GSTR-2B purchase reconciliation triage");
    expect(output).toContain("Matched within tolerance: 1");
    expect(output).toContain(
      "Column mapping: source<-sourceType, supplier<-partyName, invoice<-billNo, taxAmount<-tax",
    );
  });

  it("maps alternative required fields to the selected target, not the first group member", () => {
    const output = buildOutput(
      msmeTool,
      "Vendor,Amount,Bill Date\nAcme Components,125000,2026-05-01",
      configs["/msme-45-day-payment-due-date-calculator"],
      "2026-07-02",
      {
        columnMapping: {
          invoiceDate: "billDate",
        },
      },
    );

    expect(output).toContain("Review start basis: invoice-date-fallback");
    expect(output).toContain(
      "Confirm acceptance or deemed acceptance date; invoice date is only a fallback for screening.",
    );
    expect(output).toContain("Column mapping: invoiceDate<-billDate");
    expect(output).not.toContain("acceptanceDate<-billDate");
  });

  it("does not expose active column mapping targets before a header row exists", () => {
    const definition = getToolArtifactDefinition("/gstr-2b-purchase-reconciliation-triage");

    expect(getColumnMappingTargets(definition, [])).toEqual([]);
  });

  it("filters stale workbench mappings to visible missing targets and detected headers", () => {
    const definition = getToolArtifactDefinition("/gstr-2b-purchase-reconciliation-triage");
    const targets = getColumnMappingTargets(definition, ["sourceType", "partyName", "billNo", "tax"]);

    expect(targets).toEqual([
      { column: "source", label: "source" },
      { column: "supplier", label: "supplier" },
      { column: "gstin", label: "gstin" },
      { column: "invoice", label: "invoice" },
      { column: "taxAmount", label: "taxAmount" },
      { column: "itcAmount", label: "itcAmount" },
      { column: "amount", label: "amount" },
      { column: "igst", label: "igst" },
      { column: "cgst", label: "cgst" },
      { column: "sgst", label: "sgst" },
    ]);
    expect(
      filterWorkbenchColumnMapping(
        {
          source: "sourceType",
          supplier: "missingHeader",
          arbitraryNote: "partyName",
        },
        targets,
        ["sourceType", "partyName", "billNo", "tax"],
      ),
    ).toEqual({ source: "sourceType" });
  });

  it("shows optional GSTR professional mapping targets only when requested", () => {
    const definition = getToolArtifactDefinition("/gstr-2b-purchase-reconciliation-triage");
    const headers = ["source", "supplier", "invoice", "taxAmount", "billDate", "docType", "itc", "ims"];

    expect(getColumnMappingTargets(definition, headers)).toEqual([]);
    expect(getColumnMappingTargets(definition, headers, { includeOptional: true })).toEqual([
      { column: "invoiceDate", label: "invoiceDate" },
      { column: "documentType", label: "documentType" },
      { column: "amendmentType", label: "amendmentType" },
      { column: "itcAvailability", label: "itcAvailability" },
      { column: "imsStatus", label: "imsStatus" },
      { column: "reverseCharge", label: "reverseCharge" },
    ]);
  });

  it("does not present a no-match Review Copy report as an all-clear", () => {
    const output = buildOutput(
      reviewCopyTool,
      "Client reference Alpha review note for May ledger.",
      configs["/privacy/review-copy-builder"],
      "",
    );

    expect(output).toContain("No supported patterns matched.");
    expect(output).toContain("This is not an all-clear; manually inspect before sharing.");
    expect(output).toContain("partial or non-standard identifiers");
    expect(output).toContain("client references");
    expect(output).not.toContain("Checked, not found");
  });

  it("builds safe row diagnostics without echoing pasted cell values", () => {
    const diagnostics = buildWorkbenchDiagnostics({
      status: "ready",
      rowCounts: {
        parsedRows: 4,
        acceptedRows: 2,
        skippedBlankRows: 1,
        skippedInvalidRows: 1,
      },
      parseIssues: [
        {
          rowNumber: 4,
          code: "required-cell-empty",
          column: "vendor",
          message: "Missing required value for vendor.",
        },
      ],
    });

    expect(diagnostics).toEqual({
      title: "Input diagnostics",
      summary: [
        "Rows accepted for draft: 2 of 4 parsed.",
        "Blank rows skipped: 1.",
        "Rows needing review: 1.",
      ],
      issues: ["Row 4: required-cell-empty - Missing required value for vendor."],
    });
    expect(JSON.stringify(diagnostics)).not.toContain("Acme Components");
    expect(JSON.stringify(diagnostics)).not.toContain("125000");
  });
});
