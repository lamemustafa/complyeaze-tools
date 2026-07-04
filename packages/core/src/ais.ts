import { parseSimpleCsv, type CsvRow } from "./csv";

export type TaxStatementMismatchCategory =
  | "reported-not-in-records"
  | "records-not-in-statement"
  | "amount-difference"
  | "duplicate-statement"
  | "identity-or-section-review"
  | "matched"
  | "manual-review";

export type TaxStatementMismatchReview = {
  source: string;
  deductor: string;
  tan: string;
  deductorKey: string;
  section: string;
  category: string;
  recordsCategory: string;
  amount: string;
  recordsAmount: string;
  tdsTcsAmount: string;
  difference: number | null;
  note: string;
  reviewAction: string;
  feedbackAction: string;
  mismatchCategory: TaxStatementMismatchCategory;
  correctionDraft: string;
};

export function buildTaxStatementMismatchReview(
  input: string | CsvRow[],
): TaxStatementMismatchReview[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;
  const normalizedRows = rows.map((row, index) => normalizeRow(row, index));
  const duplicateKeys = findDuplicateKeys(normalizedRows);

  return normalizedRows.map((row) => {
    const mismatchCategory = duplicateKeys.has(row.duplicateKey)
      ? "duplicate-statement"
      : classifyMismatch(row);

    return {
      source: row.source,
      deductor: row.deductor,
      tan: row.tan,
      deductorKey: row.deductorKey,
      section: row.section,
      category: row.category,
      recordsCategory: row.recordsCategory,
      amount: row.amount,
      recordsAmount: row.recordsAmount,
      tdsTcsAmount: row.tdsTcsAmount,
      difference: row.difference,
      note: row.note,
      reviewAction: row.reviewAction,
      feedbackAction: row.reviewAction,
      mismatchCategory,
      correctionDraft: buildCorrectionDraft(row, mismatchCategory),
    };
  });
}

type NormalizedTaxStatementRow = {
  source: string;
  deductor: string;
  tan: string;
  deductorKey: string;
  section: string;
  category: string;
  recordsCategory: string;
  amount: string;
  recordsAmount: string;
  tdsTcsAmount: string;
  difference: number | null;
  note: string;
  reviewAction: string;
  explicitMismatchCategory: TaxStatementMismatchCategory | null;
  duplicateKey: string;
};

function normalizeRow(row: CsvRow, index: number): NormalizedTaxStatementRow {
  const amount = row.amount || row.reportedAmount || row.statementAmount || "";
  const recordsAmount = row.recordsAmount || row.booksAmount || row.amountInBooks || "";
  const source = row.source || "Unknown source";
  const tan = row.tan || row.deductorTan || "";
  const rawDeductor = row.deductor || row.deductorName || row.payer || row.reportingSource || "";
  const deductor = rawDeductor || "Unknown deductor";
  const section = row.section || row.tdsSection || "";
  const category = row.category || row.incomeCategory || row.reportedCategory || "review";
  const recordsCategory = row.recordsCategory || row.booksCategory || row.categoryInBooks || category;
  const tdsTcsAmount = row.tdsTcsAmount || row.tdsTcs || row.tdsAmount || row.tcsAmount || "";
  const note = row.note || "review";
  const reviewAction =
    row.reviewAction || row.feedbackAction || row.action || "Review against taxpayer records";
  const differenceValue = difference(amount, recordsAmount);
  const identityKey = normalizeText(tan) || normalizeText(rawDeductor) || `missing-deductor-${index}`;

  return {
    source,
    deductor,
    tan,
    deductorKey: tan || normalizeText(deductor) || "unknown-deductor",
    section,
    category,
    recordsCategory,
    amount,
    recordsAmount,
    tdsTcsAmount,
    difference: differenceValue,
    note,
    reviewAction,
    explicitMismatchCategory: normalizeMismatchCategory(row.mismatchCategory || row.mismatchType || ""),
    duplicateKey: [
      normalizeText(source),
      identityKey,
      normalizeText(section),
      normalizeText(category),
      normalizeAmountForKey(amount),
      normalizeAmountForKey(recordsAmount),
    ].join(":"),
  };
}

