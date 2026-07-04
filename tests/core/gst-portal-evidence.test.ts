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

  it("adds evidence reference, browser context, and next-action checks without outage conclusions", () => {
    const memo = buildGstPortalEvidenceMemo(
      [
        "attemptedAt,timezone,action,error,retryCount,complaintReference,screenshotHash,browser,device,networkContext",
        "2026-07-02 20:10,Asia/Kolkata,File GSTR-3B,Submit button failed,3,SR-123,sha256:abc123,Brave 1.68,macOS desktop,office broadband",
      ].join("\n"),
    );

    expect(memo).toContain("Browser/context: Brave 1.68; macOS desktop; office broadband");
    expect(memo).toContain("Screenshot/evidence reference: sha256:abc123");
    expect(memo).toContain(
      "Evidence checks: screenshot hashes and complaint references are user-entered references only.",
    );
    expect(memo).toContain("Next review actions:");
    expect(memo).toContain("Keep original screenshots or tickets outside this text tool.");
    expect(memo).toContain("Confirm the hash was generated from the retained file.");
    expect(memo.toLowerCase()).not.toContain("portal outage proven");
    expect(memo.toLowerCase()).not.toContain("extension granted");
    expect(memo.toLowerCase()).not.toContain("complaint-ready");
    expect(memo.toLowerCase()).not.toContain("condonation approved");
  });
});
