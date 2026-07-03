import { parseSimpleCsv, type CsvRow } from "./csv";

export type Gstr2bSupplierFollowUp = {
  supplier: string;
  gstin: string;
  issueCount: number;
  draft: string;
};

type FollowUpRow = {
  supplier: string;
  gstin: string;
  invoice: string;
  invoiceDate: string;
  amount: string;
  status: string;
};

export function buildGstr2bSupplierFollowUps(
  input: string | CsvRow[],
): Gstr2bSupplierFollowUp[] {
  const rows = (typeof input === "string" ? parseSimpleCsv(input) : input)
    .map(normalizeRow)
    .filter((row): row is FollowUpRow => Boolean(row));
  const grouped = new Map<string, FollowUpRow[]>();

  for (const row of rows) {
    const key = `${row.supplier}::${row.gstin}`;
    const supplierRows = grouped.get(key) ?? [];
    supplierRows.push(row);
    grouped.set(key, supplierRows);
  }

  return [...grouped.values()].map((supplierRows) => {
    const first = supplierRows[0];
    return {
      supplier: first.supplier,
      gstin: first.gstin,
      issueCount: supplierRows.length,
      draft: buildDraft(first.supplier, first.gstin, supplierRows),
    };
  });
}

function normalizeRow(row: CsvRow): FollowUpRow | null {
  const supplier = row.supplier || row.vendor || row.vendorName || "";
  const invoice = row.invoice || row.invoiceNumber || row.documentNumber || "";
  if (!supplier || !invoice) return null;

  return {
    supplier,
    gstin: row.gstin || "",
    invoice,
    invoiceDate: row.invoiceDate || "",
    amount: row.amount || row.taxAmount || "",
    status: row.status || "review",
  };
}

function buildDraft(supplier: string, gstin: string, rows: FollowUpRow[]): string {
  return [
    `${supplier}${gstin ? ` (${gstin})` : ""}: please review the following invoices before taking an ITC position.`,
    ...rows.map(
      (row) =>
        `- ${row.invoice}${row.invoiceDate ? ` dated ${row.invoiceDate}` : ""}${row.amount ? ` amount ${row.amount}` : ""}: ${row.status}`,
    ),
    "Please confirm whether the invoices are reported correctly in GSTR-2B and share correction notes if needed.",
  ].join("\n");
}
