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
  taxPeriod: string;
  documentType: string;
  taxableValue: string;
  taxAmount: string;
  amount: string;
  status: string;
  escalationLevel: string;
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
    taxPeriod: row.taxPeriod || row.period || row.returnPeriod || "",
    documentType: row.documentType || row.docType || row.type || "",
    taxableValue: row.taxableValue || row.taxableAmount || "",
    taxAmount: row.taxAmount || row.itcAmount || "",
    amount: row.amount || row.taxAmount || "",
    status: row.status || "review",
    escalationLevel: row.escalationLevel || row.escalation || row.followUpStage || "",
  };
}

function buildDraft(supplier: string, gstin: string, rows: FollowUpRow[]): string {
  const issueLines = rows.map(formatIssueLine);
  const whatsappLines = rows.map(
    (row) =>
      `- ${row.invoice}: ${row.status}${row.escalationLevel ? ` (${row.escalationLevel})` : ""}`,
  );

  return [
    `Supplier: ${supplier}`,
    gstin ? `GSTIN: ${gstin}` : "GSTIN: not provided",
    `Issue count: ${rows.length}`,
    "",
    "Email draft",
    `Subject: GSTR-2B invoice reporting review - ${supplier}`,
    `${supplier}${gstin ? ` (${gstin})` : ""}: please review the following invoices before taking an ITC position.`,
    ...issueLines,
    "Please confirm reporting or correction status and share correction notes if needed.",
    "",
    "WhatsApp-ready summary",
    `${supplier}: ${rows.length} invoice(s) need GSTR-2B reporting review before ITC position.`,
    ...whatsappLines,
    "Please confirm reporting or correction status.",
  ].join("\n");
}

function formatIssueLine(row: FollowUpRow): string {
  return [
    `- Invoice: ${row.invoice}`,
    row.invoiceDate ? `Date: ${row.invoiceDate}` : null,
    row.taxPeriod ? `Tax period: ${row.taxPeriod}` : null,
    row.documentType ? `Document type: ${row.documentType}` : null,
    row.taxableValue ? `Taxable value: ${row.taxableValue}` : null,
    row.taxAmount ? `Tax amount: ${row.taxAmount}` : null,
    !row.taxAmount && row.amount ? `Amount: ${row.amount}` : null,
    `Status: ${row.status}`,
    row.escalationLevel ? `Escalation: ${row.escalationLevel}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" | ");
}
