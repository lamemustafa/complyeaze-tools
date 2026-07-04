import { parseSimpleCsv, type CsvRow } from "./csv";

export type Gstr3bPreLockStatus = "matched" | "needs-amendment" | "missing-data" | "unsupported-table";

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
    const table = row.table?.trim() || "";
    const booksValue = parseAmount(row.booksValue || row.amount);
    const autoPopulatedValue = parseAmount(row.autoPopulatedValue);

    if (!isSupportedOutwardTable(table)) {
      return {
        lineRef,
        table: table || "missing",
        booksValue,
        autoPopulatedValue,
        difference: null,
        status: table ? "unsupported-table" : "missing-data",
        correctionPath: table
          ? "Only GSTR-3B outward liability tables 3.1 and 3.2 are supported; review this row manually instead of using this tool's correction-path recommendation."
          : "table must be 3.1 or 3.2 to compare this outward-liability row.",
      };
    }

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

function isSupportedOutwardTable(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "3.1" || normalized === "3.2";
}

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
