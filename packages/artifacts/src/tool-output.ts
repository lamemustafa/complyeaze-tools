import {
  buildGstPortalEvidenceMemo,
  buildGstr2bReconciliationTriage,
  buildGstr2bSupplierFollowUps,
  buildMsmePayableReview,
  buildTaxStatementMismatchReview,
  parseDelimitedTable,
} from "@complyeaze-tools/core";
import { maskIndianIdentifiersWithReport } from "@complyeaze-tools/safety";
import { getToolArtifactDefinition } from "./tool-output-config";
import {
  buildFooter,
  prepareRowsForDefinition,
  toArtifactToolContext,
  validateRowsForDefinition,
} from "./tool-output-footer";
import type {
  ArtifactToolContext,
  BuildOutputOptions,
  BuildToolReviewArtifactInput,
  ToolArtifactDefinition,
  ToolArtifactResult,
  WorkbenchConfig,
  WorkbenchTool,
} from "./tool-output-types";

export { configs, getToolArtifactDefinition } from "./tool-output-config";
export type {
  ArtifactToolContext,
  BuildOutputOptions,
  BuildToolReviewArtifactInput,
  ToolArtifactDefinition,
  ToolArtifactResult,
  WorkbenchConfig,
  WorkbenchTool,
} from "./tool-output-types";

export function isBlockingOutput(output: string): boolean {
  return output.startsWith("Paste ") || output.startsWith("Choose ");
}

export function buildToolReviewArtifact({
  tool,
  input,
  asOfDate = "",
  options = {},
}: BuildToolReviewArtifactInput): ToolArtifactResult {
  const definition = getToolArtifactDefinition(tool.slug);

  if (tool.slug === "/privacy/review-copy-builder") {
    if (!input.trim()) {
      return {
        status: "blocked",
        text: "Paste plain text to create a review copy.",
        reason: "empty-input",
      };
    }
    return {
      status: "ready",
      text: buildReviewCopyOutput(tool, input, definition),
    };
  }

  const parsed = parseDelimitedTable(input);
  const inputError = validateRowsForDefinition(input, parsed, definition);
  if (inputError) return inputError;
  const prepared = prepareRowsForDefinition(parsed, definition);

  if (tool.slug === "/msme-45-day-payment-due-date-calculator") {
    if (!asOfDate) {
      return {
        status: "blocked",
        text: "Choose an as-of date to calculate payment age.",
        reason: "missing-as-of-date",
      };
    }
    const review = buildMsmePayableReview(
      prepared.acceptedRows,
      new Date(`${asOfDate}T00:00:00`),
    );
    return {
      status: "ready",
      text: [
        "MSME payables first-pass triage draft",
        `Review as-of date: ${asOfDate}`,
        ...review.flatMap((row) => formatMsmeReviewRow(row)),
        buildFooter(tool, definition, parsed, prepared, { asOfDate }, msmeReviewCaveats),
      ].join("\n"),
    };
  }

  if (tool.slug === "/gstr-2b-missing-invoice-vendor-follow-up") {
    const followUps = buildGstr2bSupplierFollowUps(prepared.acceptedRows);
    return {
      status: "ready",
      text: [
        "Supplier follow-up drafts",
        ...followUps.map((followUp) => followUp.draft),
        buildFooter(tool, definition, parsed, prepared),
      ].join("\n"),
    };
  }

  if (tool.slug === "/gstr-2b-purchase-reconciliation-triage") {
    const matchFields = options.strictGstrMatch
      ? (["invoiceDate", "documentType"] as const)
      : [];
    const summary = buildGstr2bReconciliationTriage(prepared.acceptedRows, {
      tolerance: 2,
      matchFields: [...matchFields],
    });
    return {
      status: "ready",
      text: [
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
        buildFooter(tool, definition, parsed, prepared, {
          tolerance: 2,
          matchMode: options.strictGstrMatch ? "invoiceDate+documentType" : "basic",
        }),
      ].join("\n"),
    };
  }

  if (tool.slug === "/ais-form-26as-mismatch-checker") {
    const review = buildTaxStatementMismatchReview(prepared.acceptedRows);
    return {
      status: "ready",
      text: [
        "Tax statement mismatch review",
        ...review.map(
          (row) =>
            `${row.source} ${row.category}${row.section ? ` section ${row.section}` : ""}: reported ${row.amount}, records ${row.recordsAmount || "-"}, difference ${formatAmount(row.difference)}; ${row.note}; action: ${row.feedbackAction}`,
        ),
        buildFooter(tool, definition, parsed, prepared),
      ].join("\n"),
    };
  }

  if (tool.slug === "/gst-portal-issue-evidence-memo") {
    return {
      status: "ready",
      text: [
        buildGstPortalEvidenceMemo(prepared.acceptedRows),
        buildFooter(tool, definition, parsed, prepared),
      ].join("\n"),
    };
  }

  return {
    status: "ready",
    text: `${input}${buildFooter(tool, definition, parsed, prepared)}`,
  };
}

export function buildOutput(
  tool: WorkbenchTool,
  input: string,
  config: WorkbenchConfig,
  asOfDate: string,
  options: BuildOutputOptions = {},
): string {
  void config;
  return buildToolReviewArtifact({
    tool: toArtifactToolContext(tool),
    input,
    asOfDate,
    options,
  }).text;
}

function buildReviewCopyOutput(
  tool: ArtifactToolContext,
  input: string,
  definition: ToolArtifactDefinition,
): string {
  const report = maskIndianIdentifiersWithReport(input);
  const foundLines = report.checked
    .filter((entry) => entry.status === "found-and-masked")
    .map((entry) => `- ${entry.key}: ${entry.count}`);
  const notFoundLines = report.checked
    .filter((entry) => entry.status === "checked-not-found")
    .map((entry) => `- ${entry.key}: supported pattern did not match`);

  return [
    "Review copy draft",
    report.warning,
    "",
    report.text,
    "",
    "Found and masked",
    ...(foundLines.length
      ? foundLines
      : [
          "- No supported patterns matched.",
          "- This is not an all-clear; manually inspect before sharing.",
        ]),
    "",
    "Supported pattern checks with no match",
    ...notFoundLines,
    "",
    "Not checked automatically",
    ...report.notChecked.map((item) => `- ${item}`),
    "",
    "Manual review checklist",
    ...report.manualReviewChecklist.map((item) => `- ${item}`),
    buildFooter(tool, definition),
  ].join("\n");
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
