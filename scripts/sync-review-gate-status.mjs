#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const repo = readArgValue("--repo") ?? process.env.GITHUB_REPOSITORY;
const explicitPr = readArgValue("--pr");
const allOpen = args.has("--all-open");
const runUrl = readArgValue("--run-url");
const strictHeadReview = args.has("--strict-head-review");
const allowMissingHeadReview = args.has("--allow-missing-head-review");
const requiredReviewAuthor = readArgValue("--required-review-author");
const REVIEW_GATE_CONTEXT = "Review gate";
const REVIEW_GATE_STATUS_CREATOR = "github-actions[bot]";
const ALLOWED_MISSING_HEAD_REVIEW_MARKER =
  "review-gate:allowed-missing-head-review";

if (!repo || !repo.includes("/")) fail("Pass --repo owner/name.");
if (
  !allOpen &&
  (!explicitPr || !Number.isInteger(Number(explicitPr)) || Number(explicitPr) < 1)
) {
  fail("Pass --pr <number> or --all-open.");
}

const targets = allOpen ? listOpenPullRequests() : [readPullRequest(Number(explicitPr))];
let targetedFailure = false;

for (const target of targets) {
  if (target.state && target.state !== "OPEN") {
    console.log(`Skipping PR #${target.number} because it is ${target.state}.`);
    continue;
  }

  const observedStatus = allOpen ? readLatestReviewGateStatus(target) : null;
  if (!allOpen) {
    setReviewGateStatus(target, "pending", "Review gate is evaluating review state.");
  }
  const result = runReviewGate(target);
  let finalState;
  let finalDescription;

  if (result.ok) {
    if (result.allowedMissingHeadReview) {
      finalState = "success";
      finalDescription = "No active review blockers; Codex review missing.";
    } else {
      finalState = "success";
      finalDescription = "No active review blockers found.";
    }
  } else {
    finalState = "failure";
    finalDescription =
      "Unresolved thread, requested changes, or missing current-head review found.";
    targetedFailure = true;
  }

  if (allOpen) {
    setReviewGateStatusWithOptimisticGuard(
      target,
      finalState,
      finalDescription,
      observedStatus,
    );
  } else {
    setReviewGateStatus(target, finalState, finalDescription);
  }
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

function setReviewGateStatusWithOptimisticGuard(
  target,
  state,
  description,
  observedStatus,
) {
  const currentPullRequest = readPullRequest(target.number);
  if (
    currentPullRequest.state !== "OPEN" ||
    currentPullRequest.headRefOid !== target.headRefOid
  ) {
    console.log(
      `PR #${target.number} changed head or closed during daily reconciliation; skipping stale write.`,
    );
    return;
  }

  const latestStatus = readLatestReviewGateStatus(target);
  if (!sameStatusVersion(observedStatus, latestStatus)) {
    console.log(
      `Review gate status changed while daily reconciliation evaluated #${target.number}; skipping stale write.`,
    );
    return;
  }

  setReviewGateStatus(target, state, description, latestStatus);
}

function setReviewGateStatus(
  target,
  state,
  description,
  latestStatus = readLatestReviewGateStatus(target),
) {
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
    `context=${REVIEW_GATE_CONTEXT}`,
    "-f",
    `description=${description}`,
    ...(runUrl ? ["-f", `target_url=${runUrl}`] : []),
  ]);
}

function readLatestReviewGateStatus(target) {
  const statuses = runJson(["api", `repos/${repo}/commits/${target.headRefOid}/statuses`]);
  return (
    statuses.find(
      (status) =>
        status.context === REVIEW_GATE_CONTEXT &&
        status.creator?.login === REVIEW_GATE_STATUS_CREATOR,
    ) ?? null
  );
}

function sameStatusVersion(left, right) {
  return statusVersion(left) === statusVersion(right);
}

function statusVersion(status) {
  if (!status) return "none";
  return JSON.stringify([
    status.id ?? null,
    status.state ?? null,
    status.description ?? null,
    status.target_url ?? null,
    status.updated_at ?? status.created_at ?? null,
    status.creator?.login ?? null,
  ]);
}

function readArgValue(name) {
  const index = rawArgs.indexOf(name);
  if (index === -1) return undefined;
  const value = rawArgs[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
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
