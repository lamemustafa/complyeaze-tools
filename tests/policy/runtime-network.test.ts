import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const runtimeRoots = ["apps", "packages"].map((root) => join(process.cwd(), root));
const forbiddenPatterns = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bnavigator\.sendBeacon\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\bserviceWorker\.register\b/,
];

function listRuntimeFiles(dir: string): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];
  return readdirSync(dir).flatMap((entry) => {
    if ([".astro", "dist", "node_modules"].includes(entry)) return [];

    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return listRuntimeFiles(path);
    if (/\.(astro|css|ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) return [path];
    return [];
  });
}

describe("runtime network policy", () => {
  it("does not include runtime data network APIs", () => {
    const offenders = runtimeRoots.flatMap(listRuntimeFiles).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return forbiddenPatterns
        .filter((pattern) => pattern.test(source))
        .map((pattern) => `${file}: ${pattern}`);
    });

    expect(offenders).toEqual([]);
  });
});
