import type { ToolArtifactDefinition, WorkbenchConfig } from "./tool-output-types";

export const configs: Record<string, WorkbenchConfig> = {
  "/msme-45-day-payment-due-date-calculator": {
    inputLabel: "Payables review rows",
    outputLabel: "MSME first-pass review draft",
    guidance:
      "Paste rows with vendor, amount, invoiceDate, acceptanceDate or deemedAcceptanceDate. Optional review fields: writtenAgreement, agreedPaymentDays, paymentDate, paidAmount, objection dates, disputeStatus, udyamEvidence, and udyamRegistrationDate. This creates a browser-local triage draft only.",
    sample:
      "vendor,amount,invoiceDate,acceptanceDate,writtenAgreement,agreedPaymentDays,udyamEvidence,udyamRegistrationDate,disputeStatus,objectionRaisedDate,objectionResolvedDate,paymentDate,paidAmount\nAcme Components,125000,2026-05-01,2026-05-03,no,,available,2025-11-10,,,,,\nNorthline Supplies,42000,2026-06-20,2026-06-21,yes,30,missing,,,,,,\nDelta Traders,54000,2026-05-02,2026-05-02,yes,60,available,2026-04-01,disputed,2026-05-10,2026-05-20,,5000",
  },
  "/gstr-2b-missing-invoice-vendor-follow-up": {
    inputLabel: "Supplier issue rows",
    outputLabel: "Supplier follow-up draft",
    guidance:
      "Paste rows with supplier, GSTIN, invoice, invoiceDate, taxPeriod, documentType, taxableValue, taxAmount, status, and optional escalationLevel. This creates follow-up text only, not ITC eligibility conclusions.",
    sample:
      "supplier,gstin,invoice,invoiceDate,taxPeriod,documentType,taxableValue,taxAmount,status,escalationLevel\nAcme Components,SYNTH-ACME-GSTIN,INV-102,2026-05-01,May 2026,Tax Invoice,100000,18000,missing in 2B,first reminder\nNorthline Supplies,SYNTH-NORTH-GSTIN,INV-205,2026-06-01,June 2026,Tax Invoice,40000,7200,value mismatch,second reminder",
  },
  "/gstr-2b-purchase-reconciliation-triage": {
    inputLabel: "Purchase and GSTR-2B rows",
    outputLabel: "Reconciliation triage draft",
    guidance:
      "Paste one CSV/TSV with source, supplier, gstin, invoice, and taxAmount. Optional professional-mode columns include invoiceDate, documentType, table, itcAvailability, imsStatus, reverseCharge, and split igst/cgst/sgst.",
    sample:
      "source,supplier,gstin,invoice,invoiceDate,documentType,table,taxAmount,itcAvailability,imsStatus\npurchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,2026-05-01,Invoice,B2B,18000,,\n2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,2026-05-01,Invoice,B2B,18000,Yes,Accepted\npurchase,Northline Supplies,SYNTH-NORTH-GSTIN,INV-205,2026-06-01,Invoice,B2B,7560,,\n2b,Northline Supplies,SYNTH-NORTH-GSTIN,INV-205,2026-06-01,Invoice,B2B,7000,Yes,Accepted\npurchase,Delta Traders,SYNTH-DELTA-GSTIN,INV-301,2026-05-15,Invoice,B2B,5400,,\n2b,Metro Inputs,SYNTH-METRO-GSTIN,INV-777,2026-05-18,Invoice,B2BA,900,No,Rejected",
  },
  "/ais-form-26as-mismatch-checker": {
    inputLabel: "Mismatch rows",
    outputLabel: "Tax statement review draft",
    guidance:
      "Paste rows with source, deductor, TAN, section, category, amount, recordsAmount, and optional tdsTcsAmount, mismatchCategory, note, and reviewAction. This prepares review categories and deductor-wise verification draft text only.",
    sample:
      "source,deductor,tan,section,category,recordsCategory,amount,recordsAmount,tdsTcsAmount,note,reviewAction\nAIS,Metro Bank,SYNTH12345A,194A,Interest,Interest,5400,0,540,missing in books,Review AIS row against books\nForm 26AS,Northline Works,SYNTH54321B,194C,Contract,Contract,1200,1000,120,TDS amount mismatch,Ask deductor to verify\nAIS,Acme Advisors,SYNTH22222C,194J,Professional fees,Professional fees,0,5000,,missing in AIS,Review reporting source",
  },
  "/gst-portal-issue-evidence-memo": {
    inputLabel: "Attempt timeline rows",
    outputLabel: "Evidence memo draft",
    guidance:
      "Paste rows with attemptedAt, action, and error. Optional fields include timezone, retryCount, complaintReference, screenshotReference, screenshotSha256, browser, device, and networkContext. This records user-observed attempts only.",
    sample:
      "attemptedAt,timezone,action,error,retryCount,complaintReference,screenshotReference,screenshotSha256,browser,device,networkContext\n2026-07-02 20:10,Asia/Kolkata,Login,OTP page timed out,2,SR-123,retained-screenshot-1,sha256:synthetic-hash,Chrome 126,Windows laptop,office broadband\n2026-07-02 20:24,Asia/Kolkata,Save GSTR-3B,Unable to load template,1,,,,Brave 1.68,macOS desktop,home fiber",
  },
  "/privacy/review-copy-builder": {
    inputLabel: "Review text",
    outputLabel: "Masked review copy",
    guidance:
      "Paste plain text and review the masked output before sharing. V0 masks common text patterns only.",
    sample:
      "Paste compliance review text here. Replace any taxpayer identifiers before sharing the draft.",
  },
  "/gstr1-gstr3b-liability-mismatch-pre-checker": {
    inputLabel: "Period-wise liability rows",
    outputLabel: "Liability gap review draft",
    guidance:
      "Paste rows with gstin, period, gstr1Liability, and gstr3bLiability. This flags periods where GSTR-1 liability exceeds GSTR-3B liability for review, without claiming to know GSTN's undisclosed Rule 88C threshold.",
    sample:
      "gstin,period,gstr1Liability,gstr3bLiability\nSYNTH-ACME-GSTIN,2026-05,412000,398500\nSYNTH-NORTH-GSTIN,2026-05,275000,275000\nSYNTH-DELTA-GSTIN,2026-05,190000,215000",
  },
  "/gstr3b-outward-liability-prelock-gap-checker": {
    inputLabel: "Books vs auto-populated liability rows",
    outputLabel: "Pre-lock gap review draft",
    guidance:
      "Paste rows with lineRef, table (3.1 or 3.2), booksValue, and autoPopulatedValue. Set whether GSTR-3B for the period is already filed, since that changes the correction path.",
    sample:
      "lineRef,table,booksValue,autoPopulatedValue\nB2B outward - 18%,3.1,412000,405000\nInter-state to unregistered,3.2,58000,58000\nB2C outward - 5%,3.1,76500,71200",
  },
  "/income-tax-act-2025-tds-section-translator": {
    inputLabel: "Old section numbers",
    outputLabel: "Section translation draft",
    guidance:
      "Paste rows with oldSection, one old Income-tax Act, 1961 section per row, such as 194C. Only independently verified sections are matched; others are marked not verified.",
    sample: "oldSection\n194C\n194J\n194N",
  },
  "/schedule-112a-capital-gains-csv-builder": {
    inputLabel: "Scrip-wise sale rows",
    outputLabel: "Schedule 112A field draft",
    guidance:
      "Paste rows with scripName, isin, quantity, salePricePerUnit, saleDate, and costOfAcquisitionActual. Add fmv31Jan2018PerUnit together with acquisitionDate, purchaseDate, or acquiredBefore31Jan2018 when grandfathering should apply.",
    sample:
      "scripName,isin,quantity,salePricePerUnit,saleDate,costOfAcquisitionActual,fmv31Jan2018PerUnit,acquisitionDate\nSample Equity Ltd,INSYNTH00001,100,420,2026-05-10,25000,32000,2017-12-15\nSample Fund Units,INSYNTH00002,500,58,2024-06-01,20000,,",
  },
  "/labour-code-gratuity-wage-recalculator": {
    inputLabel: "Employee pay-component rows",
    outputLabel: "Wage-test and gratuity comparison draft",
    guidance:
      "Paste rows with employeeName, basic, da, otherComponents, employmentType (permanent or fixed-term), and yearsOfService. Optional: retainingAllowance and terminationReason for under-5 permanent death/disablement review.",
    sample:
      "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService,terminationReason\nSample Employee A,20000,0,0,56000,permanent,7,ordinary\nSample Employee B,35000,5000,0,25000,fixed-term,1.2,ordinary",
  },
  "/maharera-form-3-withdrawal-worksheet": {
    inputLabel: "Project cost rows",
    outputLabel: "Withdrawal ceiling worksheet draft",
    guidance:
      "Paste rows with projectName, totalEstimatedLandCost, totalEstimatedConstructionCost, landCostIncurred, constructionCostIncurred, and amountWithdrawnTillDate. Optional: financingCostIncurred, designatedAccountBalance.",
    sample:
      "projectName,totalEstimatedLandCost,totalEstimatedConstructionCost,landCostIncurred,constructionCostIncurred,amountWithdrawnTillDate,designatedAccountBalance\nSample Project A,20000000,80000000,8000000,32000000,18000000,25000000",
  },
};

