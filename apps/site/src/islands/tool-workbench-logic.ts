import { buildReviewFooter } from "@complyeaze-tools/artifacts";
import {
  buildDrc01bLiabilityMismatchReview,
  buildGstPortalEvidenceMemo,
  buildGstr2bReconciliationTriage,
  buildGstr2bSupplierFollowUps,
  buildGstr3bPreLockGapCheck,
  buildLabourCodeGratuityReview,
  buildMahareraForm3WithdrawalWorksheet,
  buildMsmePayableReview,
  buildSchedule112ARows,
  buildTaxStatementMismatchReview,
  buildTdsSectionTranslation,
  parseDelimitedTable,
  type ParsedTable,
} from "@complyeaze-tools/core";
import { maskIndianIdentifiersWithReport } from "@complyeaze-tools/safety";
import type { ToolMeta } from "@complyeaze-tools/source-register";

type WorkbenchSource = Pick<
  ToolMeta["officialSources"][number],
  "publisher" | "title" | "url" | "lastReviewedAt"
>;

export type WorkbenchTool = Pick<ToolMeta, "slug" | "h1" | "unsupportedCases"> & {
  officialSources: WorkbenchSource[];
};

export type WorkbenchConfig = {
  inputLabel: string;
  outputLabel: string;
  guidance: string;
  sample: string;
  requiredColumns?: string[];
  reviewLabel: string;
};

export type BuildOutputOptions = {
  strictGstrMatch?: boolean;
  gstr3bAlreadyFiled?: boolean;
};

