import { parseSimpleCsv, type CsvRow } from "./csv";

export type TaxStatementMismatchReview = {
  source: string;
  tan: string;
  section: string;
  category: string;
  amount: string;
  recordsAmount: string;
  difference: number | null;
  note: string;
  feedbackAction: string;
};

export function buildTaxStatementMismatchReview(
  input: string | CsvRow[],
): TaxStatementMismatchReview[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;
  return rows.map((row) => {
    const amount = row.amount || "";
    const recordsAmount = row.recordsAmount || "";
    return {
      source: row.source || "Unknown source",
      tan: row.tan || "",
      section: row.section || "",
      category: row.category || "review",
      amount,
      recordsAmount,
      difference: difference(amount, recordsAmount),
      note: row.note || "review",
      feedbackAction: row.feedbackAction || row.action || "Review against portal records",
    };
  });
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
