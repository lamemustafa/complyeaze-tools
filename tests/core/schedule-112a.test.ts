import { describe, expect, it } from "vitest";
import { buildSchedule112ARows } from "../../packages/core/src/schedule-112a";

describe("buildSchedule112ARows", () => {
  it("classifies a sale before 23 July 2024 as BE and applies grandfathering when FMV is given", () => {
    const rows = buildSchedule112ARows(
      [
        "scripName,isin,quantity,salePricePerUnit,saleDate,costOfAcquisitionActual,fmv31Jan2018PerUnit",
        "Sample Fund Units,INSYNTH00002,500,58,2024-06-01,20000,50",
      ].join("\n"),
    );

    expect(rows[0].transferPeriod).toBe("BE");
    expect(rows[0].fullValueOfConsideration).toBe(29000);
    expect(rows[0].totalFmv31Jan2018).toBe(25000);
    expect(rows[0].lowerOfFmvAndConsideration).toBe(25000);
    expect(rows[0].costOfAcquisitionFinal).toBe(25000);
    expect(rows[0].grandfatheringApplied).toBe(true);
    expect(rows[0].isinLooksValid).toBe(true);
  });

  it("classifies a sale on or after 23 July 2024 as AE", () => {
    const rows = buildSchedule112ARows(
      "scripName,isin,quantity,salePricePerUnit,saleDate,costOfAcquisitionActual\nSample Equity Ltd,INSYNTH00001,100,420,2024-07-23,25000",
    );

    expect(rows[0].transferPeriod).toBe("AE");
  });

  it("skips grandfathering and flags the row when no FMV is supplied", () => {
    const rows = buildSchedule112ARows(
      "scripName,isin,quantity,salePricePerUnit,saleDate,costOfAcquisitionActual\nSample Equity Ltd,INSYNTH00001,100,420,2026-05-10,25000",
    );

    expect(rows[0].grandfatheringApplied).toBe(false);
    expect(rows[0].costOfAcquisitionFinal).toBe(25000);
    expect(rows[0].flags).toContain(
      "No 31-Jan-2018 FMV supplied: grandfathering under Section 55(2)(ac) was not applied, so cost of acquisition uses actual cost only.",
    );
  });

  it("flags an ISIN that does not look like a 12-character alphanumeric code", () => {
    const rows = buildSchedule112ARows(
      "scripName,isin,quantity,salePricePerUnit,saleDate,costOfAcquisitionActual\nSample Equity Ltd,BADISIN,100,420,2026-05-10,25000",
    );

    expect(rows[0].isinLooksValid).toBe(false);
    expect(rows[0].flags).toContain("ISIN does not look like a 12-character alphanumeric ISIN.");
  });

  it("accepts the government sentinel ISIN values as valid", () => {
    const rows = buildSchedule112ARows(
      "scripName,isin,quantity,salePricePerUnit,saleDate,costOfAcquisitionActual\nConsolidated row,INNOTAVAILAB,100,420,2026-05-10,25000",
    );

    expect(rows[0].isinLooksValid).toBe(true);
  });
});
