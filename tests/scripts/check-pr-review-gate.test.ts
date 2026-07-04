import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "scripts", "check-pr-review-gate.mjs");

describe("PR review gate script", () => {
  it("fails when current review threads are unresolved", () => {
    const fixturePath = writeFixture(
      "unresolved-thread",
      reviewFixture({
        reviewThreads: [
          {
            id: "thread-1",
            isResolved: false,
            isOutdated: false,
            path: "apps/site/src/pages/index.astro",
            line: 14,
            comments: {
              nodes: [
                {
                  url: "https://github.com/lamemustafa/complyeaze-tools/pull/1#discussion_r1",
                  author: { login: "chatgpt-codex-connector" },
                },
              ],
            },
          },
        ],
        reviews: [review({ state: "COMMENTED", commit: "head-sha" })],
      }),
    );

    expectGateFailure(
      [
        scriptPath,
        "--repo",
        "lamemustafa/complyeaze-tools",
        "--pr",
        "1",
        "--fixture",
        fixturePath,
        "--strict-head-review",
        "--required-review-author",
        "chatgpt-codex-connector",
      ],
      /Unresolved review threads/,
    );
  });

  it("fails when a current-head review requests changes", () => {
    const fixturePath = writeFixture(
      "requested-changes",
      reviewFixture({
        reviews: [review({ state: "CHANGES_REQUESTED", commit: "head-sha" })],
      }),
    );

    expectGateFailure(
      [
        scriptPath,
        "--repo",
        "lamemustafa/complyeaze-tools",
        "--pr",
        "1",
        "--fixture",
        fixturePath,
        "--strict-head-review",
        "--required-review-author",
        "chatgpt-codex-connector",
      ],
      /Requested-changes reviews/,
    );
  });

  it("does not block on missing bot review when allow-missing-head-review is set", () => {
    const fixturePath = writeFixture(
      "missing-allowed",
      reviewFixture({
        reviews: [],
      }),
    );

    const output = runGate([
        scriptPath,
        "--repo",
        "lamemustafa/complyeaze-tools",
        "--pr",
        "1",
        "--fixture",
        fixturePath,
        "--strict-head-review",
        "--required-review-author",
        "chatgpt-codex-connector",
        "--allow-missing-head-review",
      ]);

    expect(output).toContain("PR review gate passed");
  });

  it("blocks on missing bot review in strict mode without allow-missing-head-review", () => {
    const fixturePath = writeFixture(
      "missing-blocked",
      reviewFixture({
        reviews: [],
      }),
    );

    expectGateFailure(
      [
        scriptPath,
        "--repo",
        "lamemustafa/complyeaze-tools",
        "--pr",
        "1",
        "--fixture",
        fixturePath,
        "--strict-head-review",
        "--required-review-author",
        "chatgpt-codex-connector",
      ],
      /No review was found for current head/,
    );
  });

  it("keeps older requested-changes reviews blocking until approved or dismissed", () => {
    const fixturePath = writeFixture(
      "outdated-and-stale",
      reviewFixture({
        reviewThreads: [
          {
            id: "thread-1",
            isResolved: false,
            isOutdated: true,
            path: "apps/site/src/pages/index.astro",
            line: 14,
            comments: { nodes: [] },
          },
        ],
        reviews: [
          review({ state: "CHANGES_REQUESTED", commit: "old-sha" }),
          review({ state: "COMMENTED", commit: "head-sha" }),
        ],
      }),
    );

    expect(() =>
      runGate([
        scriptPath,
        "--repo",
        "lamemustafa/complyeaze-tools",
        "--pr",
        "1",
        "--fixture",
        fixturePath,
        "--strict-head-review",
        "--required-review-author",
        "chatgpt-codex-connector",
      ]),
    ).toThrow(/Requested-changes reviews/);
  });
});

function runGate(args: string[]) {
  return execFileSync(process.execPath, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function expectGateFailure(args: string[], pattern: RegExp) {
  try {
    runGate(args);
    throw new Error("Expected review gate to fail.");
  } catch (error) {
    const failure = error as { message?: string; stderr?: Buffer | string; stdout?: Buffer | string };
    const output = `${failure.stdout ?? ""}${failure.stderr ?? ""}${failure.message ?? ""}`;
    expect(output).toMatch(pattern);
  }
}

function writeFixture(name: string, fixture: unknown) {
  const fixtureDir = mkdtempSync(path.join(tmpdir(), "tools-review-gate-"));
  const fixturePath = path.join(fixtureDir, `${name}.json`);
  writeFileSync(fixturePath, JSON.stringify(fixture), "utf8");
  return fixturePath;
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
  submittedAt = "2026-07-03T12:00:00Z",
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
