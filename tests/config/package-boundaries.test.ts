import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const packageRoot = join(root, "packages");
const workspaceImportPattern = /from\s+["'](@complyeaze-tools\/[^"']+)["']|import\s+["'](@complyeaze-tools\/[^"']+)["']/g;

describe("workspace package boundaries", () => {
  it("declares every runtime workspace package import in package.json", () => {
    for (const packageDir of readdirSync(packageRoot)) {
      const packageJsonPath = join(packageRoot, packageDir, "package.json");
      const srcDir = join(packageRoot, packageDir, "src");
      if (!existsSync(packageJsonPath) || !existsSync(srcDir)) continue;

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        name: string;
        dependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      };
      const declared = new Set([
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.peerDependencies ?? {}),
      ]);

      for (const sourceFile of listTypeScriptFiles(srcDir)) {
        const source = readFileSync(sourceFile, "utf8");
        const imports = [...source.matchAll(workspaceImportPattern)]
          .map((match) => match[1] ?? match[2])
          .filter((importName) => importName !== packageJson.name);

        for (const importName of imports) {
          expect(
            declared.has(importName),
            `${relative(root, sourceFile)} imports ${importName} but ${relative(root, packageJsonPath)} does not declare it`,
          ).toBe(true);
        }
      }
    }
  });

  it("keeps tool-specific artifact builders out of the generic output host", () => {
    const hostPath = join(root, "packages/artifacts/src/tool-output.ts");
    const source = readFileSync(hostPath, "utf8");
    const disallowedBuilderNames = [
      "buildGstPortalEvidenceMemo",
      "buildGstr2bReconciliationTriage",
      "buildGstr2bSupplierFollowUps",
      "buildMsmePayableReview",
      "buildTaxStatementMismatchReview",
      "maskIndianIdentifiersWithReport",
    ];

    for (const name of disallowedBuilderNames) {
      expect(
        source.includes(name),
        `${relative(root, hostPath)} should delegate ${name} through the artifact builder registry`,
      ).toBe(false);
    }
  });
});

function listTypeScriptFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return listTypeScriptFiles(path);
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });
}
