import { describe, expect, it } from "vitest";
import { buildGstr2bSupplierFollowUps } from "../../packages/core/src/gstr2b-follow-up";

describe("buildGstr2bSupplierFollowUps", () => {
  it("groups supplier issues into supplier-wise follow-up drafts", () => {
    const followUps = buildGstr2bSupplierFollowUps(
      [
        "supplier,gstin,invoice,invoiceDate,amount,status",
        "Acme Components,27ABCDE1234F1Z5,INV-102,2026-05-01,125000,missing in 2B",
        "Acme Components,27ABCDE1234F1Z5,INV-103,2026-05-05,42000,value mismatch",
        "Northline Supplies,29ABCDE1234F1Z7,INV-205,2026-06-01,18000,missing in 2B",
      ].join("\n"),
    );

    expect(followUps).toHaveLength(2);
    expect(followUps[0]).toMatchObject({
      supplier: "Acme Components",
      gstin: "27ABCDE1234F1Z5",
      issueCount: 2,
    });
    expect(followUps[0].draft).toContain("INV-102");
    expect(followUps[0].draft).toContain("2026-05-01");
    expect(followUps[0].draft).toContain("value mismatch");
    expect(followUps[0].draft).toContain("before taking an ITC position");
  });
});
