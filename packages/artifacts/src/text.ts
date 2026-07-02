export function buildReviewFooter(sourceLabel: string): string {
  return [
    "",
    "---",
    `Draft review output generated locally from ${sourceLabel}.`,
    "Verify against official sources and professional judgment before use.",
  ].join("\n");
}