export const configs: Record<string, WorkbenchConfig> = {
  "/msme-45-day-payment-due-date-calculator": {
    inputLabel: "Payables review rows",
    outputLabel: "MSME first-pass review draft",
    guidance:
      "Paste rows with vendor, amount, invoiceDate, acceptanceDate or deemedAcceptanceDate. Optional review fields: writtenAgreement, agreedPaymentDays, paymentDate, paidAmount, disputeStatus, udyamEvidence. This creates a browser-local triage draft only.",
    sample:
      "vendor,amount,invoiceDate,acceptanceDate,writtenAgreement,agreedPaymentDays,udyamEvidence,disputeStatus,paymentDate,paidAmount\nAcme Components,125000,2026-05-01,2026-05-03,no,,available,,,\nNorthline Supplies,42000,2026-06-20,2026-06-21,yes,30,missing,,,\nDelta Traders,54000,2026-05-02,2026-05-02,yes,60,available,disputed,,5000",
    requiredColumns: ["vendor", "amount", "acceptanceDate"],
    reviewLabel: "MSME payable rows",
  },
  "/gstr-2b-missing-invoice-vendor-follow-up": {
    inputLabel: "Supplier issue rows",
    outputLabel: "Supplier follow-up draft",
    guidance:
      "Paste rows with supplier, invoice, amount, and status. This creates follow-up text only, not ITC eligibility conclusions.",
    sample:
      "supplier,invoice,amount,status\nAcme Components,INV-102,125000,missing in 2B\nNorthline Supplies,INV-205,42000,value mismatch",
    requiredColumns: ["supplier", "invoice", "status"],
    reviewLabel: "GSTR-2B and purchase rows",
  },
  "/gstr-2b-purchase-reconciliation-triage": {
    inputLabel: "Purchase and GSTR-2B rows",
    outputLabel: "Reconciliation triage draft",
    guidance:
      "Paste one CSV/TSV with source, supplier, gstin, invoice, and taxAmount. Use source values purchase or 2b.",
    sample:
      "source,supplier,gstin,invoice,taxAmount\npurchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000\n2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000\npurchase,Northline Supplies,SYNTH-NORTH-GSTIN,INV-205,7560\n2b,Northline Supplies,SYNTH-NORTH-GSTIN,INV-205,7000\npurchase,Delta Traders,SYNTH-DELTA-GSTIN,INV-301,5400\n2b,Metro Inputs,SYNTH-METRO-GSTIN,INV-777,900",
    requiredColumns: ["source", "supplier", "invoice", "taxAmount"],
    reviewLabel: "GSTR-2B reconciliation triage rows",
  },
  "/ais-form-26as-mismatch-checker": {
    inputLabel: "Mismatch rows",
    outputLabel: "Tax statement review draft",
    guidance:
      "Paste rows with source, category, amount, recordsAmount, and note. This prepares a review table and correction request text.",
    sample:
      "source,category,amount,recordsAmount,note\nAIS,Interest,5400,0,missing in books\nForm 26AS,TDS,1200,1000,TDS amount mismatch",
    requiredColumns: ["source", "category", "amount", "recordsAmount"],
    reviewLabel: "AIS/Form 26AS review rows",
  },
  "/gst-portal-issue-evidence-memo": {
    inputLabel: "Attempt timeline rows",
    outputLabel: "Evidence memo draft",
    guidance:
      "Paste rows with attemptedAt, action, and error. This records user-observed attempts only.",
    sample:
      "attemptedAt,action,error\n2026-07-02 20:10,Login,OTP page timed out\n2026-07-02 20:24,Save GSTR-3B,Unable to load template",
    requiredColumns: ["attemptedAt", "action", "error"],
    reviewLabel: "user-observed portal attempts",
  },
  "/privacy/review-copy-builder": {
    inputLabel: "Review text",
    outputLabel: "Masked review copy",
    guidance:
      "Paste plain text and review the masked output before sharing. V0 masks common text patterns only.",
    sample:
      "Paste compliance review text here. Replace any taxpayer identifiers before sharing the draft.",
    reviewLabel: "review copy input",
  },
  "/gstr1-gstr3b-liability-mismatch-pre-checker": {
    inputLabel: "Period-wise liability rows",
    outputLabel: "Liability gap review draft",
    guidance:
      "Paste rows with gstin, period, gstr1Liability, and gstr3bLiability. This flags periods where GSTR-1 liability exceeds GSTR-3B liability for review, without claiming to know GSTN's undisclosed Rule 88C threshold.",
    sample:
      "gstin,period,gstr1Liability,gstr3bLiability\nSYNTH-ACME-GSTIN,2026-05,412000,398500\nSYNTH-NORTH-GSTIN,2026-05,275000,275000\nSYNTH-DELTA-GSTIN,2026-05,190000,215000",
    requiredColumns: ["gstin", "period", "gstr1Liability", "gstr3bLiability"],
    reviewLabel: "GSTR-1/GSTR-3B liability rows",
  },
  "/gstr3b-outward-liability-prelock-gap-checker": {
    inputLabel: "Books vs auto-populated liability rows",
    outputLabel: "Pre-lock gap review draft",
    guidance:
      "Paste rows with lineRef, table (3.1 or 3.2), booksValue, and autoPopulatedValue. Set whether GSTR-3B for the period is already filed, since that changes the correction path.",
    sample:
      "lineRef,table,booksValue,autoPopulatedValue\nB2B outward - 18%,3.1,412000,405000\nInter-state to unregistered,3.2,58000,58000\nB2C outward - 5%,3.1,76500,71200",
    requiredColumns: ["lineRef", "table", "booksValue", "autoPopulatedValue"],
    reviewLabel: "GSTR-3B pre-lock comparison rows",
  },
  "/income-tax-act-2025-tds-section-translator": {
    inputLabel: "Old section numbers",
    outputLabel: "Section translation draft",
    guidance:
      "Paste rows with oldSection, one old Income-tax Act, 1961 section per row, such as 194C. Only independently verified sections are matched; others are marked not verified.",
    sample: "oldSection\n194C\n194J\n194N",
    requiredColumns: ["oldSection"],
    reviewLabel: "old TDS section rows",
  },
  "/schedule-112a-capital-gains-csv-builder": {
    inputLabel: "Scrip-wise sale rows",
    outputLabel: "Schedule 112A field draft",
    guidance:
      "Paste rows with scripName, isin, quantity, salePricePerUnit, saleDate, and costOfAcquisitionActual. Add fmv31Jan2018PerUnit only if grandfathering should apply.",
    sample:
      "scripName,isin,quantity,salePricePerUnit,saleDate,costOfAcquisitionActual,fmv31Jan2018PerUnit\nSample Equity Ltd,INSYNTH00001,100,420,2026-05-10,25000,32000\nSample Fund Units,INSYNTH00002,500,58,2024-06-01,20000,",
    requiredColumns: ["scripName", "isin", "quantity", "salePricePerUnit", "saleDate", "costOfAcquisitionActual"],
    reviewLabel: "Schedule 112A sale rows",
  },
  "/labour-code-gratuity-wage-recalculator": {
    inputLabel: "Employee pay-component rows",
    outputLabel: "Wage-test and gratuity comparison draft",
    guidance:
      "Paste rows with employeeName, basic, da, otherComponents, employmentType (permanent or fixed-term), and yearsOfService. Optional: retainingAllowance and terminationReason for under-5 permanent death/disablement review.",
    sample:
      "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService,terminationReason\nSample Employee A,20000,0,0,56000,permanent,7,ordinary\nSample Employee B,35000,5000,0,25000,fixed-term,1.2,ordinary",
    requiredColumns: ["employeeName", "basic", "da", "otherComponents", "employmentType", "yearsOfService"],
    reviewLabel: "Labour Code wage/gratuity rows",
  },
  "/maharera-form-3-withdrawal-worksheet": {
    inputLabel: "Project cost rows",
    outputLabel: "Withdrawal ceiling worksheet draft",
    guidance:
      "Paste rows with projectName, totalEstimatedLandCost, totalEstimatedConstructionCost, landCostIncurred, constructionCostIncurred, and amountWithdrawnTillDate. Optional: financingCostIncurred, designatedAccountBalance.",
    sample:
      "projectName,totalEstimatedLandCost,totalEstimatedConstructionCost,landCostIncurred,constructionCostIncurred,amountWithdrawnTillDate,designatedAccountBalance\nSample Project A,20000000,80000000,8000000,32000000,18000000,25000000",
    requiredColumns: [
      "projectName",
      "totalEstimatedLandCost",
      "totalEstimatedConstructionCost",
      "landCostIncurred",
      "constructionCostIncurred",
      "amountWithdrawnTillDate",
    ],
    reviewLabel: "MahaRERA Form 3 project rows",
  },
};