const artifactDefinitions: Record<string, ToolArtifactDefinition> = {
  "/msme-45-day-payment-due-date-calculator": {
    requiredColumns: [
      "vendor",
      "amount",
      "acceptanceDate, deemedAcceptanceDate, or invoiceDate for screening",
    ],
    requiredColumnGroups: [
      ["vendor"],
      ["amount"],
      ["acceptanceDate", "deemedAcceptanceDate", "invoiceDate"],
    ],
    requiredValueColumnGroups: [["vendor"], ["amount"]],
    sourceLabel: "MSME payable rows",
  },
  "/gstr-2b-missing-invoice-vendor-follow-up": {
    requiredColumns: ["supplier", "invoice", "status"],
    sourceLabel: "GSTR-2B and purchase rows",
  },
  "/gstr-2b-purchase-reconciliation-triage": {
    requiredColumns: ["source", "supplier or gstin", "invoice", "taxAmount or split igst/cgst/sgst"],
    requiredColumnGroups: [
      ["source"],
      ["supplier", "gstin"],
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
    requiredValueColumnGroups: [["source"], ["supplier", "gstin"], ["invoice"]],
    sourceLabel: "GSTR-2B reconciliation triage rows",
  },
  "/ais-form-26as-mismatch-checker": {
    requiredColumns: ["source", "category or incomeCategory", "amount", "recordsAmount or amountInBooks"],
    requiredColumnGroups: [
      ["source"],
      ["category", "incomeCategory", "reportedCategory"],
      ["amount", "reportedAmount", "statementAmount"],
      ["recordsAmount", "booksAmount", "amountInBooks"],
    ],
    sourceLabel: "AIS/Form 26AS review rows",
  },
  "/gst-portal-issue-evidence-memo": {
    requiredColumns: ["attemptedAt", "action", "error"],
    sourceLabel: "user-observed portal attempts",
  },
  "/privacy/review-copy-builder": {
    sourceLabel: "review copy input",
  },
  "/gstr1-gstr3b-liability-mismatch-pre-checker": {
    requiredColumns: ["gstin", "period", "gstr1Liability", "gstr3bLiability"],
    sourceLabel: "GSTR-1/GSTR-3B liability rows",
  },
  "/gstr3b-outward-liability-prelock-gap-checker": {
    requiredColumns: ["lineRef", "table", "booksValue", "autoPopulatedValue"],
    requiredValueColumnGroups: [["lineRef"], ["table"]],
    sourceLabel: "GSTR-3B pre-lock comparison rows",
  },
  "/income-tax-act-2025-tds-section-translator": {
    requiredColumns: ["oldSection"],
    sourceLabel: "old TDS section rows",
  },
  "/schedule-112a-capital-gains-csv-builder": {
    requiredColumns: [
      "scripName",
      "isin",
      "quantity",
      "salePricePerUnit",
      "saleDate",
      "costOfAcquisitionActual",
      "acquisitionDate, purchaseDate, or acquiredBefore31Jan2018 when fmv31Jan2018PerUnit is used",
    ],
    requiredColumnGroups: [
      ["scripName"],
      ["isin"],
      ["quantity"],
      ["salePricePerUnit"],
      ["saleDate"],
      ["costOfAcquisitionActual"],
    ],
    sourceLabel: "Schedule 112A sale rows",
  },
  "/labour-code-gratuity-wage-recalculator": {
    requiredColumns: [
      "employeeName",
      "basic",
      "da",
      "otherComponents",
      "employmentType",
      "yearsOfService",
    ],
    sourceLabel: "Labour Code wage/gratuity rows",
  },
  "/maharera-form-3-withdrawal-worksheet": {
    requiredColumns: [
      "projectName",
      "totalEstimatedLandCost",
      "totalEstimatedConstructionCost",
      "landCostIncurred",
      "constructionCostIncurred",
      "amountWithdrawnTillDate",
    ],
    sourceLabel: "MahaRERA Form 3 project rows",
  },
};

export function getToolArtifactDefinition(slug: string): ToolArtifactDefinition {
  return artifactDefinitions[slug] ?? { sourceLabel: "review rows" };
}
