#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const repo = readArgValue("--repo") ?? process.env.GITHUB_REPOSITORY;
const explicitPr = readArgValue("--pr");
const allOpen = args.has("--all-open");
const runUrl = readArgValue("--run-url");
const waitHeadReviewMs = readNonNegativeIntegerArg("--wait-head-review-ms", 0);
const pollIntervalMs = readNonNegativeIntegerArg("--poll-interval-ms", 10_000);
const strictHeadReview = args.has("--strict-head-review");
const allowMissingHeadReview = args.has("--allow-missing-head-review");
const skipPendingStatus = args.has("--skip-pending-status");
const requiredReviewAuthor = readArgValue("--required-review-author");
const ALLOWED_MISSING_HEAD_REVIEW_MARKER =
  "review-gate:allowed-missing-head-review";

if (!repo || !repo.includes("/")) fail("Pass --repo owner/name.");
if (!allOpen && (!explicitPr || !Number.isInteger(Number(explicitPr)))) {
  fail("Pass --pr <number> or --all-open.");
}

const targets = allOpen ? listOpenPullRequests() : [readPullRequest(Number(explicitPr))];
let targetedFailure = false;

for (const target of targets) {
  if (target.state && target.state !== "OPEN") {
    console.log(`Skipping PR #${target.number} because it is ${target.state}.`);
    continue;
  }

  if (!skipPendingStatus) {
    setReviewGateStatus(target, "pending", "Review gate is evaluating review state.");
  }
  const result = runReviewGate(target);

  if (result.ok) {
    if (result.allowedMissingHeadReview) {
      setReviewGateStatus(target, "success", "No active review blockers; Codex review missing.");
      continue;
    }

    setReviewGateStatus(target, "success", "No active review blockers found.");
    continue;
  }

  setReviewGateStatus(
    target,
    "failure",
    "Unresolved thread, requested changes, or missing current-head review found.",
  );
  targetedFailure = true;
}

if (!allOpen && targetedFailure) process.exit(1);

function readPullRequest(number) {
  return runJson([
    "pr",
    "view",
    String(number),
    "--repo",
    repo,
    "--json",
    "number,headRefOid,state",
  ]);
}

function listOpenPullRequests() {
  const [owner, name] = repo.split("/");
  const pullRequests = [];
  let after = null;

  while (true) {
    const page = runJson([
      "api",
      "graphql",
      "-F",
      `owner=${owner}`,
      "-F",
      `name=${name}`,
      ...(after ? ["-F", `after=${after}`] : []),
      "-f",
      after
        ? "query=query($owner:String!,$name:String!,$after:String!){repository(owner:$owner,name:$name){pullRequests(states:OPEN,first:100,after:$after){pageInfo{hasNextPage endCursor} nodes{number headRefOid}}}}"
        : "query=query($owner:String!,$name:String!){repository(owner:$owner,name:$name){pullRequests(states:OPEN,first:100){pageInfo{hasNextPage endCursor} nodes{number headRefOid}}}}",
    ]);
    const pageData = page.data?.repository?.pullRequests;
    if (!pageData) fail(`Could not list open pull requests for ${repo}.`);

    pullRequests.push(...pageData.nodes);
    if (!pageData.pageInfo?.hasNextPage) return pullRequests;
    after = pageData.pageInfo.endCursor;
  }
}

function runReviewGate(target) {
  const gateArgs = [
    fileURLToPath(new URL("./check-pr-review-gate.mjs", import.meta.url)),
    "--repo",
    repo,
    "--pr",
    String(target.number),
    "--wait-head-review-ms",
    String(waitHeadReviewMs),
    "--poll-interval-ms",
    String(pollIntervalMs),
    "--expected-head-oid",
    target.headRefOid,
  ];

  if (strictHeadReview) gateArgs.push("--strict-head-review");
  if (allowMissingHeadReview) gateArgs.push("--allow-missing-head-review");
  if (requiredReviewAuthor) {
    gateArgs.push("--required-review-author", requiredReviewAuthor);
  }

  try {
    const output = execFileSync(process.execPath, gateArgs, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    process.stdout.write(output);
    return {
      ok: true,
      allowedMissingHeadReview: output.includes(
        ALLOWED_MISSING_HEAD_REVIEW_MARKER,
      ),
    };
  } catch (error) {
    const failure = error;
    process.stdout.write(String(failure.stdout ?? ""));
    process.stderr.write(String(failure.stderr ?? ""));
    return { ok: false, allowedMissingHeadReview: false };
  }
}

function setReviewGateStatus(target, state, description) {
  const latestStatus = readLatestReviewGateStatus(target);
  if (latestStatus?.state === state && latestStatus?.description === description) {
    console.log(`Review gate status already ${state} for #${target.number}; skipping duplicate write.`);
    return;
  }

  runText([
    "api",
    "-X",
    "POST",
    `repos/${repo}/statuses/${target.headRefOid}`,
    "-f",
    `state=${state}`,
    "-f",
    "context=Review gate",
    "-f",
    `description=${description}`,
    ...(runUrl ? ["-f", `target_url=${runUrl}`] : []),
  ]);
}

function readLatestReviewGateStatus(target) {
  const statuses = runJson(["api", `repos/${repo}/commits/${target.headRefOid}/statuses`]);
  return statuses.find((status) => status.context === "Review gate") ?? null;
}

function readArgValue(name) {
  const index = rawArgs.indexOf(name);
  if (index === -1) return undefined;
  const value = rawArgs[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function readNonNegativeIntegerArg(name, fallback) {
  const rawValue = readArgValue(name);
  if (rawValue === undefined) return fallback;
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0) fail(`${name} must be a non-negative integer.`);
  return value;
}

function runJson(ghArgs) {
  return JSON.parse(runText(ghArgs));
}

function runText(ghArgs) {
  return execFileSync("gh", ghArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
