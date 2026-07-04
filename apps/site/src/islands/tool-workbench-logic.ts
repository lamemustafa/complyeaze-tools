import type { ToolArtifactDefinition } from "@complyeaze-tools/artifacts";

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
