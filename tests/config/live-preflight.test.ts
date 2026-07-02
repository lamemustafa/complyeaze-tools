import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const scriptPath = join(process.cwd(), "scripts", "live-preflight.mjs");

describe("live preflight command", () => {
  it("is exposed as a package script", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    expect(packageJson.scripts["preflight:live"]).toBe("node scripts/live-preflight.mjs");
    expect(existsSync(scriptPath)).toBe(true);
  });

  it("checks required live-cutover surfaces without mutation", async () => {
    expect(existsSync(scriptPath)).toBe(true);

    const { LIVE_PREFLIGHT_CHECKS } = (await import(scriptPath)) as {
      LIVE_PREFLIGHT_CHECKS: Array<{ id: string; command: string[]; mutates: boolean }>;
    };
    const ids = LIVE_PREFLIGHT_CHECKS.map((check) => check.id);

    expect(ids).toEqual([
      "github-auth",
      "github-repo",
      "docker-daemon",
      "dns-record",
      "clusterissuer",
      "kustomize-production",
      "namespace",
    ]);
    expect(LIVE_PREFLIGHT_CHECKS.every((check) => check.mutates === false)).toBe(true);
    expect(LIVE_PREFLIGHT_CHECKS.map((check) => check.command.join(" "))).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\bapply\b/),
        expect.stringMatching(/\bcreate\b/),
        expect.stringMatching(/\bpush\b/),
        expect.stringMatching(/\bdelete\b/),
      ]),
    );
  });
});
