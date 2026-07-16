import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("supported toolchain versions", () => {
  it("uses Node 24 consistently across manifests, CI, and the image builder", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      packageManager?: string;
      engines?: { node?: string };
      devDependencies?: Record<string, string>;
    };
    const ci = read(".github/workflows/ci.yml");
    const freshness = read(".github/workflows/source-freshness.yml");
    const dockerfile = read("deploy/docker/Dockerfile");

    expect(packageJson.engines?.node).toBe(">=24.0.0");
    expect(packageJson.packageManager).toBe("pnpm@11.13.1");
    expect(packageJson.devDependencies?.["@types/node"]).toMatch(/^\^24\./);
    expect(ci).toContain("node-version: 24");
    expect(ci).toContain("version: 11.13.1");
    expect(freshness.match(/node-version: 24/g)).toHaveLength(2);
    expect(freshness.match(/version: 11.13.1/g)).toHaveLength(2);
    expect(dockerfile).toContain("FROM node:24-alpine@sha256:");
    expect(dockerfile).not.toContain("FROM node:22-");
  });
});