export function isBlockingOutput(output: string): boolean {
  return output.startsWith("Paste ") || output.startsWith("Choose ");
}

export function buildOutput(
  tool: WorkbenchTool,
  input: string,
  config: WorkbenchConfig,
  asOfDate: string,
  options: BuildOutputOptions = {},
): string {
  if (tool.slug === "/privacy/review-copy-builder") {
    return buildReviewCopyOutput(tool, input, config);
  }

  const parsed = parseDelimitedTable(input);
  const inputError = validateRows(input, parsed, config.requiredColumns ?? []);
  if (inputError) return inputError;

  if (tool.slug === "/msme-45-day-payment-due-date-calculator") {
    if (!asOfDate) return "Choose an as-of date to calculate payment age.";
    const review = buildMsmePayableReview(parsed.rows, new Date(`${asOfDate}T00:00:00`));
    return [
      "MSME payables first-pass triage draft",
      `Review as-of date: ${asOfDate}`,
      ...review.flatMap((row) => formatMsmeReviewRow(row)),
      buildFooter(tool, config, parsed, { asOfDate }, msmeReviewCaveats),
    ].join("\n");
  }

  if (tool.slug === "/gstr-2b-missing-invoice-vendor-follow-up") {
    const followUps = buildGstr2bSupplierFollowUps(parsed.rows);
    return [
      "Supplier follow-up drafts",
      ...followUps.map((followUp) => followUp.draft),
      buildFooter(tool, config, parsed),
    ].join("\n");
  }

  if (tool.slug === "/gstr-2b-purchase-reconciliation-triage") {
    const matchFields = options.strictGstrMatch
      ? (["invoiceDate", "documentType"] as const)
      : [];
    const summary = buildGstr2bReconciliationTriage(parsed.rows, {
      tolerance: 2,
      matchFields: [...matchFields],
    });
    return [
      "GSTR-2B purchase reconciliation triage",
      `Match mode: ${options.strictGstrMatch ? "GSTIN/supplier + invoice + invoice date + document type" : "GSTIN/supplier + invoice"}`,
      `Rows reviewed: ${summary.totalRows}`,
      `Rows skipped by domain checks: ${summary.skippedRowCount}`,
      `Missing in 2B: ${summary.counts["missing-in-2b"]}`,
      `Extra in 2B: ${summary.counts["extra-in-2b"]}`,
      `Value mismatch: ${summary.counts["value-mismatch"]}`,
      `Duplicate keys: ${summary.counts["duplicate-key"]}`,
      `Matched within tolerance: ${summary.counts.matched}`,
      "",
      ...summary.issues.map(
        (issue) =>
          `${issue.status} | ${issue.supplier} | ${issue.invoice} | purchase ${formatAmount(issue.purchaseTaxAmount)} | 2B ${formatAmount(issue.gstr2bTaxAmount)} | diff ${formatAmount(issue.difference)} | ${issue.note}`,
      ),
      buildFooter(tool, config, parsed, {
        tolerance: 2,
        matchMode: options.strictGstrMatch ? "invoiceDate+documentType" : "basic",
      }),
    ].join("\n");
  }

  if (tool.slug === "/ais-form-26as-mismatch-checker") {
    const review = buildTaxStatementMismatchReview(parsed.rows);
    return [
      "Tax statement mismatch review",
      ...review.map(
        (row) =>
          `${row.source} ${row.category}${row.section ? ` section ${row.section}` : ""}: reported ${row.amount}, records ${row.recordsAmount || "-"}, difference ${formatAmount(row.difference)}; ${row.note}; action: ${row.feedbackAction}`,
      ),
      buildFooter(tool, config, parsed),
    ].join("\n");
  }

  if (tool.slug === "/gst-portal-issue-evidence-memo") {
    return [
      buildGstPortalEvidenceMemo(parsed.rows),
      buildFooter(tool, config, parsed),
    ].join("\n");
  }

  if (tool.slug === "/gstr1-gstr3b-liability-mismatch-pre-checker") {
    const review = buildDrc01bLiabilityMismatchReview(parsed.rows);
    return [
      "GSTR-1 vs GSTR-3B liability gap review",
      ...review.map(
        (row) =>
          `${row.gstin} | ${row.period} | GSTR-1 ${formatAmount(row.gstr1Liability)} | GSTR-3B ${formatAmount(row.gstr3bLiability)} | diff ${formatAmount(row.difference)} | ${row.flag} | ${row.note}`,
      ),
      buildFooter(tool, config, parsed),
    ].join("\n");
  }

  if (tool.slug === "/gstr3b-outward-liability-prelock-gap-checker") {
    const gstr3bAlreadyFiled = options.gstr3bAlreadyFiled ?? false;
    const review = buildGstr3bPreLockGapCheck(parsed.rows, { gstr3bAlreadyFiled });
    return [
      "GSTR-3B outward liability pre-lock gap review",
      `GSTR-3B already filed for this period: ${gstr3bAlreadyFiled ? "yes" : "no"}`,
      ...review.map(
        (row) =>
          `Table ${row.table} | ${row.lineRef} | books ${formatAmount(row.booksValue)} | auto-populated ${formatAmount(row.autoPopulatedValue)} | diff ${formatAmount(row.difference)} | ${row.status} | ${row.correctionPath}`,
      ),
      buildFooter(tool, config, parsed, { gstr3bAlreadyFiled }),
    ].join("\n");
  }

  if (tool.slug === "/income-tax-act-2025-tds-section-translator") {
    const results = buildTdsSectionTranslation(parsed.rows);
    return [
      "Income-tax Act 2025 TDS section translation",
      ...results.map((result) =>
        result.mapping
          ? `${result.input} -> ${result.mapping.newCitation} | ${result.mapping.paymentType} | rate ${result.mapping.rate} | threshold ${result.mapping.threshold} | ${result.note}`
          : `${result.input} -> ${result.status} | ${result.note}`,
      ),
      buildFooter(tool, config, parsed),
    ].join("\n");
  }

  if (tool.slug === "/schedule-112a-capital-gains-csv-builder") {
    const rows = buildSchedule112ARows(parsed.rows);
    return [
      "Schedule 112A field draft",
      ...rows.map(
        (row) =>
          `${row.scripName} | ISIN ${row.isin}${row.isinLooksValid ? "" : " (format looks invalid)"} | ${row.transferPeriod} | consideration ${formatAmount(row.fullValueOfConsideration)} | cost of acquisition ${formatAmount(row.costOfAcquisitionFinal)} | gain/loss ${formatAmount(row.gainOrLoss)}${row.flags.length ? ` | ${row.flags.join(" ")}` : ""}`,
      ),
      "",
      "Schedule 112A field export",
      formatSchedule112AExport(rows),
      buildFooter(tool, config, parsed),
    ].join("\n");
  }

  if (tool.slug === "/labour-code-gratuity-wage-recalculator") {
    const rows = buildLabourCodeGratuityReview(parsed.rows);
    return [
      "Labour Code wage-test and gratuity comparison",
      ...rows.map(
        (row) =>
          `${row.employeeName} | wages ${formatAmount(row.wages)} | 50% test exceeded: ${row.fiftyPercentTestExceeded ?? "unknown"} | effective wage base ${formatAmount(row.effectiveWageBase)} | eligible: ${row.eligibleForGratuity ?? "unknown"} | gratuity old ${formatAmount(row.gratuityOld)} -> new ${formatAmount(row.gratuityNew)} (delta ${formatAmount(row.gratuityDelta)}) | ${row.eligibilityBasis}${row.flags.length ? ` | ${row.flags.join(" ")}` : ""}`,
      ),
      buildFooter(tool, config, parsed),
    ].join("\n");
  }

  if (tool.slug === "/maharera-form-3-withdrawal-worksheet") {
    const rows = buildMahareraForm3WithdrawalWorksheet(parsed.rows);
    return [
      "MahaRERA Form 3 withdrawal ceiling worksheet",
      ...rows.map(
        (row) =>
          `${row.projectName} | total estimated cost ${formatAmount(row.totalEstimatedCost)} | cost incurred ${formatAmount(row.costIncurred)} | proportion ${row.proportionOfCostIncurred !== null ? `${(row.proportionOfCostIncurred * 100).toFixed(2)}%` : "-"} | ceiling ${formatAmount(row.maxWithdrawableCeiling)} | withdrawn ${formatAmount(row.amountWithdrawnTillDate)} | net withdrawable ${formatAmount(row.netWithdrawableCappedByBalance)}${row.flags.length ? ` | ${row.flags.join(" ")}` : ""}`,
      ),
      buildFooter(tool, config, parsed),
    ].join("\n");
  }

  return `${input}${buildFooter(tool, config, parsed)}`;
}

