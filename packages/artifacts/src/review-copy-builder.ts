import { maskIndianIdentifiersWithReport } from "@complyeaze-tools/safety";
import { buildFooter } from "./tool-output-footer";
import type { ToolArtifactBuilderContext } from "./tool-builder-types";
import type { ToolArtifactResult } from "./tool-output-types";

export function buildReviewCopyArtifact({
  tool,
  definition,
  input,
}: ToolArtifactBuilderContext): ToolArtifactResult {
  if (!input.trim()) {
    return {
      status: "blocked",
      text: "Paste plain text to create a review copy.",
      reason: "empty-input",
    };
  }

  const report = maskIndianIdentifiersWithReport(input);
  const foundLines = report.checked
    .filter((entry) => entry.status === "found-and-masked")
    .map((entry) => `- ${entry.key}: ${entry.count}`);
  const notFoundLines = report.checked
    .filter((entry) => entry.status === "checked-not-found")
    .map((entry) => `- ${entry.key}: supported pattern did not match`);

  return {
    status: "ready",
    text: [
      "Review copy draft",
      report.warning,
      "",
      report.text,
      "",
      "Found and masked",
      ...(foundLines.length
        ? foundLines
        : [
            "- No supported patterns matched.",
            "- This is not an all-clear; manually inspect before sharing.",
          ]),
      "",
      "Supported pattern checks with no match",
      ...notFoundLines,
      "",
      "Not checked automatically",
      ...report.notChecked.map((item) => `- ${item}`),
      "",
      "Manual review checklist",
      ...report.manualReviewChecklist.map((item) => `- ${item}`),
      buildFooter(tool, definition),
    ].join("\n"),
  };
}
