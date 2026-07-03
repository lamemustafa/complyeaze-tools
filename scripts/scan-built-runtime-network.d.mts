export const forbiddenBuiltRuntimePatterns: Array<{
  label: string;
  pattern: RegExp;
}>;

export function listBuiltRuntimeFiles(distDir?: string): string[];

export function scanBuiltRuntimeNetwork(options?: { distDir?: string }): string[];
