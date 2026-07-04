import {
  buildGstPortalEvidenceMemo,
  buildGstr2bReconciliationTriage,
  buildGstr2bSupplierFollowUps,
  buildMsmePayableReview,
  buildTaxStatementMismatchReview,
} from "@complyeaze-tools/core";
import { requirePreparedTable, type ToolArtifactBuilderContext } from "./tool-builder-types";
import { buildFooter } from "./tool-output-footer";
import type { ToolArtifactResult } from "./tool-output-types";

export function buildMsmeArtifact({
  tool,
  definition,
  asOfDate,
  parsed,
  prepared,
}: ToolArtifactBuilderContext): ToolArtifactResult {
  const table = requirePreparedTable(parsed, prepared);
  if (!asOfDate) {
    return {
      status: "blocked",
      text: "Choose an as-of date to calculate payment age.",
      reason: "missing-as-of-date",
    };
  }

  const review = buildMsmePayableReview(
    table.prepared.acceptedRows,
    new Date(`${asOfDate}T00:00:00Z`),
  );

  return {
    status: "ready",
    text: [
      "MSME payables first-pass triage draft",
      `Review as-of date: ${asOfDate}`,
      ...review.flatMap((row) => formatMsmeReviewRow(row)),
      buildFooter(
        tool,
        definition,
        table.parsed,
        table.prepared,
        { asOfDate },
        msmeReviewCaveats,
      ),
    ].join("\n"),
  };
}

export function buildGstr2bFollowUpArtifact({
  tool,
  definition,
  parsed,
  prepared,
}: ToolArtifactBuilderContext): ToolArtifactResult {
  const table = requirePreparedTable(parsed, prepared);
  const followUps = buildGstr2bSupplierFollowUps(table.prepared.acceptedRows);

  return {
    status: "ready",
    text: [
      "Supplier follow-up drafts",
      ...followUps.map((followUp) => followUp.draft),
      buildFooter(tool, definition, table.parsed, table.prepared),
    ].join("\n"),
  };
}

export function buildGstr2bReconciliationArtifact({
  tool,
  definition,
  options,
  parsed,
  prepared,
}: ToolArtifactBuilderContext): ToolArtifactResult {
  const table = requirePreparedTable(parsed, prepared);
  const matchFields = options.strictGstrMatch
    ? (["invoiceDate", "documentType", "amendmentType"] as const)
    : [];
  const summary = buildGstr2bReconciliationTriage(table.prepared.acceptedRows, {
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
      buildFooter(tool, definition, table.parsed, table.prepared, {
        tolerance: 2,
        matchMode: options.strictGstrMatch
          ? "invoiceDate+documentType+amendmentType+contextReview"
          : "basic",
      }),
    ].join("\n"),
  };
}

export function buildAisArtifact({
  tool,
  definition,
  parsed,
  prepared,
}: ToolArtifactBuilderContext): ToolArtifactResult {
  const table = requirePreparedTable(parsed, prepared);
  const review = buildTaxStatementMismatchReview(table.prepared.acceptedRows);
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
      buildFooter(tool, definition, table.parsed, table.prepared),
    ].join("\n"),
  };
}

export function buildGstPortalArtifact({
  tool,
  definition,
  parsed,
  prepared,
}: ToolArtifactBuilderContext): ToolArtifactResult {
  const table = requirePreparedTable(parsed, prepared);

  return {
    status: "ready",
    text: [
      buildGstPortalEvidenceMemo(table.prepared.acceptedRows),
      buildFooter(tool, definition, table.parsed, table.prepared),
    ].join("\n"),
  };
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
