import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { BANNED_PUBLIC_CLAIMS } from "../../packages/source-register/src/claims";

const publicRoots = [
  join(process.cwd(), "apps", "site", "src"),
  join(process.cwd(), "apps", "site", "public"),
  join(process.cwd(), "packages", "source-register", "src", "tools.ts"),
];

function listFiles(path: string): string[] {
  const stat = statSync(path, { throwIfNoEntry: false });
  if (!stat) return [];
  if (stat.isFile()) {
    return /\.(astro|css|ts|tsx|js|jsx|mjs|cjs|md|txt|xml|json|svg)$/.test(path)
      ? [path]
      : [];
  }
  return readdirSync(path).flatMap((entry) => {
    if ([".astro", "dist", "node_modules"].includes(entry)) return [];
    return listFiles(join(path, entry));
  });
}

describe("public copy scan", () => {
  it("keeps banned claims out of public source files", () => {
    const offenders = publicRoots.flatMap(listFiles).flatMap((file) => {
      const text = readFileSync(file, "utf8").toLowerCase();
      return BANNED_PUBLIC_CLAIMS.filter((claim) =>
        text.includes(claim.toLowerCase()),
      ).map((claim) => `${file}: ${claim}`);
    });

    expect(offenders).toEqual([]);
  });
});
