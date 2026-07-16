import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "scripts", "sync-review-gate-status.mjs");
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("Review gate status sync script", () => {
  it("rejects an empty or non-positive targeted PR number before calling GitHub", () => {
    for (const args of [
      ["--repo", "lamemustafa/complyeaze-tools", "--pr"],
      ["--repo", "lamemustafa/complyeaze-tools", "--pr", "0"],
    ]) {
      const harness = createGhHarness({});
      expect(() => runSync(harness, args)).toThrow(/Pass --pr <number> or --all-open/);
      expect(readState(harness).calls).toEqual([]);
    }
  });

  it("posts the exact context to the current PR head endpoint", () => {
    const harness = createGhHarness({
      prByNumber: { "7": { number: 7, headRefOid: "current-head", state: "OPEN" } },
      reviewGraphs: {
        "7": reviewFixture({
          headRefOid: "current-head",
          reviews: [review({ state: "COMMENTED", commit: "current-head" })],
        }),
      },
    });

    runSync(harness, ["--repo", "lamemustafa/complyeaze-tools", "--pr", "7"]);

    const state = readState(harness);
    expect(state.writes).toHaveLength(2);
    expect(state.writes.map((write) => write.endpoint)).toEqual([
      "repos/lamemustafa/complyeaze-tools/statuses/current-head",
      "repos/lamemustafa/complyeaze-tools/statuses/current-head",
    ]);
    expect(state.writes.at(-1)).toMatchObject({
      sha: "current-head",
      state: "success",
      context: "Review gate",
      description: "No active review blockers found.",
    });
  });

  it("enumerates multiple open-PR pages and repairs each current head without pending writes", () => {
    const harness = createGhHarness({
      openPages: [
        {
          after: null,
          pageInfo: { hasNextPage: true, endCursor: "page-2" },
          nodes: [{ number: 11, headRefOid: "head-11" }],
        },
        {
          after: "page-2",
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [{ number: 12, headRefOid: "head-12" }],
        },
      ],
      reviewGraphs: {
        "11": reviewFixture({
          headRefOid: "head-11",
          reviews: [review({ state: "COMMENTED", commit: "head-11" })],
        }),
        "12": reviewFixture({
          headRefOid: "head-12",
          reviews: [review({ state: "COMMENTED", commit: "head-12" })],
        }),
      },
      statuses: {
        "head-11": [status(101, "failure")],
        "head-12": [status(102, "failure")],
      },
    });

    runSync(harness, [
      "--repo",
      "lamemustafa/complyeaze-tools",
      "--all-open",
    ]);

    const state = readState(harness);
    expect(state.writes).toHaveLength(2);
    expect(state.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sha: "head-11", state: "success", context: "Review gate" }),
        expect.objectContaining({ sha: "head-12", state: "success", context: "Review gate" }),
      ]),
    );
    expect(state.writes.some((write) => write.state === "pending")).toBe(false);
    expect(state.statusReads).toEqual({ "head-11": 2, "head-12": 2 });
    expect(
      state.calls.filter((call) => call.args[0] === "pr" && call.args[1] === "view"),
    ).toHaveLength(2);
    const enumerationCalls = state.calls.filter((call) =>
      call.args.some((argument) => argument.includes("pullRequests(states:OPEN")),
    );
    expect(enumerationCalls).toHaveLength(2);
    expect(enumerationCalls[1].args).toContain("after=page-2");
  });

  it("skips an older daily result when one newer event status appears during evaluation", () => {
    const oldStatus = status(201, "failure");
    const eventStatus = status(202, "success");
    const harness = allOpenHarness({
      statusReadSequences: {
        "race-head": [[oldStatus], [eventStatus, oldStatus]],
      },
    });

    const output = runSync(harness, [
      "--repo",
      "lamemustafa/complyeaze-tools",
      "--all-open",
    ]);

    expect(output).toContain("skipping stale write");
    expect(readState(harness).writes).toEqual([]);
    expect(readState(harness).statusReads).toEqual({ "race-head": 2 });
  });

  it("skips when multiple newer statuses appear or when the baseline had no status", () => {
    for (const sequences of [
      [
        [status(301, "failure")],
        [status(303, "failure"), status(302, "success"), status(301, "failure")],
      ],
      [[], [status(304, "success")]],
    ]) {
      const harness = allOpenHarness({
        statusReadSequences: { "race-head": sequences },
      });
      runSync(harness, [
        "--repo",
        "lamemustafa/complyeaze-tools",
        "--all-open",
      ]);
      expect(readState(harness).writes).toEqual([]);
    }
  });

  it("allows bounded daily repair when only a foreign publisher changed", () => {
    const trusted = status(401, "failure");
    const foreign = status(402, "success", "another-app[bot]");
    const harness = allOpenHarness({
      statusReadSequences: {
        "race-head": [[trusted], [foreign, trusted]],
      },
    });

    runSync(harness, [
      "--repo",
      "lamemustafa/complyeaze-tools",
      "--all-open",
    ]);

    expect(readState(harness).writes).toContainEqual(
      expect.objectContaining({
        endpoint: "repos/lamemustafa/complyeaze-tools/statuses/race-head",
        context: "Review gate",
        state: "success",
      }),
    );
  });

  it("re-evaluates unresolved-thread state on the daily path and repairs it after resolution", () => {
    const blocked = allOpenHarness({
      reviewGraphs: {
        "21": reviewFixture({
          headRefOid: "race-head",
          reviewThreads: [reviewThread(false)],
          reviews: [review({ state: "COMMENTED", commit: "race-head" })],
        }),
      },
      statuses: { "race-head": [status(430, "success")] },
    });
    runSync(blocked, ["--repo", "lamemustafa/complyeaze-tools", "--all-open"]);
    expect(readState(blocked).writes.at(-1)).toMatchObject({ state: "failure" });

    const repaired = allOpenHarness({
      reviewGraphs: {
        "21": reviewFixture({
          headRefOid: "race-head",
          reviewThreads: [reviewThread(true)],
          reviews: [review({ state: "COMMENTED", commit: "race-head" })],
        }),
      },
      statuses: { "race-head": [status(431, "failure")] },
    });
    runSync(repaired, ["--repo", "lamemustafa/complyeaze-tools", "--all-open"]);
    expect(readState(repaired).writes.at(-1)).toMatchObject({ state: "success" });
  });

  it("does not write to a head that stopped being current during the daily run", () => {
    const harness = allOpenHarness({
      prByNumber: {
        "21": { number: 21, headRefOid: "new-head", state: "OPEN" },
      },
      statuses: { "race-head": [status(450, "failure")] },
    });

    const output = runSync(harness, [
      "--repo",
      "lamemustafa/complyeaze-tools",
      "--all-open",
    ]);

    expect(output).toContain("changed head or closed");
    expect(readState(harness).writes).toEqual([]);
    expect(readState(harness).statusReads).toEqual({ "race-head": 1 });
  });

  it("fails a targeted run if evaluation observes a different head", () => {
    const harness = createGhHarness({
      prByNumber: { "9": { number: 9, headRefOid: "read-head", state: "OPEN" } },
      reviewGraphs: {
        "9": reviewFixture({
          headRefOid: "changed-head",
          reviews: [review({ state: "COMMENTED", commit: "changed-head" })],
        }),
      },
    });

    expect(() =>
      runSync(harness, ["--repo", "lamemustafa/complyeaze-tools", "--pr", "9"]),
    ).toThrow(/PR head changed while evaluating/);
    expect(readState(harness).writes.at(-1)).toMatchObject({
      sha: "read-head",
      state: "failure",
      context: "Review gate",
    });
  });
});

