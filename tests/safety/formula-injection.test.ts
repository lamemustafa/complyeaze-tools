import { describe, expect, it } from "vitest";
import { escapeSpreadsheetCell } from "../../packages/safety/src/spreadsheet";

describe("escapeSpreadsheetCell", () => {
  it.each(["=SUM(A1:A2)", "+cmd", "-10+20", "@HYPERLINK", "\t=2+2", "\r=2+2"])(
    "escapes formula-like value %s",
    (value) => {
      expect(escapeSpreadsheetCell(value)).toBe(`'${value}`);
    },
  );

  it("leaves ordinary values unchanged", () => {
    expect(escapeSpreadsheetCell("GST portal issue memo")).toBe(
      "GST portal issue memo",
    );
  });
});
