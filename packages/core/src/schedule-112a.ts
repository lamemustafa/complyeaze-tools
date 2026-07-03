import { parseSimpleCsv, type CsvRow } from "./csv";

const RATE_CUTOVER_DATE = "2024-07-23";
const isinPattern = /^[A-Z0-9]{12}$/;
const isinSentinels = new Set(["INNOTAVAILAB", "INNOTREQUIRD"]);

export type Schedule112ATransferPeriod = "BE" | "AE" | "unknown";

export type Schedule112ARow = {
  scripName: string;
  isin: string;
  isinLooksValid: boolean;
  quantity: number | null;
  salePricePerUnit: number | null;
  fullValueOfConsideration: number | null;
  saleDate: string;
  transferPeriod: Schedule112ATransferPeriod;
  costOfAcquisitionActual: number | null;
  fmv31Jan2018PerUnit: number | null;
  totalFmv31Jan2018: number | null;
  lowerOfFmvAndConsideration: number | null;
  costOfAcquisitionFinal: number | null;
  expenditureOnTransfer: number;
  totalDeductions: number | null;
  gainOrLoss: number | null;
  grandfatheringApplied: boolean;
  flags: string[];
};

export function buildSchedule112ARows(input: string | CsvRow[]): Schedule112ARow[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;
  return rows.map(buildRow);
}

function buildRow(row: CsvRow): Schedule112ARow {
  const scripName = row.scripName || row.name || "Unnamed scrip";
  const isin = (row.isin || "").trim().toUpperCase();
  const isinLooksValid = isinSentinels.has(isin) || isinPattern.test(isin);
  const quantity = parseAmount(row.quantity);
  const salePricePerUnit = parseAmount(row.salePricePerUnit || row.salePrice);
  const explicitConsideration = parseAmount(row.fullValueOfConsideration);
  const fullValueOfConsideration =
    explicitConsideration ??
    (quantity !== null && salePricePerUnit !== null ? quantity * salePricePerUnit : null);
  const saleDate = (row.saleDate || "").trim();
  const transferPeriod = classifyTransferPeriod(saleDate);
  const costOfAcquisitionActual = parseAmount(row.costOfAcquisitionActual || row.costOfAcquisition);
  const fmv31Jan2018PerUnit = parseAmount(row.fmv31Jan2018PerUnit || row.fmv31Jan2018);
  const totalFmv31Jan2018 =
    fmv31Jan2018PerUnit !== null && quantity !== null ? fmv31Jan2018PerUnit * quantity : null;
  const lowerOfFmvAndConsideration =
    totalFmv31Jan2018 !== null && fullValueOfConsideration !== null
      ? Math.min(totalFmv31Jan2018, fullValueOfConsideration)
      : null;
  const grandfatheringApplied = lowerOfFmvAndConsideration !== null && costOfAcquisitionActual !== null;
  const costOfAcquisitionFinal =
    lowerOfFmvAndConsideration !== null && costOfAcquisitionActual !== null
      ? Math.max(costOfAcquisitionActual, lowerOfFmvAndConsideration)
      : costOfAcquisitionActual;
  const expenditureOnTransfer = parseAmount(row.expenditureOnTransfer) ?? 0;
  const totalDeductions =
    costOfAcquisitionFinal !== null ? costOfAcquisitionFinal + expenditureOnTransfer : null;
  const gainOrLoss =
    fullValueOfConsideration !== null && totalDeductions !== null
      ? fullValueOfConsideration - totalDeductions
      : null;

  const flags: string[] = [];
  if (!isinLooksValid) flags.push("ISIN does not look like a 12-character alphanumeric ISIN.");
  if (!saleDate) flags.push("Missing sale date: cannot classify as before/on-or-after 23 July 2024.");
  if (costOfAcquisitionActual === null) flags.push("Missing cost of acquisition.");
  if (fullValueOfConsideration === null) flags.push("Missing quantity/sale price or full value of consideration.");
  if (!grandfatheringApplied) {
    flags.push(
      "No 31-Jan-2018 FMV supplied: grandfathering under Section 55(2)(ac) was not applied, so cost of acquisition uses actual cost only.",
    );
  }

  return {
    scripName,
    isin,
    isinLooksValid,
    quantity,
    salePricePerUnit,
    fullValueOfConsideration,
    saleDate,
    transferPeriod,
    costOfAcquisitionActual,
    fmv31Jan2018PerUnit,
    totalFmv31Jan2018,
    lowerOfFmvAndConsideration,
    costOfAcquisitionFinal,
    expenditureOnTransfer,
    totalDeductions,
    gainOrLoss,
    grandfatheringApplied,
    flags,
  };
}

function classifyTransferPeriod(saleDate: string): Schedule112ATransferPeriod {
  const parsed = parseIsoDate(saleDate);
  if (!parsed) return "unknown";
  return saleDate >= RATE_CUTOVER_DATE ? "AE" : "BE";
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
