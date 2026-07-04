import { parseDelimitedTable } from "@complyeaze-tools/core";
import { applyColumnMapping, filterColumnMapping } from "./column-mapping";
import { getToolArtifactBuilder } from "./tool-builders";
import { getToolArtifactDefinition } from "./tool-output-config";
import {
  buildFooter,
  prepareRowsForDefinition,
  toArtifactToolContext,
  validateRowsForDefinition,
} from "./tool-output-footer";
import type {
  BuildOutputOptions,
  BuildToolReviewArtifactInput,
  ToolArtifactDefinition,
  ToolArtifactResult,
  WorkbenchConfig,
  WorkbenchTool,
} from "./tool-output-types";

export { configs, getToolArtifactDefinition } from "./tool-output-config";
export type {
  ArtifactToolContext,
  BuildOutputOptions,
  BuildToolReviewArtifactInput,
  ToolArtifactDefinition,
  ToolArtifactResult,
  WorkbenchConfig,
  WorkbenchTool,
} from "./tool-output-types";

export function isBlockingOutput(output: string): boolean {
  return output.startsWith("Paste ") || output.startsWith("Choose ");
}

export function buildToolReviewArtifact({
  tool,
  input,
  asOfDate = "",
  options = {},
}: BuildToolReviewArtifactInput): ToolArtifactResult {
  const definition = getToolArtifactDefinition(tool.slug);
  const builder = getToolArtifactBuilder(tool.slug);

  if (builder?.inputMode === "text") {
    return builder.build({ tool, definition, input, asOfDate, options });
  }

  const parsedInput = parseDelimitedTable(input);
  const columnMapping = filterColumnMapping(
    options.columnMapping ?? {},
    getMappableTargetColumns(definition),
    parsedInput.headers,
  );
  const buildOptions = { ...options, columnMapping };
  const parsed = applyColumnMapping(parsedInput, columnMapping);
  const preValidationError = builder?.preValidateParsed?.(parsed);
  if (preValidationError) return preValidationError;

  const inputError = validateRowsForDefinition(input, parsed, definition);
  if (inputError) return inputError;
  const prepared = prepareRowsForDefinition(parsed, definition);

  if (builder) {
    return builder.build({
      tool,
      definition,
      input,
      asOfDate,
      options: buildOptions,
      parsed,
      prepared,
    });
  }

  return {
    status: "ready",
    text: `${input}${buildFooter(tool, definition, parsed, prepared)}`,
  };
}

export function buildOutput(
  tool: WorkbenchTool,
  input: string,
  config: WorkbenchConfig,
  asOfDate: string,
  options: BuildOutputOptions = {},
): string {
  void config;
  return buildToolReviewArtifact({
    tool: toArtifactToolContext(tool),
    input,
    asOfDate,
    options,
  }).text;
}

function getMappableTargetColumns(definition: ToolArtifactDefinition): string[] {
  const groups =
    definition.requiredColumnGroups ??
    definition.requiredColumns
      ?.filter((column) => /^[a-z][a-zA-Z0-9]*$/.test(column))
      .map((column) => [column]) ??
    [];

  return [...groups.flat(), ...(definition.optionalMappableColumns ?? [])];
}
