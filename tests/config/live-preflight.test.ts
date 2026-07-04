import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const scriptPath = join(process.cwd(), "scripts", "live-preflight.mjs");
const candidateSmokePath = join(process.cwd(), "scripts", "candidate-image-smoke.mjs");

describe("live preflight command", () => {
  it("is exposed as a package script", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    expect(packageJson.scripts["preflight:live"]).toBe("node scripts/live-preflight.mjs");
    expect(existsSync(scriptPath)).toBe(true);
    expect(existsSync(candidateSmokePath)).toBe(true);
  });

  it("checks required live-cutover surfaces without mutation", async () => {
    expect(existsSync(scriptPath)).toBe(true);

    const { buildLivePreflightChecks } = (await import(scriptPath)) as {
      buildLivePreflightChecks: (options: { imageDigest: string }) => Array<{
        id: string;
        command: string[];
        mutates: boolean;
        expectedOutput?: string;
        expectedOutputIgnoreCase?: boolean;
        forbiddenOutput?: string[];
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
      "candidate-image-smoke",
      "dns-record",
      "clusterissuer",
      "kustomize-production",
      "namespace",
      "live-no-slash-redirect",
      "live-tool-csp-hydration-compatible",
      "live-manifest-content-type",
      "live-hashed-assets-immutable",
      "live-privacy-cloudflare-disclosure",
      "live-security-no-email-obfuscation",
      "live-homepage-public-links",
      "live-tool-public-links",
      "live-sitemap-public-links",
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
    expect(
      LIVE_PREFLIGHT_CHECKS.find((check) => check.id === "candidate-image-smoke")?.command.join(" "),
    ).toContain(
      "scripts/candidate-image-smoke.mjs --image ghcr.io/lamemustafa/complyeaze-tools@sha256:2a100524ebf35cf3fa5e6c2e5ccd40e144f0e3c9eda04432be652a748ebc1a2e",
    );
    for (const id of [
      "live-no-slash-redirect",
      "live-homepage-public-links",
      "live-tool-public-links",
      "live-sitemap-public-links",
    ]) {
      const check = LIVE_PREFLIGHT_CHECKS.find((candidate) => candidate.id === id);

      expect(check?.command[0]).toBe("curl");
      expect(check?.command).toContain("--max-time");
      expect(check?.forbiddenOutput).toEqual([":8080"]);
    }
    expect(
      LIVE_PREFLIGHT_CHECKS.find((check) => check.id === "live-tool-csp-hydration-compatible")
        ?.expectedOutput,
    ).toBe("script-src 'self' 'unsafe-inline'");
    expect(
      LIVE_PREFLIGHT_CHECKS.find((check) => check.id === "live-manifest-content-type")
        ?.expectedOutput,
    ).toBe("content-type: application/manifest+json");
    expect(
      LIVE_PREFLIGHT_CHECKS.find((check) => check.id === "live-manifest-content-type")
        ?.expectedOutputIgnoreCase,
    ).toBe(true);
    expect(
      LIVE_PREFLIGHT_CHECKS.find((check) => check.id === "live-hashed-assets-immutable")
        ?.expectedOutput,
    ).toBe("immutable");
    expect(
      LIVE_PREFLIGHT_CHECKS.find((check) => check.id === "live-privacy-cloudflare-disclosure")
        ?.expectedOutput,
    ).toBe("Cloudflare security checks");
    expect(
      LIVE_PREFLIGHT_CHECKS.find((check) => check.id === "live-security-no-email-obfuscation")
        ?.forbiddenOutput,
    ).toEqual(["email-decode.min.js"]);
  });

  it("fails a check when forbidden output is present", async () => {
    const { runCheck } = (await import(scriptPath)) as {
      runCheck: (check: {
        id: string;
        label: string;
        command: string[];
        mutates: boolean;
        forbiddenOutput?: string[];
      }) => { ok: boolean; output: string };
    };

    const result = runCheck({
      id: "bad-public-link",
      label: "Bad public link",
      command: [
        process.execPath,
        "-e",
        "process.stdout.write('https://tools.complyeaze.com:8080/msme-45-day-payment-due-date-calculator')",
      ],
      mutates: false,
      forbiddenOutput: [":8080"],
    });

    expect(result.ok).toBe(false);
    expect(result.output).toContain(":8080");
  });

  it("can match expected command output case-insensitively", async () => {
    const { runCheck } = (await import(scriptPath)) as {
      runCheck: (check: {
        id: string;
        label: string;
        command: string[];
        mutates: boolean;
        expectedOutput?: string;
        expectedOutputIgnoreCase?: boolean;
      }) => { ok: boolean; output: string };
    };

    const result = runCheck({
      id: "header-case",
      label: "Header case",
      command: [
        process.execPath,
        "-e",
        "process.stdout.write('Content-Type: application/manifest+json')",
      ],
      mutates: false,
      expectedOutput: "content-type: application/manifest+json",
      expectedOutputIgnoreCase: true,
    });

    expect(result.ok).toBe(true);
  });

  it("truncates long command output in rendered summaries", async () => {
    const { renderResult } = (await import(scriptPath)) as {
      renderResult: (result: {
        id: string;
        label: string;
        command: string;
        ok: boolean;
        output: string;
      }) => string;
    };

    const rendered = renderResult({
      id: "long-output",
      label: "Long output",
      command: "curl -fsSL https://tools.complyeaze.com/",
      ok: true,
      output: "x".repeat(1_200),
    });

    expect(rendered.length).toBeLessThan(900);
    expect(rendered).toContain("...");
  });
});
