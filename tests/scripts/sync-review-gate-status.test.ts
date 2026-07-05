import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "scripts", "sync-review-gate-status.mjs");

describe("review gate status sync", () => {
  it("writes success when only the current-head Codex review is missing", () => {
    const harness = createGhHarness("missing-review");

    runSync(harness, [
      "--repo",
      "lamemustafa/complyeaze-tools",
      "--pr",
      "53",
      "--strict-head-review",
      "--required-review-author",
      "chatgpt-codex-connector",
      "--allow-missing-head-review",
    ]);

    expect(readStatusWrites(harness)).toEqual([
      {
        context: "Review gate",
        description: "Review gate is evaluating review state.",
        sha: "head-sha",
        state: "pending",
      },
      {
        context: "Review gate",
        description: "No active review blockers; Codex review missing.",
        sha: "head-sha",
        state: "success",
      },
    ]);
  });

  it("writes failure when a current-head review requests changes", () => {
    const harness = createGhHarness("requested-changes");

    expect(() =>
      runSync(harness, [
        "--repo",
        "lamemustafa/complyeaze-tools",
        "--pr",
        "53",
        "--strict-head-review",
        "--required-review-author",
        "chatgpt-codex-connector",
        "--allow-missing-head-review",
      ]),
    ).toThrow();

    expect(readStatusWrites(harness).at(-1)).toEqual({
      context: "Review gate",
      description: "Unresolved thread, requested changes, or missing current-head review found.",
      sha: "head-sha",
      state: "failure",
    });
  });
});

function runSync(harness: GhHarness, args: string[]) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    encoding: "utf8",
    env: {
      ...process.env,
      FAKE_GH_LOG: harness.logPath,
      FAKE_GH_MODE: harness.mode,
      PATH: `${harness.binDir}${path.delimiter}${process.env.PATH ?? ""}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function createGhHarness(mode: "missing-review" | "requested-changes") {
  const dir = mkdtempSync(path.join(tmpdir(), "tools-sync-review-gate-"));
  const binDir = path.join(dir, "bin");
  execFileSync("mkdir", ["-p", binDir]);
  const ghPath = path.join(binDir, "gh");
  const logPath = path.join(dir, "status-writes.jsonl");

  writeFileSync(
    ghPath,
    `#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const args = process.argv.slice(2);
const mode = process.env.FAKE_GH_MODE;
const logPath = process.env.FAKE_GH_LOG;

if (args[0] === "pr" && args[1] === "view") {
  process.stdout.write(JSON.stringify({ number: 53, headRefOid: "head-sha", state: "OPEN" }));
  process.exit(0);
}

if (args[0] === "api" && args[1] === "graphql") {
  const reviews =
    mode === "requested-changes"
      ? [{ state: "CHANGES_REQUESTED", submittedAt: "2026-07-05T00:00:00Z", url: "https://example.test/review", author: { login: "chatgpt-codex-connector" }, commit: { oid: "head-sha" } }]
      : [];
  process.stdout.write(JSON.stringify({
    data: {
      repository: {
        pullRequest: {
          headRefOid: "head-sha",
          reviewThreads: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] },
          reviews: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: reviews },
        },
      },
    },
  }));
  process.exit(0);
}

if (args[0] === "api" && args[1] === "repos/lamemustafa/complyeaze-tools/commits/head-sha/statuses") {
  process.stdout.write("[]");
  process.exit(0);
}

if (args[0] === "api" && args.includes("repos/lamemustafa/complyeaze-tools/statuses/head-sha")) {
  const valueFor = (name) => args[args.indexOf(name) + 1];
  appendFileSync(logPath, JSON.stringify({
    sha: "head-sha",
    state: valueFor("-f").replace("state=", ""),
    context: args.find((arg) => arg.startsWith("context=")).slice("context=".length),
    description: args.find((arg) => arg.startsWith("description=")).slice("description=".length),
  }) + "\\n");
  process.stdout.write("{}");
  process.exit(0);
}

console.error("Unexpected gh call: " + args.join(" "));
process.exit(1);
`,
    "utf8",
  );
  chmodSync(ghPath, 0o755);
  writeFileSync(logPath, "", "utf8");

  return { binDir, logPath, mode };
}

function readStatusWrites(harness: GhHarness) {
  return readFileSync(harness.logPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StatusWrite);
}

type GhHarness = ReturnType<typeof createGhHarness>;

type StatusWrite = {
  context: string;
  description: string;
  sha: string;
  state: string;
};
