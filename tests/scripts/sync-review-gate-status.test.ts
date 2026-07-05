import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "scripts", "sync-review-gate-status.mjs");

describe("Review gate status sync script", () => {
  it("writes success for an open PR with no blocking review state", () => {
    const harness = createGhHarness({
      pr: { number: 7, headRefOid: "head-sha" },
      reviewGraph: reviewFixture({
        reviews: [review({ state: "COMMENTED", commit: "head-sha" })],
      }),
    });

    runSync(harness, ["--repo", "lamemustafa/complyeaze-tools", "--pr", "7"]);

    expect(readState(harness).writes).toContainEqual(
      expect.objectContaining({
        sha: "head-sha",
        state: "success",
        context: "Review gate",
        description: "No active review blockers found.",
      }),
    );
  });

  it("records missing Codex review as a successful audited state when allowed", () => {
    const harness = createGhHarness({
      pr: { number: 8, headRefOid: "head-sha" },
      reviewGraph: reviewFixture({ reviews: [] }),
    });

    const output = runSync(harness, [
      "--repo",
      "lamemustafa/complyeaze-tools",
      "--pr",
      "8",
      "--strict-head-review",
      "--required-review-author",
      "chatgpt-codex-connector",
      "--allow-missing-head-review",
    ]);

    expect(output).toContain("review-gate:allowed-missing-head-review");
    expect(readState(harness).writes).toContainEqual(
      expect.objectContaining({
        state: "success",
        description: "No active review blockers; Codex review missing.",
      }),
    );
  });

  it("passes the expected head SHA to prevent stale status writes", () => {
    const harness = createGhHarness({
      pr: { number: 9, headRefOid: "read-sha" },
      reviewGraph: reviewFixture({
        headRefOid: "changed-sha",
        reviews: [review({ state: "COMMENTED", commit: "changed-sha" })],
      }),
    });

    expect(() =>
      runSync(harness, ["--repo", "lamemustafa/complyeaze-tools", "--pr", "9"]),
    ).toThrow(/PR head changed while evaluating/);
    expect(readState(harness).writes).toContainEqual(
      expect.objectContaining({
        sha: "read-sha",
        state: "failure",
      }),
    );
  });
});

function runSync(harness: GhHarness, args: string[]) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    encoding: "utf8",
    env: {
      ...process.env,
      GH_FAKE_STATE: harness.statePath,
      PATH: `${harness.binDir}${path.delimiter}${process.env.PATH ?? ""}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

type GhHarness = {
  binDir: string;
  statePath: string;
};

function createGhHarness(state: Record<string, unknown>): GhHarness {
  const dir = mkdtempSync(path.join(tmpdir(), "tools-sync-gate-"));
  const binDir = path.join(dir, "bin");
  const statePath = path.join(dir, "state.json");
  const ghPath = path.join(binDir, "gh");
  mkdirSync(binDir);
  writeFileSync(
    statePath,
    JSON.stringify({ statuses: {}, writes: [], ...state }),
    "utf8",
  );
  writeFileSync(ghPath, fakeGhSource(), "utf8");
  chmodSync(ghPath, 0o755);
  return { binDir, statePath };
}

function readState(harness: GhHarness) {
  return JSON.parse(readFileSync(harness.statePath, "utf8")) as {
    writes: Array<Record<string, unknown>>;
  };
}

function fakeGhSource() {
  return `#!/usr/bin/env node
const fs = require("node:fs");
const statePath = process.env.GH_FAKE_STATE;
const args = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));

function save() {
  fs.writeFileSync(statePath, JSON.stringify(state), "utf8");
}

function readFlag(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (args[0] === "pr" && args[1] === "view") {
  process.stdout.write(JSON.stringify(state.pr));
  process.exit(0);
}

if (args[0] === "api" && args[1] === "graphql") {
  const query = readFlag("-f") ?? "";
  if (query.includes("pullRequests(states:OPEN")) {
    process.stdout.write(JSON.stringify({
      data: {
        repository: {
          pullRequests: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: state.openPullRequests ?? [state.pr],
          },
        },
      },
    }));
    process.exit(0);
  }
  process.stdout.write(JSON.stringify(state.reviewGraph));
  process.exit(0);
}

if (args[0] === "api" && args[1] && args[1].includes("/commits/")) {
  const sha = args[1].split("/commits/")[1].split("/statuses")[0];
  process.stdout.write(JSON.stringify(state.statuses?.[sha] ?? []));
  process.exit(0);
}

if (args[0] === "api" && args[1] === "-X" && args[2] === "POST") {
  const sha = args[3].split("/statuses/")[1];
  const write = { sha };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== "-f") continue;
    const value = args[index + 1];
    if (!value || !value.includes("=")) continue;
    const [key, ...rest] = value.split("=");
    write[key] = rest.join("=");
  }
  state.writes.push(write);
  state.statuses ??= {};
  state.statuses[sha] ??= [];
  state.statuses[sha].unshift(write);
  save();
  process.stdout.write(JSON.stringify(write));
  process.exit(0);
}

console.error("unexpected gh args: " + JSON.stringify(args));
process.exit(2);
`;
}

function reviewFixture({
  headRefOid = "head-sha",
  reviewThreads = [],
  reviews = [],
}: {
  headRefOid?: string;
  reviewThreads?: unknown[];
  reviews?: unknown[];
}) {
  return {
    data: {
      repository: {
        pullRequest: {
          headRefOid,
          reviewThreads: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: reviewThreads,
          },
          reviews: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: reviews,
          },
        },
      },
    },
  };
}

function review({
  state,
  commit,
  author = "chatgpt-codex-connector",
  submittedAt = "2026-07-05T12:00:00Z",
}: {
  state: string;
  commit?: string;
  author?: string;
  submittedAt?: string;
}) {
  return {
    state,
    submittedAt,
    url: "https://github.com/lamemustafa/complyeaze-tools/pull/1#pullrequestreview-1",
    author: { login: author },
    commit: commit ? { oid: commit } : null,
  };
}
