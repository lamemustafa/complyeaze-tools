import { describe, expect, it } from "vitest";
import {
  buildOutput,
  configs,
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
  unsupportedCases: ["Does not decide final interest, disallowance, or legal default."],
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

describe("tool workbench logic", () => {
  it("surfaces MSME review basis, review dates, and evidence checks in the draft", () => {
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
    expect(output).toContain("review date 2026-05-17");
    expect(output).toContain("No written agreement: appointed-day review date after 15 days");
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
    expect(output.toLowerCase()).not.toContain("verified udyam");
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
});
