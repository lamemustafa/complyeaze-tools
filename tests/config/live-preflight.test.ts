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

    const { buildLivePreflightChecks } = (await import(scriptPath)) as {
      buildLivePreflightChecks: (options: { imageDigest: string }) => Array<{
        id: string;
        command: string[];
        mutates: boolean;
        expectedOutput?: string;
      }>;
    };
    const LIVE_PREFLIGHT_CHECKS = buildLivePreflightChecks({
      imageDigest: "sha256:2a100524ebf35cf3fa5e6c2e5ccd40e144f0e3c9eda04432be652a748ebc1a2e",
    });
    const ids = LIVE_PREFLIGHT_CHECKS.map((check) => check.id);

    expect(ids).toEqual([
      "github-auth",
      "github-repo",
      "github-deploy-secret",
      "published-image",
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
    expect(
      LIVE_PREFLIGHT_CHECKS.find((check) => check.id === "github-deploy-secret")?.expectedOutput,
    ).toBe("TOOLS_PROD_KUBECONFIG_B64");
    expect(
      LIVE_PREFLIGHT_CHECKS.find((check) => check.id === "published-image")?.command.join(" "),
    ).toContain(
      "ghcr.io/lamemustafa/complyeaze-tools@sha256:2a100524ebf35cf3fa5e6c2e5ccd40e144f0e3c9eda04432be652a748ebc1a2e",
    );
  });
});
