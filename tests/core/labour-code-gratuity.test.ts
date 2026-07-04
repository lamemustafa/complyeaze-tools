import { describe, expect, it } from "vitest";
import { buildLabourCodeGratuityReview } from "../../packages/core/src/labour-code-gratuity";

describe("buildLabourCodeGratuityReview", () => {
  it("adds the excess above 50% of total remuneration back into the effective wage base", () => {
    const rows = buildLabourCodeGratuityReview(
      [
        "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService",
        "Sample Employee A,20000,0,0,56000,permanent,7",
      ].join("\n"),
    );

    // wages = 20000, total = 76000, max other = 38000, excess = 56000 - 38000 = 18000
    expect(rows[0].wages).toBe(20000);
    expect(rows[0].totalRemuneration).toBe(76000);
    expect(rows[0].fiftyPercentTestExceeded).toBe(true);
    expect(rows[0].excessAddedBack).toBe(18000);
    expect(rows[0].effectiveWageBase).toBe(38000);
    expect(rows[0].flags.some((flag) => flag.includes("50% test denominator"))).toBe(true);
  });

  it("does not add anything back when other components stay within 50% of total remuneration", () => {
    const rows = buildLabourCodeGratuityReview(
      "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService\nSample Employee C,40000,5000,0,10000,permanent,6",
    );

    expect(rows[0].fiftyPercentTestExceeded).toBe(false);
    expect(rows[0].excessAddedBack).toBe(0);
    expect(rows[0].effectiveWageBase).toBe(rows[0].wages);
  });

  it("marks an ordinary permanent separation under 5 years as not eligible for gratuity", () => {
    const rows = buildLabourCodeGratuityReview(
      "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService,terminationReason\nSample Employee D,30000,0,0,5000,permanent,3,resignation",
    );

    expect(rows[0].eligibleForGratuity).toBe(false);
    expect(rows[0].gratuityOld).toBeNull();
    expect(rows[0].gratuityNew).toBeNull();
  });

  it("marks a fixed-term employee eligible after 1 year and flags the pro-rata caveat", () => {
    const rows = buildLabourCodeGratuityReview(
      "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService\nSample Employee B,35000,5000,0,25000,fixed-term,1.2",
    );

    expect(rows[0].eligibleForGratuity).toBe(true);
    expect(rows[0].gratuityOld).not.toBeNull();
    expect(rows[0].flags.some((flag) => flag.includes("pro-rata"))).toBe(true);
  });

  it("shows a higher new gratuity than old gratuity when the 50% rule adds wages back", () => {
    const rows = buildLabourCodeGratuityReview(
      "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService\nSample Employee A,20000,0,0,56000,permanent,7",
    );

    expect(rows[0].gratuityNew).toBeGreaterThan(rows[0].gratuityOld as number);
    expect(rows[0].gratuityDelta).toBeGreaterThan(0);
  });

  it("caps computed gratuity at Rs 20 lakh and flags the cap as a notified amount", () => {
    const rows = buildLabourCodeGratuityReview(
      "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService\nSample Employee E,500000,0,0,0,permanent,30",
    );

    expect(rows[0].gratuityOld).toBe(2_000_000);
    expect(rows[0].flags.some((flag) => flag.includes("currently-notified"))).toBe(true);
  });

  it("uses only basic and DA as the old gratuity base when retaining allowance is present", () => {
    const rows = buildLabourCodeGratuityReview(
      "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService\nSample Employee F,25000,5000,5000,0,permanent,10",
    );

    expect(rows[0].wages).toBe(35000);
    expect(rows[0].gratuityOld).toBeCloseTo((30000 / 26) * 15 * 10);
    expect(rows[0].gratuityNew).toBeCloseTo((35000 / 26) * 15 * 10);
    expect(rows[0].gratuityDelta).toBeGreaterThan(0);
  });

  it("flags missing employment types instead of assuming permanent", () => {
    const rows = buildLabourCodeGratuityReview(
      "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService\nSample Employee G,25000,5000,0,0,,6",
    );

    expect(rows[0].employmentType).toBeNull();
    expect(rows[0].eligibleForGratuity).toBeNull();
    expect(rows[0].gratuityOld).toBeNull();
    expect(rows[0].flags).toContain(
      "Missing or unsupported employmentType; enter permanent or fixed-term before using gratuity eligibility.",
    );
  });

  it("requires manual review for under-5 permanent rows unless a death or disablement exception is entered", () => {
    const rows = buildLabourCodeGratuityReview(
      [
        "employeeName,basic,da,retainingAllowance,otherComponents,employmentType,yearsOfService,terminationReason",
        "Sample Employee H,30000,0,0,0,permanent,3,",
        "Sample Employee I,30000,0,0,0,permanent,3,death",
        "Sample Employee J,30000,0,0,0,permanent,3,disablement",
      ].join("\n"),
    );

    expect(rows[0].eligibleForGratuity).toBeNull();
    expect(rows[0].flags).toContain(
      "Permanent employee has under 5 years of service; enter terminationReason to check death/disablement exceptions before treating the row as ineligible.",
    );
    expect(rows[1].eligibleForGratuity).toBe(true);
    expect(rows[1].eligibilityBasis).toContain("death");
    expect(rows[2].eligibleForGratuity).toBe(true);
    expect(rows[2].eligibilityBasis).toContain("disablement");
  });
});
