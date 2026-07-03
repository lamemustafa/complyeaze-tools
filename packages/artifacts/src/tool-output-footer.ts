import type { ParsedTable } from "@complyeaze-tools/core";
import { buildReviewFooter, type ArtifactParseIssue } from "./text";
import type {
  ArtifactToolContext,
  PreparedRows,
  ToolArtifactDefinition,
  ToolArtifactResult,
  WorkbenchTool,
} from "./tool-output-types";

const PUBLIC_SITE_ORIGIN = "https://tools.complyeaze.com";
const REPOSITORY_URL = "https://github.com/lamemustafa/complyeaze-tools";
const TOOLKIT_VERSION = "complyeaze-tools@0.0.0";

export function prepareRows(parsed: ParsedTable, requiredColumns: string[]): PreparedRows {
  return prepareRowsForDefinition(parsed, { requiredColumns, sourceLabel: "review rows" });
}

export function prepareRowsForDefinition(
  parsed: ParsedTable,
  definition: ToolArtifactDefinition,
): PreparedRows {
  const requiredValueColumnGroups = getRequiredValueColumnGroups(definition);
  const rowShapeIssueNumbers = new Set(
    parsed.issues
      .filter(
        (issue) =>
          issue.rowNumber > 1 &&
          issue.code !== "duplicate-header" &&
          issue.code !== "missing-cell",
      )
      .map((issue) => issue.rowNumber),
  );
  const invalidRowNumbers = new Set(rowShapeIssueNumbers);
  const diagnostics: ArtifactParseIssue[] = [...parsed.issues];

  for (const record of parsed.rowRecords) {
    for (const columns of requiredValueColumnGroups) {
      if (!columns.some((column) => record.row[column]?.trim())) {
        invalidRowNumbers.add(record.rowNumber);
        diagnostics.push({
          rowNumber: record.rowNumber,
          code: "required-cell-empty",
          column: formatColumnGroup(columns),
          message: `Missing required value for ${formatColumnGroup(columns)}.`,
        });
      }
    }
  }

  return {
    acceptedRows: parsed.rowRecords
      .filter((record) => !invalidRowNumbers.has(record.rowNumber))
      .map((record) => record.row),
    diagnostics,
    invalidRowNumbers,
  };
}

export function buildFooter(
  tool: ArtifactToolContext,
  definition: ToolArtifactDefinition,
  parsed?: ParsedTable,
  prepared?: PreparedRows,
  selectedOptions?: Record<string, string | number | boolean>,
  extraCaveats?: string[],
): string {
  return buildReviewFooter({
    sourceLabel: definition.sourceLabel,
    toolSlug: tool.slug,
    toolTitle: tool.title,
    toolUrl: publicToolUrl(tool.slug),
    toolkitVersion: TOOLKIT_VERSION,
    repositoryUrl: REPOSITORY_URL,
    termsUrl: publicToolUrl("/terms"),
    privacyUrl: publicToolUrl("/privacy"),
    sourceRegisterUrl: publicToolUrl("/source"),
    selectedOptions,
    requiredColumns: definition.requiredColumns,
    detectedDelimiter: parsed?.delimiter,
    inputHeaders: parsed?.originalHeaders,
    rowCounts: parsed
      ? {
          parsedRows: parsed.rows.length,
          acceptedRows: prepared?.acceptedRows.length ?? parsed.rows.length,
          skippedBlankRows: parsed.skippedBlankRows,
          skippedInvalidRows:
            prepared?.invalidRowNumbers.size ??
            new Set(parsed.issues.map((issue) => issue.rowNumber)).size,
        }
      : undefined,
    parseIssues: prepared?.diagnostics ?? parsed?.issues,
    officialSources: tool.officialSources,
    unsupportedCases: tool.unsupportedCases,
    extraCaveats,
  });
}

export function validateRows(
  input: string,
  parsed: ParsedTable,
  requiredColumns: string[],
): ToolArtifactResult | null {
  return validateRowsForDefinition(input, parsed, {
    requiredColumns,
    sourceLabel: "review rows",
  });
}

export function validateRowsForDefinition(
  input: string,
  parsed: ParsedTable,
  definition: ToolArtifactDefinition,
): ToolArtifactResult | null {
  if (!input.trim()) {
    return {
      status: "blocked",
      text: "Paste rows to create a draft output.",
      reason: "empty-input",
    };
  }
  if (!parsed.rows.length) {
    return {
      status: "blocked",
      text: "Paste rows with a header line and at least one data row.",
      reason: "missing-data-rows",
    };
  }

  const duplicateHeaders = parsed.issues
    .filter((issue) => issue.code === "duplicate-header")
    .map((issue) => issue.column)
    .filter((column): column is string => Boolean(column));
  if (duplicateHeaders.length) {
    return {
      status: "blocked",
      text: `Resolve duplicate columns before creating output: ${[...new Set(duplicateHeaders)].join(", ")}.`,
      reason: "duplicate-headers",
    };
  }

  const requiredColumnGroups = getRequiredColumnGroups(definition);
  const missing = requiredColumnGroups
    .filter((columns) => !columns.some((column) => parsed.headers.includes(column)))
    .map(formatColumnGroup);
  if (missing.length) {
    return {
      status: "blocked",
      text: `Paste rows with these columns: ${formatRequiredColumns(definition)}. Missing: ${missing.join(", ")}.`,
      reason: "missing-required-columns",
    };
  }

  return null;
}

function getRequiredColumnGroups(definition: ToolArtifactDefinition): string[][] {
  return (
    definition.requiredColumnGroups ??
    definition.requiredColumns?.map((column) => [column]) ??
    []
  );
}

function getRequiredValueColumnGroups(definition: ToolArtifactDefinition): string[][] {
  return definition.requiredValueColumnGroups ?? getRequiredColumnGroups(definition);
}

function formatRequiredColumns(definition: ToolArtifactDefinition): string {
  return (
    definition.requiredColumns?.join(", ") ??
    getRequiredColumnGroups(definition).map(formatColumnGroup).join(", ")
  );
}

function formatColumnGroup(columns: string[]): string {
  return columns.join(" or ");
}

export function toArtifactToolContext(tool: WorkbenchTool): ArtifactToolContext {
  return {
    slug: tool.slug,
    title: tool.h1,
    officialSources: tool.officialSources,
    unsupportedCases: tool.unsupportedCases,
  };
}

function publicToolUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withSlash = hasFileExtension(normalized)
    ? normalized
    : `${trimTrailingSlashes(normalized)}/`;
  return `${PUBLIC_SITE_ORIGIN}${withSlash}`;
}

function hasFileExtension(path: string): boolean {
  const lastSlashIndex = path.lastIndexOf("/");
  const lastSegment = path.slice(lastSlashIndex + 1);
  const dotIndex = lastSegment.lastIndexOf(".");
  return dotIndex > 0 && dotIndex < lastSegment.length - 1;
}

function trimTrailingSlashes(path: string): string {
  let end = path.length;
  while (end > 1 && path.charCodeAt(end - 1) === 47) end -= 1;
  return path.slice(0, end);
}
