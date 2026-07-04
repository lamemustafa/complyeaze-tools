import { parseSimpleCsv, type CsvRow } from "./csv";
import { reviewMsmePayableRow } from "./msme-review-helpers";
import type { MsmePayableReview } from "./msme-types";

export type { MsmePayableReview, MsmeReviewStartSource } from "./msme-types";

export function buildMsmePayableReview(
  input: string | CsvRow[],
  asOf = new Date(),
): MsmePayableReview[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;
  return rows.map((row) => reviewMsmePayableRow(row, asOf));
}
