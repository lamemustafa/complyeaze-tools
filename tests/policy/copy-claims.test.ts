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

  it("blocks MSME-specific overclaims in public metadata", () => {
    const publicText = TOOLS.map((tool) =>
      [
        tool.h1,
        tool.seoTitle,
        tool.metaDescription,
        tool.outputArtifacts.join(" "),
        tool.seoDepth.inputGuide.join(" "),
        tool.seoDepth.exampleWorkflow.join(" "),
        tool.seoDepth.faqItems.map((item) => `${item.question} ${item.answer}`).join(" "),
      ].join(" "),
    )
      .join("\n")
      .toLowerCase();

    for (const claim of [
      "msefc-ready",
      "statutory interest calculated",
      "udyam verified",
      "verified udyam",
      "43b(h) compliant",
      "eligible to file",
      "admissible claim",
      "legal default",
      "recoverable amount",
    ]) {
      expect(publicText).not.toContain(claim);
    }
  });
});
