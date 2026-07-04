import type { CsvRow } from "@complyeaze-tools/core";
import type { ArtifactParseIssue, ArtifactRowCounts, ArtifactSource } from "./text";

export type ArtifactToolContext = {
  slug: string;
  title: string;
  officialSources: ArtifactSource[];
  unsupportedCases: string[];
};

export type WorkbenchTool = {
  slug: string;
  h1: string;
  officialSources: ArtifactSource[];
  unsupportedCases: string[];
};

export type WorkbenchConfig = {
  inputLabel: string;
  outputLabel: string;
  guidance: string;
  sample: string;
};

export type ToolArtifactDefinition = {
  requiredColumns?: string[];
  requiredColumnGroups?: string[][];
  requiredValueColumnGroups?: string[][];
  optionalMappableColumns?: string[];
  sourceLabel: string;
};

export type BuildOutputOptions = {
  strictGstrMatch?: boolean;
  gstrTolerance?: number;
  gstr3bAlreadyFiled?: boolean;
  columnMapping?: Record<string, string>;
};

export type BuildToolReviewArtifactInput = {
  tool: ArtifactToolContext;
  input: string;
  asOfDate?: string;
  options?: BuildOutputOptions;
};

export type ToolArtifactDiagnostics = {
  rowCounts?: ArtifactRowCounts;
  parseIssues?: ArtifactParseIssue[];
};

export type ToolArtifactResult =
  | ({ status: "ready"; text: string } & ToolArtifactDiagnostics)
  | ({ status: "blocked"; text: string; reason: string } & ToolArtifactDiagnostics);

export type PreparedRows = {
  acceptedRows: CsvRow[];
  diagnostics: ArtifactParseIssue[];
  invalidRowNumbers: Set<number>;
};
