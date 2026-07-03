import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type BuiltRuntimeScanner = {
  forbiddenBuiltRuntimePatterns: Array<{ label: string }>;
  scanBuiltRuntimeNetwork: (options: { distDir: string }) => string[];
};

async function loadScanner() {
  return (await import("../../scripts/scan-built-runtime-network.mjs")) as BuiltRuntimeScanner;
}

describe("built runtime network scanner", () => {
  it("keeps forbidden API coverage aligned with the source scanner", async () => {
    const { forbiddenBuiltRuntimePatterns } = await loadScanner();

    expect(forbiddenBuiltRuntimePatterns.map((pattern) => pattern.label)).toEqual([
      "fetch",
      "XMLHttpRequest",
      "sendBeacon",
      "WebSocket",
      "EventSource",
      "serviceWorker.register",
      "remote dynamic import",
    ]);
  });

  it("passes built files with same-origin static imports only", async () => {
    const { scanBuiltRuntimeNetwork } = await loadScanner();
    const distDir = mkdtempSync(join(tmpdir(), "tools-built-runtime-ok-"));

    try {
      writeFileSync(
        join(distDir, "index.html"),
        [
          "<script type=\"module\" src=\"/_astro/app.js\"></script>",
          "<link rel=\"canonical\" href=\"https://tools.complyeaze.com/\">",
          "<a href=\"https://github.com/lamemustafa/complyeaze-tools\">Source</a>",
          "<img src=\"https://tools.complyeaze.com/social-card.png\" alt=\"ComplyEaze Tools\">",
        ].join("\n"),
      );
      writeFileSync(join(distDir, "app.js"), "const load = () => import('./chunk.js');");
      writeFileSync(join(distDir, "style.css"), "body { background-image: url('/grid.svg'); }");

      expect(scanBuiltRuntimeNetwork({ distDir })).toEqual([]);
    } finally {
      rmSync(distDir, { recursive: true, force: true });
    }
  });

  it("reports forbidden data-network APIs in built output", async () => {
    const { scanBuiltRuntimeNetwork } = await loadScanner();
    const distDir = mkdtempSync(join(tmpdir(), "tools-built-runtime-bad-"));

    try {
      writeFileSync(join(distDir, "app.js"), "navigator.sendBeacon('/collect', 'x');");

      expect(scanBuiltRuntimeNetwork({ distDir })).toEqual([
        expect.stringContaining("sendBeacon"),
      ]);
    } finally {
      rmSync(distDir, { recursive: true, force: true });
    }
  });

  it("reports remote active HTML and CSS resources in built output", async () => {
    const { scanBuiltRuntimeNetwork } = await loadScanner();
    const distDir = mkdtempSync(join(tmpdir(), "tools-built-runtime-remote-"));

    try {
      writeFileSync(
        join(distDir, "index.html"),
        [
          "<script src=\"https://cdn.example.test/app.js\"></script>",
          "<link rel=\"preconnect\" href=\"https://fonts.example.test\">",
          "<link rel=\"stylesheet\" href=\"https://cdn.example.test/app.css\">",
          "<link rel=\"modulepreload\" href=\"https://cdn.example.test/chunk.js\">",
          "<img srcset=\"/local.png 1x, https://img.example.test/remote.png 2x\" alt=\"\">",
          "<a href=\"https://github.com/lamemustafa/complyeaze-tools\">Allowed source link</a>",
        ].join("\n"),
      );
      writeFileSync(
        join(distDir, "style.css"),
        "@import url('https://css.example.test/base.css'); .x { background: url(https://img.example.test/bg.png); }",
      );

      expect(scanBuiltRuntimeNetwork({ distDir })).toEqual(
        expect.arrayContaining([
          expect.stringContaining("remote script src"),
          expect.stringContaining("remote link preconnect"),
          expect.stringContaining("remote link stylesheet"),
          expect.stringContaining("remote link modulepreload"),
          expect.stringContaining("remote srcset"),
          expect.stringContaining("remote css import"),
          expect.stringContaining("remote css url"),
        ]),
      );
      expect(scanBuiltRuntimeNetwork({ distDir })).not.toEqual([
        expect.stringContaining("Allowed source link"),
      ]);
    } finally {
      rmSync(distDir, { recursive: true, force: true });
    }
  });
});
