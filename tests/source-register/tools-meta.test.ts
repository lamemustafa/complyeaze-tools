import { describe, expect, it } from "vitest";
import { TOOLS } from "../../packages/source-register/src/tools";
import { validateToolMeta } from "../../packages/source-register/src/validation";

const expectedSlugs = [
  "/msme-45-day-payment-due-date-calculator",
  "/gstr-2b-missing-invoice-vendor-follow-up",
  "/gstr-2b-purchase-reconciliation-triage",
  "/ais-form-26as-mismatch-checker",
  "/gst-portal-issue-evidence-memo",
  "/privacy/review-copy-builder",
  "/gstr1-gstr3b-liability-mismatch-pre-checker",
  "/gstr3b-outward-liability-prelock-gap-checker",
  "/income-tax-act-2025-tds-section-translator",
  "/schedule-112a-capital-gains-csv-builder",
  "/labour-code-gratuity-wage-recalculator",
  "/maharera-form-3-withdrawal-worksheet",
];

describe("tool source register", () => {
  it("registers every launch tool with required trust metadata", () => {
    const asOf = process.env.SOURCE_REGISTER_AS_OF ?? new Date().toISOString().slice(0, 10);

    expect(TOOLS.map((tool) => tool.slug)).toEqual(expectedSlugs);

    for (const tool of TOOLS) {
      expect(validateToolMeta(tool, asOf)).toEqual([]);
      expect(tool.privacyMode).toBe("browser-only");
      expect(tool.accountRequired).toBe(false);
      expect(tool.fileUploadRequired).toBe(false);
      expect(tool.telemetry).toBe("none");
      expect(tool.officialSources.length).toBeGreaterThan(0);
      expect(tool.unsupportedCases.length).toBeGreaterThan(0);
      expect(tool.relatedSlugs.length).toBeGreaterThanOrEqual(2);
      expect(tool.axalUpgradePath).toMatch(/\bAxal\b/);
      expect(tool.seoDepth.exampleWorkflow.length).toBeGreaterThanOrEqual(3);
      expect(tool.seoDepth.inputGuide.length).toBeGreaterThanOrEqual(2);
      expect(tool.seoDepth.commonMistakes.length).toBeGreaterThanOrEqual(2);
      expect(tool.seoDepth.reviewChecklist.length).toBeGreaterThanOrEqual(3);
      expect(tool.seoDepth.faqItems.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps related tool links within the launch register", () => {
    const slugs = new Set(TOOLS.map((tool) => tool.slug));

    for (const tool of TOOLS) {
      for (const relatedSlug of tool.relatedSlugs) {
        expect(slugs.has(relatedSlug), `${tool.slug} -> ${relatedSlug}`).toBe(true);
      }
    }
  });

  it("fails validation after the source stale-after window expires", () => {
    const errors = validateToolMeta(TOOLS[0], "2026-08-20");

    expect(errors).toContain("MSME Samadhaan delayed payment monitoring system source review is stale");
  });

  it("keeps MSME triage boundaries explicit when richer review fields are present", () => {
    const msmeTool = TOOLS.find(
      (tool) => tool.slug === "/msme-45-day-payment-due-date-calculator",
    );
    const supportedInputs = msmeTool?.supportedInputs.join(" ") ?? "";
    const outputArtifacts = msmeTool?.outputArtifacts.join(" ") ?? "";
    const reviewChecklist = msmeTool?.seoDepth.reviewChecklist.join(" ") ?? "";

    expect(msmeTool?.officialSources.map((source) => source.url)).toContain(
      "https://samadhaan.msme.gov.in/MyMsme/MSEFC/FAQ.aspx",
    );
    expect(msmeTool?.unsupportedCases.join(" ")).toContain(
      "Does not verify Udyam registration or supplier MSE status on government portals.",
    );
    expect(msmeTool?.unsupportedCases.join(" ")).toContain(
      "Does not decide statutory interest, default, tax disallowance, or legal recovery action.",
    );
    expect(msmeTool?.unsupportedCases.join(" ")).toContain(
      "Does not resolve disputed, partly paid, settled, or admissibility positions.",
    );
    expect(supportedInputs).toContain("objection");
    expect(supportedInputs).toContain("Udyam registration date");
    expect(supportedInputs).toContain("open balance");
    expect(outputArtifacts).toContain("candidate review marker");
    expect(reviewChecklist).toContain("candidate marker");
    expect(reviewChecklist).toContain("Udyam");
    expect(reviewChecklist.toLowerCase()).not.toContain("statutory due date");
  });

  it("documents Review Copy mask report and checklist artifacts without redaction overclaims", () => {
    const reviewCopyTool = TOOLS.find((tool) => tool.slug === "/privacy/review-copy-builder");

    expect(reviewCopyTool?.outputArtifacts).toEqual(
      expect.arrayContaining([
        "masked text draft",
        "mask report",
        "manual review checklist",
        "review footer",
      ]),
    );
    expect(reviewCopyTool?.seoDepth.reviewChecklist.join(" ")).toContain(
      "Manually inspect names, addresses",
    );
    expect(reviewCopyTool?.seoDepth.reviewChecklist.join(" ")).toContain("CIN");
    expect(reviewCopyTool?.seoDepth.exampleWorkflow.join(" ")).toContain(
      "found/masked/not-checked report",
    );
    expect(reviewCopyTool?.seoDepth.faqItems.map((item) => item.answer).join(" ").toLowerCase())
      .not.toContain("forensic redaction");
  });

  it("documents Review Copy residual risks for partial identifiers and client context", () => {
    const reviewCopyTool = TOOLS.find((tool) => tool.slug === "/privacy/review-copy-builder");
    const unsupported = reviewCopyTool?.unsupportedCases.join(" ") ?? "";

    expect(unsupported).toContain("partial, non-standard, or contextual identifiers");
    expect(unsupported).toContain("file names");
    expect(unsupported).toContain("client references");
    expect(unsupported).toContain("screenshots, PDFs, or scanned text");
  });

  it("documents GSTR-2B professional context columns without ITC overclaims", () => {
    const gstrTool = TOOLS.find(
      (tool) => tool.slug === "/gstr-2b-purchase-reconciliation-triage",
    );
    const supportedInputs = gstrTool?.supportedInputs.join(" ") ?? "";
    const reviewChecklist = gstrTool?.seoDepth.reviewChecklist.join(" ") ?? "";
    const unsupported = gstrTool?.unsupportedCases.join(" ") ?? "";

    expect(supportedInputs).toContain("invoice date");
    expect(supportedInputs).toContain("document type");
    expect(supportedInputs).toContain("IMS");
    expect(supportedInputs).toContain("ITC availability");
    expect(supportedInputs).toContain("amendment");
    expect(reviewChecklist).toContain("IMS");
    expect(reviewChecklist).toContain("ITC availability");
    expect(reviewChecklist).toContain("amendment");
    expect(unsupported).toContain("Does not determine ITC eligibility or filing positions.");
  });

  it("documents AIS/Form 26AS structured mismatch fields without filing overclaims", () => {
    const aisTool = TOOLS.find((tool) => tool.slug === "/ais-form-26as-mismatch-checker");
    const supportedInputs = aisTool?.supportedInputs.join(" ") ?? "";
    const outputArtifacts = aisTool?.outputArtifacts.join(" ") ?? "";
    const reviewChecklist = aisTool?.seoDepth.reviewChecklist.join(" ") ?? "";
    const unsupported = aisTool?.unsupportedCases.join(" ") ?? "";

    expect(supportedInputs).toContain("deductor");
    expect(supportedInputs).toContain("TAN");
    expect(supportedInputs).toContain("section");
    expect(supportedInputs).toContain("income category");
    expect(supportedInputs).toContain("TDS/TCS");
    expect(supportedInputs).toContain("amount in books");
    expect(supportedInputs).toContain("mismatch category");
    expect(supportedInputs).toContain("review action");
    expect(outputArtifacts).toContain("deductor-wise verification draft");
    expect(reviewChecklist).toContain("duplicate");
    expect(reviewChecklist).toContain("omitted");
    expect(reviewChecklist).toContain("incorrect category");
    expect(unsupported).toContain("Does not compute ITR tax payable or refunds.");
    expect(unsupported).toContain("Does not upload AIS feedback or submit portal corrections.");
  });

  it("documents GST portal evidence fields without outage or relief overclaims", () => {
    const gstPortalTool = TOOLS.find(
      (tool) => tool.slug === "/gst-portal-issue-evidence-memo",
    );
    const supportedInputs = gstPortalTool?.supportedInputs.join(" ") ?? "";
    const outputArtifacts = gstPortalTool?.outputArtifacts.join(" ") ?? "";
    const reviewChecklist = gstPortalTool?.seoDepth.reviewChecklist.join(" ") ?? "";
    const unsupported = gstPortalTool?.unsupportedCases.join(" ") ?? "";

    expect(supportedInputs).toContain("screenshot hash");
    expect(supportedInputs).toContain("browser");
    expect(supportedInputs).toContain("device");
    expect(outputArtifacts).toContain("user-entered evidence reference checklist");
    expect(reviewChecklist).toContain("hash");
    expect(reviewChecklist).toContain("original screenshots");
    expect(unsupported).toContain("Does not prove the GST portal was globally unavailable.");
    expect(unsupported).toContain("Does not guarantee extension, waiver, or condonation.");
    expect(unsupported).toContain("does not compute or verify hashes");
    expect(unsupported).toContain("Does not accept screenshots, files, PDFs, base64");
    expect(outputArtifacts.toLowerCase()).not.toContain("complaint-ready");
    expect(reviewChecklist.toLowerCase()).not.toContain("outage proof");
  });
});
