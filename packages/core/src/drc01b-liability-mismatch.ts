import { parseSimpleCsv, type CsvRow } from "./csv";

export type Drc01bFlag =
  | "review-needed"
  | "no-drc01b-risk"
  | "missing-data";

export type Drc01bPeriodReview = {
  gstin: string;
  period: string;
  gstr1Liability: number | null;
  gstr3bLiability: number | null;
  difference: number | null;
  percentDifference: number | null;
  flag: Drc01bFlag;
  note: string;
};

export function buildDrc01bLiabilityMismatchReview(
  input: string | CsvRow[],
): Drc01bPeriodReview[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;

  return rows.map((row) => {
    const gstin = (row.gstin || "").trim();
    const period = (row.period || "").trim();
    const gstr1Liability = parseAmount(row.gstr1Liability);
    const gstr3bLiability = parseAmount(row.gstr3bLiability);

    if (gstr1Liability === null || gstr3bLiability === null) {
      return {
        gstin,
        period,
        gstr1Liability,
        gstr3bLiability,
        difference: null,
        percentDifference: null,
        flag: "missing-data",
        note: "gstr1Liability and gstr3bLiability must both be numbers to review this period.",
      };
    }

    const difference = gstr1Liability - gstr3bLiability;

    if (difference <= 0) {
      return {
        gstin,
        period,
        gstr1Liability,
        gstr3bLiability,
        difference,
        percentDifference: gstr3bLiability !== 0 ? difference / gstr3bLiability : null,
        flag: "no-drc01b-risk",
        note: "GSTR-3B liability is equal to or higher than GSTR-1 liability. Rule 88C only intimates when GSTR-1 liability exceeds GSTR-3B liability.",
      };
    }

    const percentDifference = gstr3bLiability !== 0 ? difference / gstr3bLiability : null;

    return {
      gstin,
      period,
      gstr1Liability,
      gstr3bLiability,
      difference,
      percentDifference,
      flag: "review-needed",
      note: "GSTR-1 liability exceeds GSTR-3B liability for this period. GSTN does not publish the exact Rs/percentage figure that triggers an automated DRC-01B intimation under Rule 88C, so review any positive gap.",
    };
  });
}

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
