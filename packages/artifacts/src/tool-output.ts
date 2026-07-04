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
      new Date(`${asOfDate}T00:00:00Z`),
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
      ? (["invoiceDate", "documentType", "amendmentType"] as const)
      : [];
    const summary = buildGstr2bReconciliationTriage(prepared.acceptedRows, {
      tolerance: 2,
      matchFields: [...matchFields],
      reviewContext: Boolean(options.strictGstrMatch),
    });
    const matchMode = options.strictGstrMatch
      ? "GSTIN/supplier + invoice + invoice date + document type + amendment table context"
      : "GSTIN/supplier + invoice";
    return {
      status: "ready",
      text: [
        "GSTR-2B purchase reconciliation triage",
        `Match mode: ${matchMode}`,
        `Rows reviewed: ${summary.totalRows}`,
        `Rows skipped by domain checks: ${summary.skippedRowCount}`,
        `Missing in 2B: ${summary.counts["missing-in-2b"]}`,
        `Extra in 2B: ${summary.counts["extra-in-2b"]}`,
        `Value mismatch: ${summary.counts["value-mismatch"]}`,
        `Duplicate keys: ${summary.counts["duplicate-key"]}`,
        `ITC/IMS context review: ${summary.counts["context-review"]}`,
        `Matched within tolerance: ${summary.counts.matched}`,
        "",
        ...summary.issues.map(
          (issue) =>
            [
              `${issue.status} | ${issue.supplier} | ${issue.invoice} | purchase ${formatAmount(issue.purchaseTaxAmount)} | 2B ${formatAmount(issue.gstr2bTaxAmount)} | diff ${formatAmount(issue.difference)} | ${issue.note}`,
              issue.contextFlags.length
                ? `Professional context: ${issue.contextFlags.join("; ")}`
                : null,
            ]
              .filter((line): line is string => Boolean(line))
              .join("\n"),
        ),
        buildFooter(tool, definition, parsed, prepared, {
          tolerance: 2,
          matchMode: options.strictGstrMatch
            ? "invoiceDate+documentType+amendmentType+contextReview"
            : "basic",
        }),
      ].join("\n"),
    };
  }

  if (tool.slug === "/ais-form-26as-mismatch-checker") {
    const review = buildTaxStatementMismatchReview(prepared.acceptedRows);
    const counts = countTaxStatementMismatches(review);
    return {
      status: "ready",
      text: [
        "Tax statement mismatch review",
        `Reported not in records: ${counts["reported-not-in-records"]}`,
        `Records not in AIS/Form 26AS: ${counts["records-not-in-statement"]}`,
        `Amount difference: ${counts["amount-difference"]}`,
        `Duplicate statement rows: ${counts["duplicate-statement"]}`,
        `Identity/category/section review: ${counts["identity-or-section-review"]}`,
        `Manual review: ${counts["manual-review"]}`,
        `Matched rows: ${counts.matched}`,
        "",
        ...review.map(
          (row) =>
            `${row.mismatchCategory} | ${row.deductor} | ${row.tan || "-"} | ${row.source} ${row.category}${row.section ? ` section ${row.section}` : ""}: reported ${row.amount || "-"}, records ${row.recordsAmount || "-"}, TDS/TCS ${row.tdsTcsAmount || "-"}, difference ${formatAmount(row.difference)}; ${row.note}; review action: ${row.reviewAction}`,
        ),
        "",
        "Deductor-wise verification drafts",
        ...formatDeductorDrafts(review),
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
    `${row.vendor} | review-start age ${row.ageDays ?? "missing"} days | candidate marker ${row.candidateReviewMarkerDate ?? "missing"} | days past candidate marker ${row.daysPastCandidateMarker ?? "missing"} | ${row.possibleFlag}`,
    `Review start basis: ${row.reviewStartSource}`,
    `Threshold basis: ${row.reviewBasis}`,
    `Payment status: ${row.paymentStatus}; open balance entered: ${formatOptionalAmount(row.openBalance)}; Udyam evidence entered: ${row.udyamEvidenceStatus}`,
    row.udyamRegistrationDate ? `Udyam registration date entered: ${row.udyamRegistrationDate}` : null,
    row.missingFactChecks.length ? `Missing facts: ${row.missingFactChecks.join(" ")}` : null,
    row.nextReviewActions.length ? `Next review actions: ${row.nextReviewActions.join(" ")}` : null,
  ].filter((line): line is string => Boolean(line));
}

function formatOptionalAmount(value: number | null): string {
  return value === null ? "not-entered" : value.toFixed(2);
}

const msmeReviewCaveats = [
  "Dates and statuses are based only on pasted rows.",
  "This tool does not verify Udyam registration, resolve disputes, calculate statutory interest, or decide tax disallowance.",
];

function countTaxStatementMismatches(
  rows: ReturnType<typeof buildTaxStatementMismatchReview>,
) {
  const statuses = [
    "reported-not-in-records",
    "records-not-in-statement",
    "amount-difference",
    "duplicate-statement",
    "identity-or-section-review",
    "manual-review",
    "matched",
  ] as const;

  return Object.fromEntries(
    statuses.map((status) => [
      status,
      rows.filter((row) => row.mismatchCategory === status).length,
    ]),
  ) as Record<(typeof statuses)[number], number>;
}

function formatDeductorDrafts(rows: ReturnType<typeof buildTaxStatementMismatchReview>) {
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.deductor} (${row.deductorKey})`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return [...grouped.entries()].flatMap(([deductor, group]) => [
    deductor,
    ...group.map((row) => `- ${row.correctionDraft}`),
  ]);
}
