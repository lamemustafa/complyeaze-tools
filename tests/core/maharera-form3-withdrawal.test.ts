import { describe, expect, it } from "vitest";
import { buildMahareraForm3WithdrawalWorksheet } from "../../packages/core/src/maharera-form3-withdrawal";

describe("buildMahareraForm3WithdrawalWorksheet", () => {
  it("computes the withdrawal ceiling as total estimated cost times the proportion of cost incurred", () => {
    const rows = buildMahareraForm3WithdrawalWorksheet(
      [
        "projectName,totalEstimatedLandCost,totalEstimatedConstructionCost,landCostIncurred,constructionCostIncurred,amountWithdrawnTillDate",
        "Sample Project A,20000000,80000000,8000000,32000000,18000000",
      ].join("\n"),
    );

    // total estimated cost = 100000000, cost incurred = 40000000, proportion = 0.4
    expect(rows[0].totalEstimatedCost).toBe(100_000_000);
    expect(rows[0].costIncurred).toBe(40_000_000);
    expect(rows[0].proportionOfCostIncurred).toBeCloseTo(0.4);
    expect(rows[0].maxWithdrawableCeiling).toBeCloseTo(40_000_000);
    expect(rows[0].netWithdrawable).toBeCloseTo(22_000_000);
  });

  it("caps net withdrawable by the designated account balance when supplied", () => {
    const rows = buildMahareraForm3WithdrawalWorksheet(
      "projectName,totalEstimatedLandCost,totalEstimatedConstructionCost,landCostIncurred,constructionCostIncurred,amountWithdrawnTillDate,designatedAccountBalance\nSample Project A,20000000,80000000,8000000,32000000,18000000,10000000",
    );

    expect(rows[0].netWithdrawable).toBeCloseTo(22_000_000);
    expect(rows[0].netWithdrawableCappedByBalance).toBe(10_000_000);
  });

  it("flags when financing cost is included, since it is not settled in the source", () => {
    const rows = buildMahareraForm3WithdrawalWorksheet(
      "projectName,totalEstimatedLandCost,totalEstimatedConstructionCost,landCostIncurred,constructionCostIncurred,financingCostIncurred,amountWithdrawnTillDate\nSample Project A,20000000,80000000,8000000,32000000,1000000,18000000",
    );

    expect(rows[0].flags.some((flag) => flag.includes("financingCostIncurred"))).toBe(true);
  });

  it("flags a row where amount withdrawn already exceeds the computed ceiling", () => {
    const rows = buildMahareraForm3WithdrawalWorksheet(
      "projectName,totalEstimatedLandCost,totalEstimatedConstructionCost,landCostIncurred,constructionCostIncurred,amountWithdrawnTillDate\nSample Project A,20000000,80000000,8000000,32000000,50000000",
    );

    expect(rows[0].netWithdrawable).toBeLessThan(0);
    expect(rows[0].flags).toContain(
      "Amount already withdrawn exceeds the computed ceiling for this row - review before relying on this figure.",
    );
  });
});
