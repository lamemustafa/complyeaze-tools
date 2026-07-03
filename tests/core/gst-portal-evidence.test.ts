import { describe, expect, it } from "vitest";
import { buildGstPortalEvidenceMemo } from "../../packages/core/src/gst-portal-evidence";

describe("buildGstPortalEvidenceMemo", () => {
  it("creates a user-observed portal-attempt memo with timezone and complaint context", () => {
    const memo = buildGstPortalEvidenceMemo(
      [
        "attemptedAt,timezone,action,error,retryCount,complaintReference",
        "2026-07-02 20:10,Asia/Kolkata,Login,OTP page timed out,2,SR-123",
        "2026-07-02 20:24,Asia/Kolkata,Save GSTR-3B,Unable to load template,1,",
      ].join("\n"),
    );

    expect(memo).toContain("Observed scope: user-entered attempts only.");
    expect(memo).toContain("2026-07-02 20:10 Asia/Kolkata - Login");
    expect(memo).toContain("retry count 2");
    expect(memo).toContain("complaint SR-123");
    expect(memo).toContain("does not prove wider portal availability");
  });
});
