import { parseSimpleCsv, type CsvRow } from "./csv";

const GRATUITY_CAP = 2_000_000;
const FIXED_TERM_ELIGIBILITY_YEARS = 1;
const PERMANENT_ELIGIBILITY_YEARS = 5;

export type LabourCodeEmploymentType = "permanent" | "fixed-term";
export type LabourCodeEmploymentCategory = "ordinary" | "working-journalist";
export type LabourCodeTerminationReason = "ordinary" | "death" | "disablement" | "unknown";

export type LabourCodeGratuityRow = {
  employeeName: string;
  basic: number | null;
  da: number | null;
  retainingAllowance: number;
  otherComponents: number | null;
  wages: number | null;
  totalRemuneration: number | null;
  fiftyPercentTestExceeded: boolean | null;
  excessAddedBack: number | null;
  effectiveWageBase: number | null;
  employmentType: LabourCodeEmploymentType | null;
  employmentCategory: LabourCodeEmploymentCategory;
  terminationReason: LabourCodeTerminationReason;
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
  const otherComponents = parseAmount(row.otherComponents);
  const employmentType = normalizeEmploymentType(row.employmentType);
  const employmentCategory = normalizeEmploymentCategory(row.employmentCategory || row.employeeCategory || row.category);
  const terminationReason = normalizeTerminationReason(
    row.terminationReason || row.separationReason || row.exitReason,
  );
  const yearsOfService = parseAmount(row.yearsOfService);

  const flags: string[] = [];
  if (basic === null) flags.push("Missing basic pay.");
  if (da === null) flags.push("Missing dearness allowance.");
  if (yearsOfService === null) flags.push("Missing years of service.");
  if (otherComponents === null) {
    flags.push(
      "Missing otherComponents; enter 0 explicitly if there are no excluded wage components before using the 50% wage test.",
    );
  }
  if (employmentType === null) {
    flags.push(
      "Missing or unsupported employmentType; enter permanent or fixed-term before using gratuity eligibility.",
    );
  }

  const oldWageBase = basic !== null && da !== null ? basic + da : null;
  const wages = basic !== null && da !== null ? basic + da + retainingAllowance : null;
  const totalRemuneration = wages !== null && otherComponents !== null ? wages + otherComponents : null;

  let fiftyPercentTestExceeded: boolean | null = null;
  let excessAddedBack: number | null = null;
  let effectiveWageBase: number | null = wages;

  if (totalRemuneration !== null && otherComponents !== null) {
    const maxAllowedOtherComponents = 0.5 * totalRemuneration;
    fiftyPercentTestExceeded = otherComponents > maxAllowedOtherComponents;
    excessAddedBack = fiftyPercentTestExceeded
      ? otherComponents - maxAllowedOtherComponents
      : 0;
    effectiveWageBase = wages !== null ? wages + excessAddedBack : null;
  }

  const {
    eligibleForGratuity,
    eligibilityBasis,
    flags: eligibilityFlags,
  } = evaluateGratuityEligibility(
    employmentType,
    employmentCategory,
    yearsOfService,
    terminationReason,
  );
  flags.push(...eligibilityFlags);

  const oldGratuityResult = computeGratuity(oldWageBase, yearsOfService, eligibleForGratuity);
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

  if (otherComponents !== null && otherComponents > 0) {
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
    employmentCategory,
    terminationReason,
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
  employmentType: LabourCodeEmploymentType | null,
  employmentCategory: LabourCodeEmploymentCategory,
  yearsOfService: number | null,
  terminationReason: LabourCodeTerminationReason,
): { eligibleForGratuity: boolean | null; eligibilityBasis: string; flags: string[] } {
  if (employmentType === null) {
    return {
      eligibleForGratuity: null,
      eligibilityBasis: "Cannot evaluate eligibility without a supported employment type.",
      flags: [],
    };
  }

  if (yearsOfService === null) {
    return {
      eligibleForGratuity: null,
      eligibilityBasis: "Cannot evaluate eligibility without years of service.",
      flags: [],
    };
  }

  if (terminationReason === "disablement") {
    return {
      eligibleForGratuity: null,
      eligibilityBasis:
        "Disablement rows need manual review because Section 53(4) may require pre-/post-disablement wage periods that this tool does not collect.",
      flags: [
        "Disablement entered: review manually or collect pre-/post-disablement wage split before computing gratuity.",
      ],
    };
  }

  if (terminationReason === "death") {
    return {
      eligibleForGratuity: true,
      eligibilityBasis: `${employmentType === "fixed-term" ? "Fixed-term" : "Permanent"} employee death exception entered; do not deny solely on the ordinary service threshold (Code on Social Security 2020, Section 53).`,
      flags: [],
    };
  }

  if (employmentType === "fixed-term") {
    const eligible = yearsOfService >= FIXED_TERM_ELIGIBILITY_YEARS;
    return {
      eligibleForGratuity: eligible,
      eligibilityBasis: eligible
        ? "Fixed-term employee completing at least 1 year of the contract is exempt from the 5-year continuous-service rule (Code on Social Security 2020, Section 53(1)(d) and second proviso; the 1-year figure is Ministry of Labour FAQ guidance, not literal Act text)."
        : "Fixed-term employee has not completed the 1-year threshold referenced in Ministry of Labour FAQ guidance.",
      flags: [],
    };
  }

  if (employmentCategory === "working-journalist" && yearsOfService >= 3) {
    return {
      eligibleForGratuity: true,
      eligibilityBasis:
        "Working journalist category entered; Section 53 deems the continuous-service requirement to be 3 years for working journalists.",
      flags: [],
    };
  }

  if (yearsOfService >= PERMANENT_ELIGIBILITY_YEARS) {
    return {
      eligibleForGratuity: true,
      eligibilityBasis: "Meets the 5-year continuous-service requirement (Code on Social Security 2020, Section 53).",
      flags: [],
    };
  }

  if (employmentCategory !== "working-journalist" && yearsOfService >= 3) {
    return {
      eligibleForGratuity: null,
      eligibilityBasis:
        "Permanent employee has 3-5 years of service; confirm whether the working-journalist 3-year rule applies before treating the row as ineligible.",
      flags: [
        "Permanent employee has 3-5 years of service; enter employmentCategory=working-journalist when applicable before denying gratuity.",
      ],
    };
  }

  if (terminationReason === "unknown") {
    return {
      eligibleForGratuity: null,
      eligibilityBasis: "Permanent employee has under 5 years of service; termination reason is needed to check death/disablement exceptions.",
      flags: [
        "Permanent employee has under 5 years of service; enter terminationReason to check death/disablement exceptions before treating the row as ineligible.",
      ],
    };
  }

  return {
    eligibleForGratuity: false,
    eligibilityBasis: "Has not completed 5 years of continuous service and no death/disablement exception was entered (Code on Social Security 2020, Section 53).",
    flags: [],
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

function normalizeEmploymentCategory(value: string | undefined): LabourCodeEmploymentCategory {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z]+/g, "") ?? "";
  return normalized === "workingjournalist" || normalized === "journalist"
    ? "working-journalist"
    : "ordinary";
}

function normalizeTerminationReason(value: string | undefined): LabourCodeTerminationReason {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z]+/g, "") ?? "";
  if (["death", "died", "deceased"].includes(normalized)) return "death";
  if (["disablement", "disabled", "disability"].includes(normalized)) return "disablement";
  if (["resignation", "resigned", "retirement", "retired", "termination", "ordinary", "other"].includes(normalized)) {
    return "ordinary";
  }
  return "unknown";
}

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
