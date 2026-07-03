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
  column?: string;
};

export type ArtifactRowCounts = {
  parsedRows?: number;
  acceptedRows?: number;
  skippedBlankRows?: number;
  skippedInvalidRows?: number;
};

export type ReviewFooterOptions = {
  sourceLabel: string;
  toolSlug?: string;
  toolTitle?: string;
  toolUrl?: string;
  generatedAt?: string;
  toolkitVersion?: string;
  artifactSchemaVersion?: string;
  repositoryUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
  sourceRegisterUrl?: string;
  selectedOptions?: Record<string, string | number | boolean | null | undefined>;
  requiredColumns?: string[];
  detectedDelimiter?: string;
  inputHeaders?: string[];
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
      "Draft local review artifact only. Not tax, legal, filing, or portal submission advice.",
      "Do not treat this output as a final compliance position.",
      "Verify against official sources and professional judgment before use.",
    ].join("\n");
  }

  const selectedOptions = formatOptions(input.selectedOptions);
  const sources = input.officialSources ?? [];
  const unsupportedCases = input.unsupportedCases ?? [];
  const extraCaveats = input.extraCaveats ?? [];
  const parseIssues = input.parseIssues ?? [];
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const artifactId = buildLocalArtifactId(input, generatedAt);

  return [
    "",
    "---",
    "Artifact metadata",
    `Generated at: ${generatedAt}`,
    `Local artifact ID: ${artifactId}`,
    input.toolTitle && input.toolSlug
      ? `Tool: ${input.toolTitle} (${input.toolSlug})`
      : null,
    input.toolUrl ? `Tool page: ${input.toolUrl}` : null,
    input.toolkitVersion ? `Tool package: ${input.toolkitVersion}` : null,
    `Artifact schema: ${input.artifactSchemaVersion ?? "review-text-v1"}`,
    `Input basis: ${input.sourceLabel}`,
    selectedOptions ? `Selected options: ${selectedOptions}` : null,
    input.requiredColumns?.length
      ? `Expected columns: ${input.requiredColumns.join(", ")}`
      : null,
    input.detectedDelimiter ? `Detected delimiter: ${formatDelimiter(input.detectedDelimiter)}` : null,
    input.inputHeaders?.length ? `Input headers: ${input.inputHeaders.join(", ")}` : null,
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
    input.sourceRegisterUrl ? `Source register: ${input.sourceRegisterUrl}` : null,
    input.termsUrl ? `Terms and disclaimer: ${input.termsUrl}` : null,
    input.privacyUrl ? `Privacy notes: ${input.privacyUrl}` : null,
    input.repositoryUrl ? `Open-source repository: ${input.repositoryUrl}` : null,
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
    `rows accepted for output: ${rowCounts.acceptedRows ?? rowCounts.parsedRows ?? 0}`,
    `blank rows skipped: ${rowCounts.skippedBlankRows ?? 0}`,
    `invalid rows needing review: ${rowCounts.skippedInvalidRows ?? 0}.`,
  ].join("; ");
}

function formatDelimiter(delimiter: string): string {
  if (delimiter === "\t") return "tab";
  if (delimiter === ",") return "comma";
  if (delimiter === ";") return "semicolon";
  return delimiter;
}

function buildLocalArtifactId(input: ReviewFooterOptions, generatedAt: string): string {
  const stableParts = [
    generatedAt,
    input.toolSlug ?? input.toolTitle ?? "unknown-tool",
    input.sourceLabel,
    input.selectedOptions ? formatOptions(input.selectedOptions) : "",
    input.rowCounts
      ? [
          input.rowCounts.parsedRows ?? 0,
          input.rowCounts.skippedBlankRows ?? 0,
          input.rowCounts.skippedInvalidRows ?? 0,
        ].join("-")
      : "",
  ].join("|");
  return `local-${fnv1a32(stableParts)}`;
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
