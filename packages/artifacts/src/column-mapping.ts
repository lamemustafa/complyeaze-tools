import type { ParsedTable } from "@complyeaze-tools/core";

export type ColumnMapping = Record<string, string>;

export function filterColumnMapping(
  mapping: ColumnMapping,
  allowedTargets: string[],
  sourceHeaders: string[],
): ColumnMapping {
  const targetSet = new Set(allowedTargets);
  const sourceSet = new Set(sourceHeaders);
  return Object.fromEntries(
    Object.entries(mapping).filter(
      (entry): entry is [string, string] =>
        targetSet.has(entry[0]) &&
        isSafeColumnKey(entry[0]) &&
        isSafeSourceKey(entry[1]) &&
        sourceSet.has(entry[1]),
    ),
  );
}

export function applyColumnMapping(parsed: ParsedTable, mapping: ColumnMapping): ParsedTable {
  const availableSources = new Set(parsed.headers);
  const entries = Object.entries(mapping).filter(
    (entry): entry is [string, string] =>
      isSafeColumnKey(entry[0]) && isSafeSourceKey(entry[1]) && availableSources.has(entry[1]),
  );
  if (!entries.length) return parsed;

  const headers = [...parsed.headers];
  const originalHeaders = [...parsed.originalHeaders];
  const rowRecords = parsed.rowRecords.map((record) => ({
    ...record,
    row: { ...record.row },
  }));
  const rows = rowRecords.map((record) => record.row);

  for (const [targetColumn, sourceColumn] of entries) {
    if (!headers.includes(targetColumn)) {
      headers.push(targetColumn);
    }

    for (const record of rowRecords) {
      if (record.row[targetColumn]?.trim()) continue;
      record.row[targetColumn] = record.row[sourceColumn] ?? "";
    }
  }

  return {
    ...parsed,
    rows,
    rowRecords,
    headers,
    originalHeaders,
  };
}

function isSafeColumnKey(value: string | undefined): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value !== "__proto__" &&
    value !== "constructor" &&
    value !== "prototype" &&
    /^[a-z][a-zA-Z0-9]*$/.test(value)
  );
}

function isSafeSourceKey(value: string | undefined): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value !== "__proto__" &&
    value !== "constructor" &&
    value !== "prototype"
  );
}
