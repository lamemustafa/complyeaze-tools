import { parseSimpleCsv, type CsvRow } from "./csv";

export type MsmePayableReview = {
  vendor: string;
  amount: string;
  invoiceDate: string;
  acceptanceDate: string;
  ageDays: number | null;
  possibleFlag: "review" | "missing-date" | "within-window";
};

export function buildMsmePayableReview(
  input: string | CsvRow[],
  asOf = new Date(),
): MsmePayableReview[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;
  return rows.map((row) => {
    const acceptanceDate =
      row.acceptanceDate || row.deemedAcceptanceDate || row.invoiceDate || "";
    const ageDays = daysBetween(acceptanceDate, asOf);
    return {
      vendor: row.vendor || row.vendorName || row.supplier || "Unnamed vendor",
      amount: row.amount || "",
      invoiceDate: row.invoiceDate || row.invoice_date || "",
      acceptanceDate,
      ageDays,
      possibleFlag: ageDays === null ? "missing-date" : ageDays > 45 ? "review" : "within-window",
    };
  });
}

function daysBetween(value: string, asOf: Date): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const ms = asOf.getTime() - date.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