function buildReviewCopyOutput(
  tool: WorkbenchTool,
  input: string,
  config: WorkbenchConfig,
): string {
  if (!input.trim()) return "Paste plain text to create a review copy.";
  const report = maskIndianIdentifiersWithReport(input);
  const countLines = Object.entries(report.counts).map(
    ([label, count]) => `- ${label}: ${count}`,
  );

  return [
    "Review copy draft",
    report.warning,
    "",
    report.text,
    "",
    "Mask report",
    ...countLines,
    `Not checked automatically: ${report.notChecked.join(", ")}.`,
    "Manual review still required before sharing.",
    buildFooter(tool, config),
  ].join("\n");
}

function buildFooter(
  tool: WorkbenchTool,
  config: WorkbenchConfig,
  parsed?: ParsedTable,
  selectedOptions?: Record<string, string | number | boolean>,
  extraCaveats?: string[],
): string {
  return buildReviewFooter({
    sourceLabel: config.reviewLabel,
    toolSlug: tool.slug,
    toolTitle: tool.h1,
    selectedOptions,
    requiredColumns: config.requiredColumns,
    rowCounts: parsed
      ? {
          parsedRows: parsed.rows.length,
          skippedBlankRows: parsed.skippedBlankRows,
          skippedInvalidRows: new Set(parsed.issues.map((issue) => issue.rowNumber)).size,
        }
      : undefined,
    parseIssues: parsed?.issues,
    officialSources: tool.officialSources,
    unsupportedCases: tool.unsupportedCases,
    extraCaveats,
  });
}

