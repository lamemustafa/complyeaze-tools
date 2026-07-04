import { parseSimpleCsv, type CsvRow } from "./csv";

export type Gstr2bRecoSource = "purchase" | "gstr2b";

export type Gstr2bRecoStatus =
  | "matched"
  | "missing-in-2b"
  | "extra-in-2b"
  | "value-mismatch"
  | "duplicate-key"
  | "context-review";

export type Gstr2bRecoIssue = {
  status: Gstr2bRecoStatus;
  supplier: string;
  invoice: string;
  key: string;
  purchaseTaxAmount: number | null;
  gstr2bTaxAmount: number | null;
  difference: number | null;
  note: string;
  contextFlags: string[];
};

export type Gstr2bRecoSummary = {
  totalRows: number;
  skippedRowCount: number;
  counts: Record<Gstr2bRecoStatus, number>;
  issues: Gstr2bRecoIssue[];
};

export type Gstr2bRecoMatchField = "invoiceDate" | "documentType" | "amendmentType";

export type Gstr2bRecoOptions = {
  tolerance?: number;
  matchFields?: Gstr2bRecoMatchField[];
  reviewContext?: boolean;
};

type NormalizedRow = {
  source: Gstr2bRecoSource;
  supplier: string;
  gstin: string;
  invoice: string;
  invoiceDate: string;
  documentType: string;
  amendmentType: string;
  itcAvailability: string;
  imsStatus: string;
  reverseCharge: string;
  taxAmount: number | null;
  key: string;
};

const statuses: Gstr2bRecoStatus[] = [
  "missing-in-2b",
  "extra-in-2b",
  "value-mismatch",
  "duplicate-key",
  "context-review",
  "matched",
];

export function buildGstr2bReconciliationTriage(
  input: string | CsvRow[],
  optionsOrTolerance: number | Gstr2bRecoOptions = 2,
): Gstr2bRecoSummary {
  const options = normalizeOptions(optionsOrTolerance);
  const inputRows = typeof input === "string" ? parseSimpleCsv(input) : input;
  const rows = inputRows
    .map((row) => normalizeRow(row, options.matchFields))
    .filter((row): row is NormalizedRow => row !== null);
  const grouped = groupByKey(rows);
  const issues = [...grouped.entries()]
    .flatMap(([key, group]) =>
      classifyGroup(key, group.purchase, group.gstr2b, options.tolerance, options.reviewContext),
    )
    .sort((left, right) => statusRank(left.status) - statusRank(right.status));

  return {
    totalRows: rows.length,
    skippedRowCount: inputRows.length - rows.length,
    counts: countIssues(issues),
    issues,
  };
}

function normalizeOptions(optionsOrTolerance: number | Gstr2bRecoOptions): Required<Gstr2bRecoOptions> {
  if (typeof optionsOrTolerance === "number") {
    return { tolerance: optionsOrTolerance, matchFields: [], reviewContext: false };
  }
  return {
    tolerance: optionsOrTolerance.tolerance ?? 2,
    matchFields: optionsOrTolerance.matchFields ?? [],
    reviewContext: optionsOrTolerance.reviewContext ?? false,
  };
}

function normalizeRow(
  row: CsvRow,
  matchFields: Gstr2bRecoMatchField[],
): NormalizedRow | null {
  const source = normalizeSource(row.source);
  if (!source) return null;

  const supplierName = row.supplier || row.vendor || "";
  const gstin = normalizeText(row.gstin ?? "");
  const invoice = normalizeText(row.invoice || row.invoiceNumber || row.documentNumber || "");
  const invoiceDate = normalizeDate(row.invoiceDate || row.date || "");
  const documentType = normalizeText(row.documentType || row.docType || row.type || "");
  const amendmentType = normalizeAmendmentType(
    row.amendmentType || row.amendment || row.table || row.returnTable || row.section || "",
  );
  const itcAvailability = normalizeText(row.itcAvailability || row.itcAvailable || row.itcStatus || "");
  const imsStatus = normalizeText(row.imsStatus || row.ims || row.recipientAction || "");
  const reverseCharge = normalizeText(row.reverseCharge || row.rcm || row.reverseChargeFlag || "");
  const taxAmount =
    parseAmount(row.taxAmount || row.itcAmount || row.amount) ??
    parseTaxComponents(row.igst, row.cgst, row.sgst);
  const fallbackSupplier = normalizeText(supplierName);
  const key = buildKey(
    gstin || fallbackSupplier,
    invoice,
    invoiceDate,
    documentType,
    amendmentType,
    matchFields,
  );

  if (!invoice || (!gstin && !fallbackSupplier)) return null;

  return {
    source,
    supplier: supplierName || "Unknown supplier",
    gstin,
    invoice,
    invoiceDate,
    documentType,
    amendmentType,
    itcAvailability,
    imsStatus,
    reverseCharge,
    taxAmount,
    key,
  };
}

function buildKey(
  party: string,
  invoice: string,
  invoiceDate: string,
  documentType: string,
  amendmentType: string,
  matchFields: Gstr2bRecoMatchField[],
): string {
  const parts = [party, invoice];
  if (matchFields.includes("invoiceDate")) parts.push(invoiceDate);
  if (matchFields.includes("documentType")) parts.push(documentType);
  if (matchFields.includes("amendmentType")) parts.push(amendmentType);
  return parts.join(":");
}