type GhHarness = { binDir: string; statePath: string };
type HarnessState = {
  calls: Array<{ args: string[] }>;
  statusReads: Record<string, number>;
  writes: Array<Record<string, string | number | object>>;
};

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

function allOpenHarness(overrides: Record<string, unknown>) {
  return createGhHarness({
    openPages: [
      {
        after: null,
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [{ number: 21, headRefOid: "race-head" }],
      },
    ],
    reviewGraphs: {
      "21": reviewFixture({
        headRefOid: "race-head",
        reviews: [review({ state: "COMMENTED", commit: "race-head" })],
      }),
    },
    ...overrides,
  });
}

function createGhHarness(state: Record<string, unknown>): GhHarness {
  const directory = mkdtempSync(path.join(tmpdir(), "tools-sync-gate-"));
  temporaryDirectories.push(directory);
  const binDir = path.join(directory, "bin");
  const statePath = path.join(directory, "state.json");
  mkdirSync(binDir);
  writeFileSync(
    statePath,
    JSON.stringify({ calls: [], nextStatusId: 10_000, statuses: {}, statusReads: {}, writes: [], ...state }),
    "utf8",
  );
  const ghPath = path.join(binDir, "gh");
  writeFileSync(ghPath, fakeGhSource(), "utf8");
  chmodSync(ghPath, 0o755);
  return { binDir, statePath };
}

