import { parseSimpleCsv, type CsvRow } from "./csv";

export type Gstr3bPreLockStatus = "matched" | "needs-amendment" | "missing-data";

export type Gstr3bPreLockRow = {
  lineRef: string;
  table: string;
  booksValue: number | null;
  autoPopulatedValue: number | null;
  difference: number | null;
  status: Gstr3bPreLockStatus;
  correctionPath: string;
};

export type Gstr3bPreLockOptions = {
  tolerance?: number;
  gstr3bAlreadyFiled: boolean;
};

export function buildGstr3bPreLockGapCheck(
  input: string | CsvRow[],
  options: Gstr3bPreLockOptions,
): Gstr3bPreLockRow[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;
  const tolerance = options.tolerance ?? 1;

  return rows.map((row) => {
    const lineRef = row.lineRef || row.invoice || row.note || "Unlabeled row";
    const table = row.table?.trim() || "3.1";
    const booksValue = parseAmount(row.booksValue || row.amount);
    const autoPopulatedValue = parseAmount(row.autoPopulatedValue);

    if (booksValue === null || autoPopulatedValue === null) {
      return {
        lineRef,
        table,
        booksValue,
        autoPopulatedValue,
        difference: null,
        status: "missing-data",
        correctionPath: "booksValue and autoPopulatedValue must both be numbers to compare this row.",
      };
    }

    const difference = booksValue - autoPopulatedValue;

    if (Math.abs(difference) <= tolerance) {
      return {
        lineRef,
        table,
        booksValue,
        autoPopulatedValue,
        difference,
        status: "matched",
        correctionPath: "Books value matches the auto-populated figure within the review tolerance.",
      };
    }

    return {
      lineRef,
      table,
      booksValue,
      autoPopulatedValue,
      difference,
      status: "needs-amendment",
      correctionPath: options.gstr3bAlreadyFiled
        ? "GSTR-3B for this period is already filed, so GSTR-1A is no longer available for this period. Correct this line in a subsequent period's GSTR-1, subject to the applicable amendment time limit."
        : "GSTR-3B for this period is not yet filed. GSTR-1A is available for this period only until GSTR-3B is filed, and only for records reported in the current period's GSTR-1.",
    };
  });
}

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