function normalizeSource(value: string | undefined): Gstr2bRecoSource | null {
  const normalized = normalizeText(value ?? "");
  if (["purchase", "purchase register", "books", "pr"].includes(normalized)) {
    return "purchase";
  }
  if (["2b", "gstr2b", "gstr-2b", "portal"].includes(normalized)) {
    return "gstr2b";
  }
  return null;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeDate(value: string) {
  return value.trim().toLowerCase();
}

function normalizeAmendmentType(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (
    normalized.includes("amend") ||
    [
      "b2ba",
      "b2bcdnra",
      "cdnra",
      "isda",
      "ecoa",
      "impgamendments",
      "impgsezamendments",
      "b2baitcreversal",
      "b2bdnra",
    ].includes(normalized)
  ) {
    return "amendment";
  }
  return "original";
}

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTaxComponents(
  igst: string | undefined,
  cgst: string | undefined,
  sgst: string | undefined,
): number | null {
  const parsed = [igst, cgst, sgst].map(parseAmount).filter((value): value is number => value !== null);
  return parsed.length ? parsed.reduce((sum, value) => sum + value, 0) : null;
}

function groupByKey(rows: NormalizedRow[]) {
  const grouped = new Map<
    string,
    { purchase: NormalizedRow[]; gstr2b: NormalizedRow[] }
  >();

  for (const row of rows) {
    const group = grouped.get(row.key) ?? { purchase: [], gstr2b: [] };
    group[row.source].push(row);
    grouped.set(row.key, group);
  }

  return grouped;
}

function classifyGroup(
  key: string,
  purchase: NormalizedRow[],
  gstr2b: NormalizedRow[],
  tolerance: number,
  reviewContext: boolean,
): Gstr2bRecoIssue[] {
  if (purchase.length > 1 || gstr2b.length > 1) {
    const row = purchase[0] ?? gstr2b[0];
    return [
      issue("duplicate-key", row, key, purchase[0] ?? null, gstr2b[0] ?? null, null),
    ];
  }

  const purchaseRow = purchase[0] ?? null;
  const gstr2bRow = gstr2b[0] ?? null;
  const row = purchaseRow ?? gstr2bRow;
  if (!row) return [];

  if (!purchaseRow) return [issue("extra-in-2b", row, key, null, gstr2bRow, null)];
  if (!gstr2bRow) return [issue("missing-in-2b", row, key, purchaseRow, null, null)];

  const difference = amountDifference(purchaseRow.taxAmount, gstr2bRow.taxAmount);
  if (difference === null || Math.abs(difference) > tolerance) {
    return [issue("value-mismatch", row, key, purchaseRow, gstr2bRow, difference)];
  }

  const contextFlags = reviewContext ? buildContextFlags(gstr2bRow) : [];
  if (contextFlags.length) {
    return [
      issue("context-review", row, key, purchaseRow, gstr2bRow, difference, contextFlags),
    ];
  }

  return [issue("matched", row, key, purchaseRow, gstr2bRow, difference)];
}

function buildContextFlags(row: NormalizedRow): string[] {
  const flags: string[] = [];
  if (["no", "notavailable", "notavail", "ineligible", "unavailable"].includes(row.itcAvailability)) {
    flags.push("ITC availability marked not available");
  }
  if (["rejected", "reject"].includes(row.imsStatus)) {
    flags.push("IMS status marked rejected");
  } else if (["pending", "deferred", "noaction"].includes(row.imsStatus)) {
    flags.push("IMS status marked pending");
  }
  if (row.amendmentType === "amendment") {
    flags.push("Amendment table or flag present");
  }
  if (["yes", "y", "true", "rcm", "reversecharge"].includes(row.reverseCharge)) {
    flags.push("Reverse-charge flag present");
  }
  return flags;
}

function amountDifference(left: number | null, right: number | null) {
  if (left === null || right === null) return null;
  return left - right;
}

function issue(
  status: Gstr2bRecoStatus,
  row: NormalizedRow,
  key: string,
  purchase: NormalizedRow | null,
  gstr2b: NormalizedRow | null,
  difference: number | null,
  contextFlags: string[] = [],
): Gstr2bRecoIssue {
  return {
    status,
    supplier: row.supplier,
    invoice: row.invoice,
    key,
    purchaseTaxAmount: purchase?.taxAmount ?? null,
    gstr2bTaxAmount: gstr2b?.taxAmount ?? null,
    difference,
    note: noteFor(status),
    contextFlags,
  };
}

function noteFor(status: Gstr2bRecoStatus) {
  switch (status) {
    case "missing-in-2b":
      return "Purchase-register invoice not found in pasted GSTR-2B rows.";
    case "extra-in-2b":
      return "GSTR-2B invoice not found in pasted purchase-register rows.";
    case "value-mismatch":
      return "Tax amount differs beyond the review tolerance or needs manual comparison.";
    case "duplicate-key":
      return "More than one row shares the same GSTIN/supplier and invoice key.";
    case "context-review":
      return "Pasted rows match numerically, but ITC availability or IMS context needs professional review.";
    case "matched":
      return "Pasted rows match within the review tolerance.";
  }
}

function countIssues(issues: Gstr2bRecoIssue[]) {
  return Object.fromEntries(
    statuses.map((status) => [
      status,
      issues.filter((issue) => issue.status === status).length,
    ]),
  ) as Record<Gstr2bRecoStatus, number>;
}

function statusRank(status: Gstr2bRecoStatus) {
  return statuses.indexOf(status);
}
