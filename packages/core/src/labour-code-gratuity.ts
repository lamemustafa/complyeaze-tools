import { parseSimpleCsv, type CsvRow } from "./csv";

const GRATUITY_CAP = 2_000_000;
const FIXED_TERM_ELIGIBILITY_YEARS = 1;
const PERMANENT_ELIGIBILITY_YEARS = 5;

export type LabourCodeEmploymentType = "permanent" | "fixed-term";

export type LabourCodeGratuityRow = {
  employeeName: string;
  basic: number | null;
  da: number | null;
  retainingAllowance: number;
  otherComponents: number;
  wages: number | null;
  totalRemuneration: number | null;
  fiftyPercentTestExceeded: boolean | null;
  excessAddedBack: number | null;
  effectiveWageBase: number | null;
  employmentType: LabourCodeEmploymentType;
  yearsOfService: number | null;
  eligibleForGratuity: boolean | null;
  eligibilityBasis: string;
  gratuityOld: number | null;
  gratuityNew: number | null;
  gratuityDelta: number | null;
  flags: string[];
};

export function buildLabourCodeGratuityReview(
  input: string | CsvRow[],
): LabourCodeGratuityRow[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;
  return rows.map(buildRow);
}

function buildRow(row: CsvRow): LabourCodeGratuityRow {
  const employeeName = row.employeeName || row.name || "Unnamed employee";
  const basic = parseAmount(row.basic);
  const da = parseAmount(row.da);
  const retainingAllowance = parseAmount(row.retainingAllowance) ?? 0;
  const otherComponents = parseAmount(row.otherComponents) ?? 0;
  const employmentType: LabourCodeEmploymentType =
    normalizeEmploymentType(row.employmentType) ?? "permanent";
  const yearsOfService = parseAmount(row.yearsOfService);

  const flags: string[] = [];
  if (basic === null) flags.push("Missing basic pay.");
  if (da === null) flags.push("Missing dearness allowance.");
  if (yearsOfService === null) flags.push("Missing years of service.");

  const wages = basic !== null && da !== null ? basic + da + retainingAllowance : null;
  const totalRemuneration = wages !== null ? wages + otherComponents : null;

  let fiftyPercentTestExceeded: boolean | null = null;
  let excessAddedBack: number | null = null;
  let effectiveWageBase: number | null = wages;

  if (totalRemuneration !== null) {
    const maxAllowedOtherComponents = 0.5 * totalRemuneration;
    fiftyPercentTestExceeded = otherComponents > maxAllowedOtherComponents;
    excessAddedBack = fiftyPercentTestExceeded
      ? otherComponents - maxAllowedOtherComponents
      : 0;
    effectiveWageBase = wages !== null ? wages + excessAddedBack : null;
  }

  const { eligibleForGratuity, eligibilityBasis } = evaluateGratuityEligibility(
    employmentType,
    yearsOfService,
  );

  const oldGratuityResult = computeGratuity(wages, yearsOfService, eligibleForGratuity);
  const newGratuityResult = computeGratuity(effectiveWageBase, yearsOfService, eligibleForGratuity);
  const gratuityOld = oldGratuityResult?.amount ?? null;
  const gratuityNew = newGratuityResult?.amount ?? null;
  const gratuityDelta =
    gratuityOld !== null && gratuityNew !== null ? gratuityNew - gratuityOld : null;

  if (employmentType === "fixed-term" && eligibleForGratuity) {
    flags.push(
      "Fixed-term gratuity is payable on a pro-rata basis per the second and third provisos to Code on Social Security 2020 Section 53(1)(d)/53(2); this tool applies the standard (wages/26)x15xyears formula and does not independently model the exact pro-rata mechanics - confirm the pro-rata figure against the Act text and the Ministry FAQ before relying on it.",
    );
  }

  if (oldGratuityResult?.capped || newGratuityResult?.capped) {
    flags.push(
      "Gratuity capped at the currently-notified Rs 20,00,000 limit (Code on Social Security 2020, Section 53(3)); this is a notified amount the Central Government can change, not a fixed figure in the Act text.",
    );
  }

  if (otherComponents > 0) {
    flags.push(
      "The 50% test denominator here is wages plus otherComponents only. It does not add a gratuity or retrenchment-compensation figure into total remuneration, since those are not standard recurring monthly payroll components - the Ministry's own FAQ worked example includes them where relevant to a specific event, which can give a different total remuneration figure for that purpose.",
    );
  }

  return {
    employeeName,
    basic,
    da,
    retainingAllowance,
    otherComponents,
    wages,
    totalRemuneration,
    fiftyPercentTestExceeded,
    excessAddedBack,
    effectiveWageBase,
    employmentType,
    yearsOfService,
    eligibleForGratuity,
    eligibilityBasis,
    gratuityOld,
    gratuityNew,
    gratuityDelta,
    flags,
  };
}

function evaluateGratuityEligibility(
  employmentType: LabourCodeEmploymentType,
  yearsOfService: number | null,
): { eligibleForGratuity: boolean | null; eligibilityBasis: string } {
  if (yearsOfService === null) {
    return {
      eligibleForGratuity: null,
      eligibilityBasis: "Cannot evaluate eligibility without years of service.",
    };
  }

  if (employmentType === "fixed-term") {
    const eligible = yearsOfService >= FIXED_TERM_ELIGIBILITY_YEARS;
    return {
      eligibleForGratuity: eligible,
      eligibilityBasis: eligible
        ? "Fixed-term employee completing at least 1 year of the contract is exempt from the 5-year continuous-service rule (Code on Social Security 2020, Section 53(1)(d) and second proviso; the 1-year figure is Ministry of Labour FAQ guidance, not literal Act text)."
        : "Fixed-term employee has not completed the 1-year threshold referenced in Ministry of Labour FAQ guidance.",
    };
  }

  const eligible = yearsOfService >= PERMANENT_ELIGIBILITY_YEARS;
  return {
    eligibleForGratuity: eligible,
    eligibilityBasis: eligible
      ? "Meets the 5-year continuous-service requirement (Code on Social Security 2020, Section 53)."
      : "Has not completed 5 years of continuous service (Code on Social Security 2020, Section 53).",
  };
}

type GratuityComputation = { amount: number; capped: boolean };

function computeGratuity(
  wageBase: number | null,
  yearsOfService: number | null,
  eligible: boolean | null,
): GratuityComputation | null {
  if (!eligible || wageBase === null || yearsOfService === null) return null;
  const roundedYears = roundServiceYears(yearsOfService);
  const gratuity = (wageBase / 26) * 15 * roundedYears;
  return { amount: Math.min(gratuity, GRATUITY_CAP), capped: gratuity > GRATUITY_CAP };
}

function roundServiceYears(yearsOfService: number): number {
  const wholeYears = Math.floor(yearsOfService);
  const remainder = yearsOfService - wholeYears;
  return remainder > 0.5 ? wholeYears + 1 : wholeYears;
}

function normalizeEmploymentType(value: string | undefined): LabourCodeEmploymentType | null {
  const normalized = value?.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (normalized === "fixed-term" || normalized === "fixedterm") return "fixed-term";
  if (normalized === "permanent") return "permanent";
  return null;
}

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