function readState(harness: GhHarness) {
  return JSON.parse(readFileSync(harness.statePath, "utf8")) as HarnessState;
}

function status(id: number, state: string, creator = "github-actions[bot]") {
  return {
    id,
    state,
    context: "Review gate",
    description: state === "success" ? "No active review blockers found." : "Earlier failure.",
    target_url: "https://github.com/example/run",
    updated_at: `2026-07-12T00:${String(id % 60).padStart(2, "0")}:00Z`,
    creator: { login: creator },
  };
}

function fakeGhSource() {
  return `#!/usr/bin/env node
const fs = require("node:fs");
const statePath = process.env.GH_FAKE_STATE;
const args = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
state.calls.push({ args });

function save() { fs.writeFileSync(statePath, JSON.stringify(state), "utf8"); }
function flag(name) { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; }
function field(name) {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== "-F") continue;
    const value = args[index + 1] ?? "";
    if (value.startsWith(name + "=")) return value.slice(name.length + 1);
  }
}

if (args[0] === "pr" && args[1] === "view") {
  const number = args[2];
  const enumerated = state.openPages?.flatMap((page) => page.nodes)
    .find((pullRequest) => String(pullRequest.number) === number);
  const pullRequest = state.prByNumber?.[number] ??
    (enumerated ? { ...enumerated, state: "OPEN" } : state.pr);
  save();
  process.stdout.write(JSON.stringify(pullRequest));
  process.exit(0);
}

if (args[0] === "api" && args[1] === "graphql") {
  const query = flag("-f") ?? "";
  if (query.includes("pullRequests(states:OPEN")) {
    const after = field("after") ?? null;
    const page = state.openPages.find((candidate) => candidate.after === after);
    if (!page) { console.error("missing open PR page for " + after); process.exit(2); }
    save();
    process.stdout.write(JSON.stringify({ data: { repository: { pullRequests: {
      pageInfo: page.pageInfo,
      nodes: page.nodes,
    } } } }));
    process.exit(0);
  }
  const number = field("number");
  save();
  process.stdout.write(JSON.stringify(state.reviewGraphs?.[number] ?? state.reviewGraph));
  process.exit(0);
}

if (args[0] === "api" && args[1]?.includes("/commits/")) {
  const sha = args[1].split("/commits/")[1].split("/statuses")[0];
  const readIndex = state.statusReads[sha] ?? 0;
  const sequence = state.statusReadSequences?.[sha];
  const statuses = sequence
    ? sequence[Math.min(readIndex, sequence.length - 1)]
    : (state.statuses[sha] ?? []);
  state.statusReads[sha] = readIndex + 1;
  save();
  process.stdout.write(JSON.stringify(statuses));
  process.exit(0);
}

if (args[0] === "api" && args[1] === "-X" && args[2] === "POST") {
  const endpoint = args[3];
  const sha = endpoint.split("/statuses/")[1];
  const write = { endpoint, sha };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== "-f") continue;
    const value = args[index + 1] ?? "";
    const separator = value.indexOf("=");
    if (separator > 0) write[value.slice(0, separator)] = value.slice(separator + 1);
  }
  const persisted = {
    ...write,
    id: state.nextStatusId++,
    creator: { login: "github-actions[bot]" },
    updated_at: "2026-07-12T12:00:00Z",
  };
  state.writes.push(persisted);
  state.statuses[sha] ??= [];
  state.statuses[sha].unshift(persisted);
  save();
  process.stdout.write(JSON.stringify(persisted));
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
          reviewThreads: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: reviewThreads },
          reviews: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: reviews },
        },
      },
    },
  };
}

function review({ state, commit }: { state: string; commit: string }) {
  return {
    state,
    submittedAt: "2026-07-12T00:00:00Z",
    url: "https://github.com/lamemustafa/complyeaze-tools/pull/1#pullrequestreview-1",
    author: { login: "chatgpt-codex-connector" },
    commit: { oid: commit },
  };
}

function reviewThread(isResolved: boolean) {
  return {
    id: "thread-1",
    isResolved,
    isOutdated: false,
    path: "AGENTS.md",
    line: 1,
    comments: {
      nodes: [
        {
          url: "https://github.com/lamemustafa/complyeaze-tools/pull/21#discussion_r1",
          author: { login: "chatgpt-codex-connector" },
        },
      ],
    },
  };
}
