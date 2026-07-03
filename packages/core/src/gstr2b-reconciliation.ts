import { parseSimpleCsv, type CsvRow } from "./csv";

export type Gstr2bRecoSource = "purchase" | "gstr2b";

export type Gstr2bRecoStatus =
  | "matched"
  | "missing-in-2b"
  | "extra-in-2b"
  | "value-mismatch"
  | "duplicate-key";

export type Gstr2bRecoIssue = {
  status: Gstr2bRecoStatus;
  supplier: string;
  invoice: string;
  key: string;
  purchaseTaxAmount: number | null;
  gstr2bTaxAmount: number | null;
  difference: number | null;
  note: string;
};

export type Gstr2bRecoSummary = {
  totalRows: number;
  counts: Record<Gstr2bRecoStatus, number>;
  issues: Gstr2bRecoIssue[];
};

type NormalizedRow = {
  source: Gstr2bRecoSource;
  supplier: string;
  gstin: string;
  invoice: string;
  taxAmount: number | null;
  key: string;
};

const statuses: Gstr2bRecoStatus[] = [
  "missing-in-2b",
  "extra-in-2b",
  "value-mismatch",
  "duplicate-key",
  "matched",
];

export function buildGstr2bReconciliationTriage(
  input: string,
  tolerance = 2,
): Gstr2bRecoSummary {
  const rows = parseSimpleCsv(input)
    .map(normalizeRow)
    .filter((row): row is NormalizedRow => row !== null);
  const grouped = groupByKey(rows);
  const issues = [...grouped.entries()]
    .flatMap(([key, group]) => classifyGroup(key, group.purchase, group.gstr2b, tolerance))
    .sort((left, right) => statusRank(left.status) - statusRank(right.status));

  return {
    totalRows: rows.length,
    counts: countIssues(issues),
    issues,
  };
}

function normalizeRow(row: CsvRow): NormalizedRow | null {
  const source = normalizeSource(row.source);
  if (!source) return null;

  const supplier = row.supplier || row.vendor || "Unknown supplier";
  const gstin = normalizeText(row.gstin);
  const invoice = normalizeText(row.invoice || row.invoiceNumber || row.documentNumber);
  const taxAmount = parseAmount(row.taxAmount || row.itcAmount || row.amount);
  const fallbackSupplier = normalizeText(supplier);
  const key = `${gstin || fallbackSupplier}:${invoice}`;

  if (!invoice || (!gstin && !fallbackSupplier)) return null;

  return {
    source,
    supplier,
    gstin,
    invoice,
    taxAmount,
    key,
  };
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

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
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

  return [issue("matched", row, key, purchaseRow, gstr2bRow, difference)];
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