function findDuplicateKeys(rows: NormalizedTaxStatementRow[]): Set<string> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.duplicateKey, (counts.get(row.duplicateKey) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

function classifyMismatch(row: NormalizedTaxStatementRow): TaxStatementMismatchCategory {
  if (row.explicitMismatchCategory) return row.explicitMismatchCategory;
  if (normalizeText(row.category) !== normalizeText(row.recordsCategory)) {
    return "identity-or-section-review";
  }

  const reported = parseAmount(row.amount);
  const books = parseAmount(row.recordsAmount);
  if (reported !== null && books !== null) {
    if (reported > 0 && books === 0) return "reported-not-in-records";
    if (reported === 0 && books > 0) return "records-not-in-statement";
    if (reported !== books) return "amount-difference";
    return "matched";
  }

  return "manual-review";
}

function normalizeMismatchCategory(value: string): TaxStatementMismatchCategory | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.includes("duplicate")) return "duplicate-statement";
  if (
    [
      "reportednotinrecords",
      "reportednotinbooks",
      "missinginbooks",
      "omittedinbooks",
    ].includes(normalized)
  ) {
    return "reported-not-in-records";
  }
  if (
    [
      "recordsnotinstatement",
      "booksnotinstatement",
      "missinginstatement",
      "missinginais",
      "missinginform26as",
      "omittedinstatement",
    ].includes(normalized)
  ) {
    return "records-not-in-statement";
  }
  if (
    normalized === "identityorsectionreview" ||
    normalized.includes("category") ||
    normalized.includes("incomehead")
  ) {
    return "identity-or-section-review";
  }
  if (
    normalized === "amountdifference" ||
    normalized.includes("amount") ||
    normalized.includes("tds") ||
    normalized.includes("tcs")
  ) {
    return "amount-difference";
  }
  if (["notmatched", "unmatched", "mismatch", "mismatched"].includes(normalized)) return null;
  if (normalized === "matched" || normalized === "match") return "matched";
  if (normalized === "manualreview") return "manual-review";
  return "manual-review";
}

function buildCorrectionDraft(
  row: NormalizedTaxStatementRow,
  category: TaxStatementMismatchCategory,
): string {
  const party = `${row.deductor} (${row.deductorKey})`;
  const section = row.section ? ` section ${row.section}` : "";
  const incomeCategory = row.category ? ` ${row.category}` : "";
  const action = `Suggested review action: ${row.reviewAction}.`;

  switch (category) {
    case "reported-not-in-records":
      return `${party}${section}: ${row.source} reports ${row.amount || "-"} for${incomeCategory}, but books show ${row.recordsAmount || "0"}. Review taxpayer records before tax-record review or deductor contact. ${action}`;
    case "records-not-in-statement":
      return `${party}${section}: books show ${row.recordsAmount || "-"} for${incomeCategory}, but it appears missing from AIS/Form 26AS in the pasted row. Ask the deductor or reporting source to verify if books are correct. ${action}`;
    case "amount-difference":
      return `${party}${section}: reported amount ${row.amount || "-"} differs from books amount ${row.recordsAmount || "-"}. Compare TDS/TCS amount ${row.tdsTcsAmount || "-"} and supporting documents. ${action}`;
    case "duplicate-statement":
      return `${party}${section}: possible duplicate statement rows for${incomeCategory}. Remove duplicates before tax-record review or deductor follow-up. ${action}`;
    case "identity-or-section-review":
      return `${party}${section}: category or section mismatch between statement category ${row.category || "-"} and books category ${row.recordsCategory || "-"}. Review income category before tax-record review. ${action}`;
    case "matched":
      return `${party}${section}: pasted amounts and category match. Keep evidence with the review file. ${action}`;
    case "manual-review":
      return `${party}${section}: row needs manual review because amount or category context is incomplete. ${action}`;
  }
}

function difference(left: string, right: string): number | null {
  const leftValue = parseAmount(left);
  const rightValue = parseAmount(right);
  if (leftValue === null || rightValue === null) return null;
  return leftValue - rightValue;
}

function parseAmount(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAmountForKey(value: string): string {
  const parsed = parseAmount(value);
  return parsed === null ? `text:${value.trim()}` : `number:${parsed}`;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
