import type { ParsedTable } from "@complyeaze-tools/core";
import type {
  ArtifactToolContext,
  BuildOutputOptions,
  PreparedRows,
  ToolArtifactDefinition,
  ToolArtifactResult,
} from "./tool-output-types";

export type ToolArtifactBuilderContext = {
  tool: ArtifactToolContext;
  definition: ToolArtifactDefinition;
  input: string;
  asOfDate: string;
  options: BuildOutputOptions;
  parsed?: ParsedTable;
  prepared?: PreparedRows;
};

export type ToolArtifactBuilder = {
  inputMode: "table" | "text";
  preValidateParsed?: (parsed: ParsedTable) => ToolArtifactResult | null;
  build: (context: ToolArtifactBuilderContext) => ToolArtifactResult;
};

export function requirePreparedTable(
  parsed: ParsedTable | undefined,
  prepared: PreparedRows | undefined,
): { parsed: ParsedTable; prepared: PreparedRows } {
  if (!parsed || !prepared) {
    throw new Error("Table artifact builder requires parsed and prepared rows.");
  }

  return { parsed, prepared };
}
