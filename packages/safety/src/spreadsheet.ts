const formulaPrefix = /^[=+\-@\t\r]/;

export function escapeSpreadsheetCell(value: string): string {
  return formulaPrefix.test(value) ? `'${value}` : value;
}
