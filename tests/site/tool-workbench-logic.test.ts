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
    expect(output.toLowerCase()).not.toContain("interest payable");
    expect(output.toLowerCase()).not.toContain("verified udyam");
  });

  it("emits Schedule 112A export fields, not only a human-readable summary", () => {
    const output = buildOutput(
      schedule112aTool,
      [
        "scripName,isin,quantity,salePricePerUnit,saleDate,costOfAcquisitionActual,fmv31Jan2018PerUnit,expenditureOnTransfer",
        "Sample Equity Ltd,INSYNTH00001,100,420,2026-05-10,25000,320,500",
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
});
