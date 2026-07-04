import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const scannedRoots = [
  join(process.cwd(), "tests", "fixtures"),
  join(process.cwd(), "apps", "site", "src"),
  join(process.cwd(), "packages", "source-register", "src"),
  join(process.cwd(), "packages", "artifacts", "src", "tool-output-config.ts"),
];
const sensitivePatterns = [
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/, // PAN-like
  /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/, // GSTIN-like
  /\b[0-9]{12}\b/, // Aadhaar/bank-like long identifier
];

function files(dir: string): string[] {
  const stat = statSync(dir, { throwIfNoEntry: false });
  if (!stat) return [];
  if (stat.isFile()) return [dir];
  if (!stat.isDirectory()) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const childStat = statSync(path);
    return childStat.isDirectory() ? files(path) : [path];
  });
}

describe("synthetic fixtures", () => {
  it("does not commit real-looking sensitive identifiers in fixtures or public samples", () => {
    const offenders = scannedRoots.flatMap(files).flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return sensitivePatterns
        .filter((pattern) => pattern.test(content))
        .map((pattern) => `${file}: ${pattern}`);
    });

    expect(offenders).toEqual([]);
  });
});