function formatSchedule112AExport(rows: ReturnType<typeof buildSchedule112ARows>): string {
  const headers = [
    "scripName",
    "isin",
    "quantity",
    "salePricePerUnit",
    "fullValueOfConsideration",
    "saleDate",
    "transferPeriod",
    "costOfAcquisitionActual",
    "fmv31Jan2018PerUnit",
    "lowerOfFmvAndConsideration",
    "costOfAcquisitionFinal",
    "expenditureOnTransfer",
    "totalDeductions",
    "gainOrLoss",
  ];
  const dataRows = rows.map((row) => [
    row.scripName,
    row.isin,
    row.quantity,
    row.salePricePerUnit,
    row.fullValueOfConsideration,
    row.saleDate,
    row.transferPeriod,
    row.costOfAcquisitionActual,
    row.fmv31Jan2018PerUnit,
    row.lowerOfFmvAndConsideration,
    row.costOfAcquisitionFinal,
    row.expenditureOnTransfer,
    row.totalDeductions,
    row.gainOrLoss,
  ]);

  return [headers, ...dataRows].map((fields) => fields.map(formatCsvField).join(",")).join("\n");
}

function formatCsvField(value: string | number | null): string {
  if (value === null) return "";
  const text = typeof value === "number" ? formatExportNumber(value) : value;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatExportNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function formatAmount(value: number | null) {
  return value === null ? "-" : value.toFixed(2);
}

function formatMsmeReviewRow(row: ReturnType<typeof buildMsmePayableReview>[number]): string[] {
  return [
    `${row.vendor} | review-start age ${row.ageDays ?? "missing"} days | review date ${row.reviewDate ?? "missing"} | days past review date ${row.daysPastReviewDate ?? "missing"} | ${row.possibleFlag}`,
    `Review basis: ${row.reviewBasis}`,
    `Payment status: ${row.paymentStatus}; Udyam evidence entered: ${row.udyamEvidenceStatus}`,
    row.evidenceChecks.length ? `Review checks: ${row.evidenceChecks.join(" ")}` : null,
  ].filter((line): line is string => Boolean(line));
}

const msmeReviewCaveats = [
  "Dates and statuses are based only on pasted rows.",
  "This tool does not verify Udyam registration, resolve disputes, calculate statutory interest, or decide tax disallowance.",
];

function validateRows(
  input: string,
  parsed: ParsedTable,
  requiredColumns: string[],
): string | null {
  if (!input.trim()) return "Paste rows to create a draft output.";
  if (!parsed.rows.length) return "Paste rows with a header line and at least one data row.";

  const missing = requiredColumns.filter((column) => !parsed.headers.includes(column));
  if (missing.length) {
    return `Paste rows with these columns: ${requiredColumns.join(", ")}. Missing: ${missing.join(", ")}.`;
  }

  return null;
}
