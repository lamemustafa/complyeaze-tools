export type CsvRow = Record<string, string>;

export type Delimiter = "," | "\t" | ";";

export type ParseIssueCode = "missing-cell" | "extra-cell" | "unterminated-quote";

export type ParseIssue = {
  rowNumber: number;
  code: ParseIssueCode;
  message: string;
  column?: string;
};

export type ParsedTable = {
  rows: CsvRow[];
  headers: string[];
  originalHeaders: string[];
  delimiter: Delimiter;
  issues: ParseIssue[];
  skippedBlankRows: number;
};

type ParsedRecord = {
  rowNumber: number;
  cells: string[];
};

const knownHeaderKeys: Record<string, string> = {
  acceptance: "acceptanceDate",
  acceptancedate: "acceptanceDate",
  action: "action",
  amount: "amount",
  attemptedat: "attemptedAt",
  category: "category",
  documentnumber: "documentNumber",
  error: "error",
  gstin: "gstin",
  invoice: "invoice",
  invoicedate: "invoiceDate",
  invoicenumber: "invoiceNumber",
  itcamount: "itcAmount",
  note: "note",
  recordsamount: "recordsAmount",
  source: "source",
  status: "status",
  supplier: "supplier",
  taxamount: "taxAmount",
  vendor: "vendor",
  vendorname: "vendorName",
};

export function parseSimpleCsv(input: string): CsvRow[] {
  return parseDelimitedTable(input).rows;
}

export function parseDelimitedTable(input: string): ParsedTable {
  const delimiter = detectDelimiter(input);
  const records = parseRecords(input, delimiter);
  const issues: ParseIssue[] = [];
  if (records.unterminatedQuoteRow !== null) {
    issues.push({
      rowNumber: records.unterminatedQuoteRow,
      code: "unterminated-quote",
      message: "Quoted cell was not closed before the end of input.",
    });
  }

  const headerRecord = records.records.find((record) => !isBlankRecord(record));
  if (!headerRecord) {
    return {
      rows: [],
      headers: [],
      originalHeaders: [],
      delimiter,
      issues,
      skippedBlankRows: 0,
    };
  }

  const dataRecords = records.records.slice(records.records.indexOf(headerRecord) + 1);
  const originalHeaders = headerRecord.cells.map((header) => cleanCell(header));
  const headers = originalHeaders.map(normalizeHeaderKey);
  const rows: CsvRow[] = [];
  let skippedBlankRows = 0;

  for (const record of dataRecords) {
    if (isBlankRecord(record)) {
      skippedBlankRows += 1;
      continue;
    }

    const row: CsvRow = {};
    for (const [index, header] of headers.entries()) {
      row[header] = cleanCell(record.cells[index] ?? "");
      if (index >= record.cells.length) {
        issues.push({
          rowNumber: record.rowNumber,
          code: "missing-cell",
          column: header,
          message: `Missing value for ${header}.`,
        });
      }
    }

    if (record.cells.length > headers.length) {
      issues.push({
        rowNumber: record.rowNumber,
        code: "extra-cell",
        message: `Row has ${record.cells.length - headers.length} extra cell(s).`,
      });
    }

    rows.push(row);
  }

  return {
    rows,
    headers,
    originalHeaders,
    delimiter,
    issues,
    skippedBlankRows,
  };
}

export function detectDelimiter(input: string): Delimiter {
  const headerLine = firstNonBlankLine(input);
  const counts: Array<[Delimiter, number]> = [
    ["\t", countDelimiter(headerLine, "\t")],
    [",", countDelimiter(headerLine, ",")],
    [";", countDelimiter(headerLine, ";")],
  ];
  const [delimiter] = counts.sort((left, right) => right[1] - left[1])[0];
  return delimiter;
}

export function normalizeHeaderKey(header: string): string {
  const cleaned = cleanCell(header).replace(/^\uFEFF/, "");
  const compact = cleaned.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();
  const known = knownHeaderKeys[compact];
  if (known) return known;

  const words = cleaned
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean);
  if (!words.length) return compact;

  const [firstWord, ...rest] = words.map((word) => word.toLowerCase());
  return [
    firstWord,
    ...rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1)),
  ].join("");
}

function parseRecords(
  input: string,
  delimiter: Delimiter,
): { records: ParsedRecord[]; unterminatedQuoteRow: number | null } {
  const records: ParsedRecord[] = [];
  let cells: string[] = [];
  let current = "";
  let quoted = false;
  let rowNumber = 1;
  let recordStart = 1;
  let lastCharWasRecordBreak = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        current += '"';
        index += 1;
        lastCharWasRecordBreak = false;
        continue;
      }
      quoted = !quoted;
      lastCharWasRecordBreak = false;
      continue;
    }

    if (char === delimiter && !quoted) {
      cells.push(cleanCell(current));
      current = "";
      lastCharWasRecordBreak = false;
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      cells.push(cleanCell(current));
      records.push({ rowNumber: recordStart, cells });
      cells = [];
      current = "";
      lastCharWasRecordBreak = true;
      if (char === "\r" && next === "\n") index += 1;
      rowNumber += 1;
      recordStart = rowNumber;
      continue;
    }

    if (char === "\n" || char === "\r") {
      current += "\n";
      if (char === "\r" && next === "\n") index += 1;
      rowNumber += 1;
      lastCharWasRecordBreak = false;
      continue;
    }

    current += char;
    lastCharWasRecordBreak = false;
  }

  if (!lastCharWasRecordBreak || current || cells.length) {
    cells.push(cleanCell(current));
    records.push({ rowNumber: recordStart, cells });
  }

  return {
    records,
    unterminatedQuoteRow: quoted ? recordStart : null,
  };
}

function firstNonBlankLine(input: string): string {
  return input.split(/\r?\n/).find((line) => line.trim()) ?? "";
}

function countDelimiter(line: string, delimiter: Delimiter): number {
  let count = 0;
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) count += 1;
  }
  return count;
}

function cleanCell(cell: string): string {
  return cell.replace(/^\uFEFF/, "").trim();
}

function isBlankRecord(record: ParsedRecord): boolean {
  return record.cells.every((cell) => !cell.trim());
}
