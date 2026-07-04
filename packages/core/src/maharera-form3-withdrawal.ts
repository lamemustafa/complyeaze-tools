import { parseSimpleCsv, type CsvRow } from "./csv";

export type MahareraForm3Row = {
  projectName: string;
  totalEstimatedLandCost: number | null;
  totalEstimatedConstructionCost: number | null;
  totalEstimatedCost: number | null;
  landCostIncurred: number | null;
  constructionCostIncurred: number | null;
  financingCostIncurred: number;
  costIncurred: number | null;
  proportionOfCostIncurred: number | null;
  maxWithdrawableCeiling: number | null;
  amountWithdrawnTillDate: number | null;
  netWithdrawable: number | null;
  designatedAccountBalance: number | null;
  netWithdrawableCappedByBalance: number | null;
  flags: string[];
};

export function buildMahareraForm3WithdrawalWorksheet(
  input: string | CsvRow[],
): MahareraForm3Row[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;
  return rows.map(buildRow);
}

function buildRow(row: CsvRow): MahareraForm3Row {
  const projectName = row.projectName || row.name || "Unnamed project";
  const totalEstimatedLandCost = parseAmount(row.totalEstimatedLandCost);
  const totalEstimatedConstructionCost = parseAmount(row.totalEstimatedConstructionCost);
  const landCostIncurred = parseAmount(row.landCostIncurred);
  const constructionCostIncurred = parseAmount(row.constructionCostIncurred);
  const financingCostIncurred = parseAmount(row.financingCostIncurred) ?? 0;
  const amountWithdrawnTillDate = parseAmount(row.amountWithdrawnTillDate);
  const designatedAccountBalance = parseAmount(row.designatedAccountBalance);

  const flags: string[] = [];
  if (totalEstimatedLandCost === null || totalEstimatedConstructionCost === null) {
    flags.push("Missing totalEstimatedLandCost or totalEstimatedConstructionCost.");
  }
  if (landCostIncurred === null || constructionCostIncurred === null) {
    flags.push("Missing landCostIncurred or constructionCostIncurred.");
  }
  if (amountWithdrawnTillDate === null) {
    flags.push(
      "Missing amountWithdrawnTillDate; net withdrawable cannot be computed without prior withdrawals.",
    );
  }
  if (financingCostIncurred > 0) {
    flags.push(
      "financingCostIncurred was included in cost incurred. MahaRERA Circular No. 7/2017 documents the ratio as construction and land cost incurred; whether financing/interest cost also counts was not independently confirmed - verify with your engagement's usual practice before relying on this row.",
    );
  }

  const totalEstimatedCost =
    totalEstimatedLandCost !== null && totalEstimatedConstructionCost !== null
      ? totalEstimatedLandCost + totalEstimatedConstructionCost
      : null;
  const costIncurred =
    landCostIncurred !== null && constructionCostIncurred !== null
      ? landCostIncurred + constructionCostIncurred + financingCostIncurred
      : null;

  let proportionOfCostIncurred: number | null = null;
  let maxWithdrawableCeiling: number | null = null;
  let netWithdrawable: number | null = null;
  let netWithdrawableCappedByBalance: number | null = null;

  if (totalEstimatedCost !== null && costIncurred !== null) {
    if (totalEstimatedCost === 0) {
      flags.push("Total estimated cost is zero; cannot compute a proportion.");
    } else {
      // MahaRERA Circular No. 7/2017 states the ceiling as "total estimated
      // cost x proportion of cost incurred to total estimated cost", which
      // algebraically reduces to cost incurred itself. Computed directly
      // here (rather than as total x (incurred / total)) to avoid float
      // round-trip error; proportionOfCostIncurred is still reported
      // separately since Form 3 Table B shows it as its own line (row 4).
      proportionOfCostIncurred = costIncurred / totalEstimatedCost;
      maxWithdrawableCeiling = costIncurred;
      if (amountWithdrawnTillDate !== null) {
        netWithdrawable = maxWithdrawableCeiling - amountWithdrawnTillDate;
        netWithdrawableCappedByBalance =
          designatedAccountBalance !== null
            ? Math.min(netWithdrawable, designatedAccountBalance)
            : netWithdrawable;
      }

      if (netWithdrawable !== null && netWithdrawable < 0) {
        flags.push("Amount already withdrawn exceeds the computed ceiling for this row - review before relying on this figure.");
      }
    }
  }

  return {
    projectName,
    totalEstimatedLandCost,
    totalEstimatedConstructionCost,
    totalEstimatedCost,
    landCostIncurred,
    constructionCostIncurred,
    financingCostIncurred,
    costIncurred,
    proportionOfCostIncurred,
    maxWithdrawableCeiling,
    amountWithdrawnTillDate,
    netWithdrawable,
    designatedAccountBalance,
    netWithdrawableCappedByBalance,
    flags,
  };
}

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
