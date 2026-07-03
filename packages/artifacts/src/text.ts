export type ArtifactSource = {
  publisher: string;
  title: string;
  url: string;
  lastReviewedAt: string;
};

export type ArtifactParseIssue = {
  rowNumber: number;
  code: string;
  message: string;
};

export type ArtifactRowCounts = {
  parsedRows?: number;
  skippedBlankRows?: number;
  skippedInvalidRows?: number;
};

export type ReviewFooterOptions = {
  sourceLabel: string;
  toolSlug?: string;
  toolTitle?: string;
  generatedAt?: string;
  selectedOptions?: Record<string, string | number | boolean | null | undefined>;
  requiredColumns?: string[];
  rowCounts?: ArtifactRowCounts;
  parseIssues?: ArtifactParseIssue[];
  officialSources?: ArtifactSource[];
  unsupportedCases?: string[];
  extraCaveats?: string[];
};

export function buildReviewFooter(sourceLabel: string): string;
export function buildReviewFooter(options: ReviewFooterOptions): string;
export function buildReviewFooter(input: string | ReviewFooterOptions): string {
  if (typeof input === "string") {
    return [
      "",
      "---",
      `Draft review output generated locally from ${input}.`,
      "Verify against official sources and professional judgment before use.",
    ].join("\n");
  }

  const selectedOptions = formatOptions(input.selectedOptions);
  const sources = input.officialSources ?? [];
  const unsupportedCases = input.unsupportedCases ?? [];
  const extraCaveats = input.extraCaveats ?? [];
  const parseIssues = input.parseIssues ?? [];

  return [
    "",
    "---",
    "Artifact metadata",
    `Generated at: ${input.generatedAt ?? new Date().toISOString()}`,
    input.toolTitle && input.toolSlug
      ? `Tool: ${input.toolTitle} (${input.toolSlug})`
      : null,
    `Input basis: ${input.sourceLabel}`,
    selectedOptions ? `Selected options: ${selectedOptions}` : null,
    input.requiredColumns?.length
      ? `Expected columns: ${input.requiredColumns.join(", ")}`
      : null,
    input.rowCounts ? formatRowCounts(input.rowCounts) : null,
    parseIssues.length ? "Parse diagnostics:" : null,
    ...parseIssues.map(
      (issue) => `- Row ${issue.rowNumber}: ${issue.code} - ${issue.message}`,
    ),
    sources.length ? "Sources to verify:" : null,
    ...sources.map(
      (source) =>
        `- ${source.publisher}: ${source.title} (reviewed ${source.lastReviewedAt}) ${source.url}`,
    ),
    unsupportedCases.length ? "Tool boundary:" : null,
    ...unsupportedCases.map((item) => `- ${item}`),
    extraCaveats.length ? "Additional review caveats:" : null,
    ...extraCaveats.map((item) => `- ${item}`),
    "Browser-local draft: files are processed in your browser. No account or file upload required.",
    "Draft local review artifact only. Not a filing instruction or final tax position.",
    "Verify against official sources and professional judgment before use.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function formatOptions(options: ReviewFooterOptions["selectedOptions"]): string | null {
  if (!options) return null;
  const entries = Object.entries(options).filter(
    (entry): entry is [string, string | number | boolean] =>
      entry[1] !== null && entry[1] !== undefined && entry[1] !== "",
  );
  return entries.length ? entries.map(([key, value]) => `${key}=${value}`).join(", ") : null;
}

function formatRowCounts(rowCounts: ArtifactRowCounts): string {
  return [
    `Rows parsed: ${rowCounts.parsedRows ?? 0}`,
    `blank rows skipped: ${rowCounts.skippedBlankRows ?? 0}`,
    `invalid rows needing review: ${rowCounts.skippedInvalidRows ?? 0}.`,
  ].join("; ");
}
