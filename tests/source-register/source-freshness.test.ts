import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const script = "scripts/source-freshness.mjs";

describe("source freshness command", () => {
  it("reports current source freshness without marking launch sources stale", () => {
    const output = execFileSync(process.execPath, [script, "--as-of", "2026-07-03"], {
      encoding: "utf8",
    });

    expect(output).toContain("Stale sources: 0");
    expect(output).toContain("MSME Samadhaan delayed payment monitoring system");
    expect(output).toContain("Annual Information Statement FAQ");
  });

  it("fails once source review windows are stale", () => {
    expect(() =>
      execFileSync(
        process.execPath,
        [script, "--as-of", "2026-08-20", "--fail-on-stale"],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      ),
    ).toThrow(/source\(s\) are stale/);
  });
});
