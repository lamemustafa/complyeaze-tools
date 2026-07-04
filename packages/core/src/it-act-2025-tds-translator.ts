import { parseSimpleCsv, type CsvRow } from "./csv";

export type TdsMappingRow = {
  oldSection: string;
  newCitation: string;
  paymentType: string;
  rate: string;
  threshold: string;
};

export type TcsCategoryRow = {
  category: string;
  rate: string;
};

/**
 * Every row below was matched against the gazetted Income-tax Act, 2025 (No. 30
 * of 2025) text directly. Sections not listed here were not independently
 * confirmed against the Act text and must not be guessed.
 */
export const VERIFIED_TDS_MAPPINGS: TdsMappingRow[] = [
  {
    oldSection: "192",
    newCitation: "Section 392(1)",
    paymentType: "Salary",
    rate: "As per the applicable income-tax slab rates (average rate method)",
    threshold: "Basic exemption limit under the regime chosen for the employee",
  },
  {
    oldSection: "193",
    newCitation: "Section 393(1), Table Sl. No. 5(i)",
    paymentType: "Interest on securities",
    rate: "Confirm against Section 393(1) Table Sl. No. 5(i)",
    threshold: "Confirm against Section 393(1) Table Sl. No. 5(i)",
  },
  {
    oldSection: "194",
    newCitation: "Section 393(1), Table Sl. No. 7",
    paymentType: "Dividend",
    rate: "10%",
    threshold: "Nil (confirm current exemption conditions against the Act text)",
  },
  {
    oldSection: "194A",
    newCitation: "Section 393(1), Table Sl. No. 5(ii)/(iii)",
    paymentType: "Interest other than interest on securities",
    rate: "Confirm against Section 393(1) Table Sl. No. 5(ii)/(iii)",
    threshold: "Confirm against Section 393(1) Table Sl. No. 5(ii)/(iii)",
  },
  {
    oldSection: "194C",
    newCitation: "Section 393(1), Table Sl. No. 6(i)/(ii)",
    paymentType: "Payments to contractors",
    rate: "1% (individual/HUF payee) or 2% (other payees)",
    threshold: "Rs 30,000 for a single payment or Rs 1,00,000 aggregate in the year; Rs 50 lakh turnover threshold applies before an individual/HUF payer must deduct",
  },
  {
    oldSection: "194H",
    newCitation: "Section 393(1), Table Sl. No. 1(ii)",
    paymentType: "Commission or brokerage",
    rate: "2%",
    threshold: "Rs 20,000",
  },
  {
    oldSection: "194-I",
    newCitation: "Section 393(1), Table Sl. No. 2",
    paymentType: "Rent",
    rate: "2% (plant, machinery, or equipment) or 10% (land, building, or furniture)",
    threshold: "Rs 50,000 per month",
  },
  {
    oldSection: "194-IA",
    newCitation: "Section 393(1), Table Sl. No. 3(i)",
    paymentType: "Transfer of certain immovable property (other than agricultural land)",
    rate: "1% of the higher of consideration and stamp-duty value",
    threshold: "Rs 50 lakh, tested against consideration or stamp-duty value as applicable",
  },
  {
    oldSection: "194J",
    newCitation: "Section 393(1), Table Sl. No. 6(iii)",
    paymentType: "Fees for professional or technical services, royalty",
    rate: "2% (technical services, certain royalty, call-centre payments) or 10% (professional services, other royalty)",
    threshold: "Rs 50,000",
  },
  {
    oldSection: "195",
    newCitation: "Section 393(2)",
    paymentType: "Payments to non-residents",
    rate: "Depends on the specific payment category and any applicable DTAA - see the full Section 393(2) table",
    threshold: "Varies by category",
  },
];

/**
 * Confirmed against the gazetted Act text: Section 394(1) lists these nine TCS
 * categories. Old-Act sub-clause labels (206C(1), 206C(1F), 206C(1G), 206C(1H))
 * were not re-confirmed per category in this pass, so categories are shown by
 * description only, not matched against a pasted old section number.
 */
export const VERIFIED_TCS_CATEGORIES: TcsCategoryRow[] = [
  { category: "Alcoholic liquor for human consumption", rate: "1%" },
  { category: "Tendu leaves", rate: "5%" },
  { category: "Timber or other forest produce", rate: "2%" },
  { category: "Scrap", rate: "1%" },
  { category: "Minerals (coal, lignite, iron ore)", rate: "1%" },
  { category: "Sale of motor vehicle or goods over Rs 10 lakh", rate: "1%" },
  { category: "Remittance under the Liberalised Remittance Scheme (LRS)", rate: "5% or 20% depending on purpose and threshold" },
  { category: "Overseas tour programme package", rate: "5% or 20% depending on threshold" },
  { category: "Parking lot, toll plaza, mining, or quarrying lease/licence", rate: "2%" },
];

export type TdsTranslationStatus = "matched" | "not-verified" | "missing-input";

export type TdsTranslationResult = {
  input: string;
  status: TdsTranslationStatus;
  mapping: TdsMappingRow | null;
  note: string;
};

export function buildTdsSectionTranslation(
  input: string | CsvRow[],
): TdsTranslationResult[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;

  return rows.map((row) => {
    const raw = (row.oldSection || row.section || "").trim();

    if (!raw) {
      return {
        input: raw,
        status: "missing-input",
        mapping: null,
        note: "Paste an old Income-tax Act, 1961 section number such as 194C.",
      };
    }

    if (hasSubClauseSuffix(raw)) {
      return {
        input: raw,
        status: "not-verified",
        mapping: null,
        note: "Sub-clause-qualified section inputs need manual review before translation; enter the parent section only when that is the intended mapping.",
      };
    }

    const normalized = normalizeSection(raw);
    const mapping =
      VERIFIED_TDS_MAPPINGS.find(
        (candidate) => normalizeSection(candidate.oldSection) === normalized,
      ) ?? null;

    if (!mapping) {
      return {
        input: raw,
        status: "not-verified",
        mapping: null,
        note: "Not in the independently verified mapping set yet. Confirm the Income-tax Act, 2025 citation against the official comparison utility or the gazetted Act text before using it - do not guess an adjacent code.",
      };
    }

    return {
      input: raw,
      status: "matched",
      mapping,
      note: "Matched against the gazetted Income-tax Act, 2025 text.",
    };
  });
}

function hasSubClauseSuffix(value: string): boolean {
  return /\([a-z0-9]+\)\s*$/i.test(value.trim());
}

function normalizeSection(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^section\s*/, "")
    .replace(/[^a-z0-9]/g, "");
}
