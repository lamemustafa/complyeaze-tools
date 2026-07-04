import { describe, expect, it } from "vitest";
import { buildGstr3bPreLockGapCheck } from "../../packages/core/src/gstr3b-prelock-gap";

describe("buildGstr3bPreLockGapCheck", () => {
  it("matches rows within tolerance and flags rows outside it", () => {
    const rows = buildGstr3bPreLockGapCheck(
      [
        "lineRef,table,booksValue,autoPopulatedValue",
        "B2B outward - 18%,3.1,412000,405000",
        "Inter-state to unregistered,3.2,58000,58000",
      ].join("\n"),
      { gstr3bAlreadyFiled: false },
    );

    expect(rows[0].status).toBe("needs-amendment");
    expect(rows[1].status).toBe("matched");
  });

  it("recommends GSTR-1A when the period is not yet filed", () => {
    const rows = buildGstr3bPreLockGapCheck(
      "lineRef,table,booksValue,autoPopulatedValue\nB2C outward - 5%,3.1,76500,71200",
      { gstr3bAlreadyFiled: false },
    );

    expect(rows[0].correctionPath).toContain("GSTR-1A is available for this period");
  });

  it("recommends a subsequent-period amendment when GSTR-3B is already filed", () => {
    const rows = buildGstr3bPreLockGapCheck(
      "lineRef,table,booksValue,autoPopulatedValue\nB2C outward - 5%,3.1,76500,71200",
      { gstr3bAlreadyFiled: true },
    );

    expect(rows[0].correctionPath).toContain("GSTR-1A is no longer available");
    expect(rows[0].correctionPath).toContain("subsequent period's GSTR-1");
  });

  it("marks rows with missing values as missing-data", () => {
    const rows = buildGstr3bPreLockGapCheck(
      "lineRef,table,booksValue,autoPopulatedValue\nB2B outward - 18%,3.1,,405000",
      { gstr3bAlreadyFiled: false },
    );

    expect(rows[0].status).toBe("missing-data");
  });

  it("marks non-outward-liability tables as unsupported instead of recommending GSTR-1A", () => {
    const rows = buildGstr3bPreLockGapCheck(
      "lineRef,table,booksValue,autoPopulatedValue\nITC row,4,76500,71200",
      { gstr3bAlreadyFiled: false },
    );

    expect(rows[0].status).toBe("unsupported-table");
    expect(rows[0].difference).toBeNull();
    expect(rows[0].correctionPath).toContain("Only GSTR-3B outward liability tables 3.1 and 3.2 are supported");
    expect(rows[0].correctionPath).not.toContain("GSTR-1A");
  });
});
