import { parseDelimitedTable } from "@complyeaze-tools/core";
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

  const parsed = parseDelimitedTable(input);
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
      options,
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
