import { buildReviewFooter } from "@complyeaze-tools/artifacts";
import {
  buildGstPortalEvidenceMemo,
  buildGstr2bReconciliationTriage,
  buildGstr2bSupplierFollowUps,
  buildMsmePayableReview,
  buildTaxStatementMismatchReview,
  parseDelimitedTable,
  type ParsedTable,
} from "@complyeaze-tools/core";
import { maskIndianIdentifiersWithReport } from "@complyeaze-tools/safety";
import type { ToolMeta } from "@complyeaze-tools/source-register";

const PUBLIC_SITE_ORIGIN = "https://tools.complyeaze.com";
const REPOSITORY_URL = "https://github.com/lamemustafa/complyeaze-tools";
const TOOLKIT_VERSION = "complyeaze-tools@0.0.0";

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

  return `${input}${buildFooter(tool, config, parsed)}`;
}

function buildReviewCopyOutput(
  tool: WorkbenchTool,
  input: string,
  config: WorkbenchConfig,
): string {
  if (!input.trim()) return "Paste plain text to create a review copy.";
  const report = maskIndianIdentifiersWithReport(input);
  const foundLines = report.checked
    .filter((entry) => entry.status === "found-and-masked")
    .map((entry) => `- ${entry.key}: ${entry.count}`);
  const notFoundLines = report.checked
    .filter((entry) => entry.status === "checked-not-found")
    .map((entry) => `- ${entry.key}: checked, not found`);

  return [
    "Review copy draft",
    report.warning,
    "",
    report.text,
    "",
    "Found and masked",
    ...(foundLines.length ? foundLines : ["- No supported identifier-like patterns found."]),
    "",
    "Checked, not found",
    ...notFoundLines,
    "",
    "Not checked automatically",
    ...report.notChecked.map((item) => `- ${item}`),
    "",
    "Manual review checklist",
    ...report.manualReviewChecklist.map((item) => `- ${item}`),
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
    toolUrl: publicToolUrl(tool.slug),
    toolkitVersion: TOOLKIT_VERSION,
    repositoryUrl: REPOSITORY_URL,
    termsUrl: publicToolUrl("/terms"),
    privacyUrl: publicToolUrl("/privacy"),
    sourceRegisterUrl: publicToolUrl("/source"),
    selectedOptions,
    requiredColumns: config.requiredColumns,
    detectedDelimiter: parsed?.delimiter,
    inputHeaders: parsed?.originalHeaders,
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

function publicToolUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withSlash = /\.[a-zA-Z0-9]+$/.test(normalized)
    ? normalized
    : `${normalized.replace(/\/+$/, "")}/`;
  return `${PUBLIC_SITE_ORIGIN}${withSlash}`;
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
