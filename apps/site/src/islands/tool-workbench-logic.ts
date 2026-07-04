import type { ToolArtifactDefinition, ToolArtifactResult } from "@complyeaze-tools/artifacts";

export {
  buildOutput,
  buildToolReviewArtifact,
  configs,
  getToolArtifactDefinition,
  isBlockingOutput,
  type BuildOutputOptions,
  type WorkbenchConfig,
  type WorkbenchTool,
} from "@complyeaze-tools/artifacts";

export type ColumnMappingTarget = {
  column: string;
  label: string;
};

export function getColumnMappingTargets(
  definition: ToolArtifactDefinition,
  headers: string[],
  options: { includeOptional?: boolean } = {},
): ColumnMappingTarget[] {
  if (!headers.length) return [];

  const groups =
    definition.requiredColumnGroups ??
    definition.requiredColumns
      ?.filter((column) => /^[a-z][a-zA-Z0-9]*$/.test(column))
      .map((column) => [column]) ??
    [];
  const optionalGroups = options.includeOptional
    ? (definition.optionalMappableColumns ?? []).map((column) => [column])
    : [];

  return [...groups, ...optionalGroups]
    .filter((group) => !group.some((column) => headers.includes(column)))
    .flatMap((group) => group.map((column) => ({ column, label: column })));
}

export function filterWorkbenchColumnMapping(
  mapping: Record<string, string>,
  targets: ColumnMappingTarget[],
  headers: string[],
): Record<string, string> {
  const targetColumns = new Set(targets.map((target) => target.column));
  return Object.fromEntries(
    Object.entries(mapping).filter(
      ([target, source]) => targetColumns.has(target) && headers.includes(source),
    ),
  );
}

export type WorkbenchDiagnostics = {
  title: string;
  summary: string[];
  issues: string[];
};

export function buildWorkbenchDiagnostics(
  result: Pick<ToolArtifactResult, "status" | "rowCounts" | "parseIssues">,
): WorkbenchDiagnostics | null {
  const rowCounts = result.rowCounts;
  const parseIssues = result.parseIssues ?? [];

  if (!rowCounts && !parseIssues.length) return null;

  const parsedRows = rowCounts?.parsedRows ?? 0;
  const acceptedRows = rowCounts?.acceptedRows ?? parsedRows;
  const skippedBlankRows = rowCounts?.skippedBlankRows ?? 0;
  const skippedInvalidRows = rowCounts?.skippedInvalidRows ?? parseIssues.length;
  const summary = [
    rowCounts ? `Rows accepted for draft: ${acceptedRows} of ${parsedRows} parsed.` : null,
    skippedBlankRows > 0 ? `Blank rows skipped: ${skippedBlankRows}.` : null,
    skippedInvalidRows > 0 ? `Rows needing review: ${skippedInvalidRows}.` : null,
  ].filter((line): line is string => Boolean(line));

  const visibleIssues = parseIssues
    .slice(0, 3)
    .map((issue) => `Row ${issue.rowNumber}: ${issue.code} - ${issue.message}`);
  const remainingIssueCount = parseIssues.length - visibleIssues.length;
  if (remainingIssueCount > 0) {
    visibleIssues.push(`${remainingIssueCount} more row diagnostic(s).`);
  }

  return {
    title: "Input diagnostics",
    summary,
    issues: visibleIssues,
  };
}
