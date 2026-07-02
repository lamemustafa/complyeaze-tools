import { describe, expect, it } from "vitest";
import { TOOLS } from "../../packages/source-register/src/tools";
import { BANNED_PUBLIC_CLAIMS } from "../../packages/source-register/src/claims";

describe("public copy claims", () => {
  it("keeps banned claims out of public metadata", () => {
    const publicText = TOOLS.map((tool) =>
      [
        tool.h1,
        tool.seoTitle,
        tool.metaDescription,
        tool.trustCopy.join(" "),
        tool.unsupportedCases.join(" "),
      ].join(" "),
    ).join("\n");

    for (const claim of BANNED_PUBLIC_CLAIMS) {
      expect(publicText.toLowerCase()).not.toContain(claim.toLowerCase());
    }
  });
});
