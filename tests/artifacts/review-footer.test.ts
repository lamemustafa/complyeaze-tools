import { describe, expect, it } from "vitest";
import { buildReviewFooter } from "../../packages/artifacts/src/text";

describe("buildReviewFooter", () => {
  it("includes artifact metadata, source details, row diagnostics, and review boundaries", () => {
    const footer = buildReviewFooter({
      sourceLabel: "GSTR-2B reconciliation triage rows",
      toolSlug: "/gstr-2b-purchase-reconciliation-triage",
      toolTitle: "GSTR-2B Purchase Reconciliation Triage",
      toolUrl: "https://tools.complyeaze.com/gstr-2b-purchase-reconciliation-triage/",
      generatedAt: "2026-07-03T12:00:00.000Z",
      toolkitVersion: "complyeaze-tools@0.0.0",
      repositoryUrl: "https://github.com/lamemustafa/complyeaze-tools",
      termsUrl: "https://tools.complyeaze.com/terms/",
      privacyUrl: "https://tools.complyeaze.com/privacy/",
      sourceRegisterUrl: "https://tools.complyeaze.com/source/",
      selectedOptions: { tolerance: "2" },
      requiredColumns: ["source", "supplier", "invoice", "taxAmount"],
      detectedDelimiter: ",",
      inputHeaders: ["source", "supplier", "invoice", "taxAmount"],
      rowCounts: {
        parsedRows: 6,
        skippedBlankRows: 1,
        skippedInvalidRows: 2,
      },
      parseIssues: [
        {
          rowNumber: 4,
          code: "missing-cell",
          message: "Missing value for invoice.",
        },
      ],
      officialSources: [
        {
          publisher: "GST Tutorials",
          title: "GSTR-2B User Manual",
          url: "https://tutorial.gst.gov.in/userguide/returns/Manual_gstr2b.htm",
          lastReviewedAt: "2026-07-02",
        },
      ],
      unsupportedCases: ["Does not determine ITC eligibility."],
      extraCaveats: ["Dates and statuses are based only on pasted rows."],
    });

    expect(footer).toContain("Generated at: 2026-07-03T12:00:00.000Z");
    expect(footer).toMatch(/Local artifact ID: local-[0-9a-f]{8}/);
    expect(footer).toContain("Tool: GSTR-2B Purchase Reconciliation Triage (/gstr-2b-purchase-reconciliation-triage)");
    expect(footer).toContain("Tool page: https://tools.complyeaze.com/gstr-2b-purchase-reconciliation-triage/");
    expect(footer).toContain("Tool package: complyeaze-tools@0.0.0");
    expect(footer).toContain("Artifact schema: review-text-v1");
    expect(footer).toContain("Selected options: tolerance=2");
    expect(footer).toContain("Expected columns: source, supplier, invoice, taxAmount");
    expect(footer).toContain("Detected delimiter: comma");
    expect(footer).toContain("Input headers: source, supplier, invoice, taxAmount");
    expect(footer).toContain("Rows parsed: 6; blank rows skipped: 1; invalid rows needing review: 2.");
    expect(footer).toContain("Row 4: missing-cell - Missing value for invoice.");
    expect(footer).toContain("GST Tutorials: GSTR-2B User Manual (reviewed 2026-07-02)");
    expect(footer).toContain("https://tutorial.gst.gov.in/userguide/returns/Manual_gstr2b.htm");
    expect(footer).toContain("Tool boundary:");
    expect(footer).toContain("Does not determine ITC eligibility.");
    expect(footer).toContain("Additional review caveats:");
    expect(footer).toContain("Dates and statuses are based only on pasted rows.");
    expect(footer).toContain("Source register: https://tools.complyeaze.com/source/");
    expect(footer).toContain("Terms and disclaimer: https://tools.complyeaze.com/terms/");
    expect(footer).toContain("Privacy notes: https://tools.complyeaze.com/privacy/");
    expect(footer).toContain("Open-source repository: https://github.com/lamemustafa/complyeaze-tools");
    expect(footer).toContain("Draft local review artifact only. Not a filing instruction or final tax position.");
  });

  it("keeps the previous string API for simple callers", () => {
    const footer = buildReviewFooter("local input");

    expect(footer).toContain("Draft review output generated locally from local input.");
    expect(footer).toContain(
      "Draft local review artifact only. Not tax, legal, filing, or portal submission advice.",
    );
    expect(footer).toContain("Do not treat this output as a final compliance position.");
  });
});
