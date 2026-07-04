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
      "supplier,gstin,invoice,invoiceDate,taxPeriod,documentType,taxableValue,taxAmount,status,escalationLevel\nAcme Components,27ABCDE1234F1Z5,INV-102,2026-05-01,May 2026,Tax Invoice,100000,18000,missing in 2B,first reminder\nNorthline Supplies,29ABCDE1234F1Z7,INV-205,2026-06-01,June 2026,Tax Invoice,40000,7200,value mismatch,second reminder",
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
      "Paste rows with attemptedAt, action, and error. This records user-observed attempts only.",
    sample:
      "attemptedAt,action,error\n2026-07-02 20:10,Login,OTP page timed out\n2026-07-02 20:24,Save GSTR-3B,Unable to load template",
  },
  "/privacy/review-copy-builder": {
    inputLabel: "Review text",
    outputLabel: "Masked review copy",
    guidance:
      "Paste plain text and review the masked output before sharing. V0 masks common text patterns only.",
    sample:
      "Paste compliance review text here. Replace any taxpayer identifiers before sharing the draft.",
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
    requiredColumns: ["source", "supplier", "invoice", "taxAmount or split igst/cgst/sgst"],
    requiredColumnGroups: [
      ["source"],
      ["supplier"],
      ["invoice"],
      ["taxAmount", "itcAmount", "amount", "igst", "cgst", "sgst"],
    ],
    requiredValueColumnGroups: [["source"], ["supplier"], ["invoice"]],
    sourceLabel: "GSTR-2B reconciliation triage rows",
  },
  "/ais-form-26as-mismatch-checker": {
    requiredColumns: ["source", "category", "amount", "recordsAmount"],
    sourceLabel: "AIS/Form 26AS review rows",
  },
  "/gst-portal-issue-evidence-memo": {
    requiredColumns: ["attemptedAt", "action", "error"],
    sourceLabel: "user-observed portal attempts",
  },
  "/privacy/review-copy-builder": {
    sourceLabel: "review copy input",
  },
};

export function getToolArtifactDefinition(slug: string): ToolArtifactDefinition {
  return artifactDefinitions[slug] ?? { sourceLabel: "review rows" };
}
