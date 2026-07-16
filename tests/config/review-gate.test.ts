import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("review findings gate workflow", () => {
  const workflow = read(".github/workflows/review-gate.yml");

  it("uses immediate supported events and only one daily repair sweep", () => {
    const lines = activeYamlLines(workflow);
    const onBlock = uniqueBlock(lines, "on", 0);

    expect(directKeys(onBlock, 2)).toEqual([
      "pull_request_target",
      "pull_request_review",
      "pull_request_review_comment",
      "schedule",
    ]);
    expect(inlineList(valueFor(onBlock, "types", 4, 0))).toEqual([
      "opened",
      "reopened",
      "synchronize",
      "ready_for_review",
      "edited",
    ]);
    expect(inlineList(valueFor(onBlock, "types", 4, 1))).toEqual([
      "submitted",
      "edited",
      "dismissed",
    ]);
    expect(inlineList(valueFor(onBlock, "types", 4, 2))).toEqual([
      "created",
      "edited",
      "deleted",
    ]);
    expect(scalar(valueFor(onBlock, "cron", 4))).toBe("41 3 * * *");
    expect(workflow).not.toMatch(/wait-head-review-ms|poll-interval-ms|180000/);
  });

  it("keeps the privileged path minimal and checks out only trusted default-branch code", () => {
    expect(validateTrustedCheckout(workflow)).toEqual([]);

    const lines = activeYamlLines(workflow);
    const permissions = mapping(uniqueBlock(lines, "permissions", 0), 2);
    expect(permissions).toEqual({
      contents: "read",
      "pull-requests": "read",
      statuses: "write",
    });

    const job = uniqueBlock(lines, "review-gate", 2);
    const condition = foldedValue(job, "if", 4);
    expect(condition).toBe(
      "github.event_name == 'schedule' || " +
        "github.event_name == 'pull_request_target' || " +
        "github.event.pull_request.head.repo.full_name == github.repository",
    );
    expect(activeShellCommands(stepRun(workflow, "Sync review gate status"))).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^pnpm\s/u)]),
    );
  });

  it("routes PR events per PR and scheduled runs through bounded all-open mode", () => {
    const run = stepRun(workflow, "Sync review gate status");
    const commands = activeShellCommands(run);

    expect(commands).toContain('if [ "${EVENT_NAME}" = "schedule" ]; then');
    expect(commands).toContain(
      "args+=(--all-open --allow-missing-head-review)",
    );
    expect(commands).toContain(
      'args+=(--pr "${PR_NUMBER}" --allow-missing-head-review)',
    );
    expect(commands).toContain('node scripts/sync-review-gate-status.mjs "${args[@]}"');
    expect(commands.filter((line) => line.includes("--all-open"))).toHaveLength(1);

    const lines = activeYamlLines(workflow);
    const concurrency = mapping(uniqueBlock(lines, "concurrency", 0), 2);
    expect(concurrency.group).toContain("github.event.pull_request.number");
    expect(concurrency["cancel-in-progress"]).toBe("true");
  });

  it("rejects the active env-decoy checkout bypass and duplicate active keys", () => {
    const unsafe = `
steps:
  - name: Checkout
    uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0
    env:
      ref: \${{ github.event.repository.default_branch }}
    with:
      # ref: \${{ github.event.repository.default_branch }}
      repository: \${{ github.repository }}
      ref: \${{ github.event.review.commit_id }}
      persist-credentials: false
`;
    expect(validateTrustedCheckout(unsafe)).toContain(
      "checkout ref must be the trusted default branch",
    );

    const duplicate = workflow.replace(
      "          ref: ${{ github.event.repository.default_branch }}",
      "          ref: ${{ github.event.repository.default_branch }}\n          ref: master",
    );
    expect(validateTrustedCheckout(duplicate)).toContain("checkout ref must appear exactly once");
  });

  it("accepts harmless quoting without weakening checkout validation", () => {
    const quoted = workflow
      .replace("repository: ${{ github.repository }}", 'repository: "${{ github.repository }}"')
      .replace(
        "ref: ${{ github.event.repository.default_branch }}",
        'ref: "${{ github.event.repository.default_branch }}"',
      )
      .replace("persist-credentials: false", 'persist-credentials: "false"');

    expect(validateTrustedCheckout(quoted)).toEqual([]);
  });

  it("documents exact protected-context and daily recovery behavior", () => {
    const branchProtection = read("docs/branch-protection.md");
    const releaseGates = read("docs/release-gates.md");
    const agents = read("AGENTS.md");

    expect(branchProtection).toContain("`Review gate` commit-status context");
    expect(branchProtection).toContain("Same-repository pull request lifecycle, review");
    expect(branchProtection).toContain("maximum delay of about 24 hours");
    expect(branchProtection).toContain("read-only fork review/comment events");
    expect(releaseGates).toMatch(/trusted\s+daily all-open reconciliation/u);
    expect(agents).toContain("Phase 0–4 Governance Freeze");
  });
});

type YamlLine = { indent: number; text: string };

function activeYamlLines(source: string): YamlLine[] {
  return source
    .split(/\r?\n/u)
    .map(stripYamlComment)
    .filter((line) => line.trim().length > 0)
    .map((line) => ({ indent: line.length - line.trimStart().length, text: line.trim() }));
}

function stripYamlComment(line: string) {
  let quote = "";
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if ((char === '"' || char === "'") && line[index - 1] !== "\\") {
      quote = quote === char ? "" : quote || char;
    } else if (char === "#" && !quote) {
      return line.slice(0, index).trimEnd();
    }
  }
  return line.trimEnd();
}

function uniqueBlock(lines: YamlLine[], key: string, indent: number) {
  const indexes = lines.flatMap((line, index) =>
    line.indent === indent && line.text === `${key}:` ? [index] : [],
  );
  expect(indexes, `${key} must appear exactly once at indent ${indent}`).toHaveLength(1);
  const start = indexes[0];
  const end = lines.findIndex((line, index) => index > start && line.indent <= indent);
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

function directKeys(lines: YamlLine[], indent: number) {
  return lines
    .filter((line) => line.indent === indent)
    .map((line) => line.text.replace(/:.*$/u, "").replace(/^- /u, ""));
}

function valueFor(lines: YamlLine[], key: string, indent: number, occurrence = 0) {
  const values = lines
    .filter((line) => line.indent === indent && line.text.replace(/^- /u, "").startsWith(`${key}:`))
    .map((line) => line.text.replace(/^- /u, "").slice(key.length + 1).trim());
  expect(values.length).toBeGreaterThan(occurrence);
  return values[occurrence];
}

function scalar(value: string) {
  return value.replace(/^(?:"(.*)"|'(.*)')$/u, "$1$2");
}

function inlineList(value: string) {
  return value.slice(1, -1).split(",").map((entry) => scalar(entry.trim()));
}

function mapping(lines: YamlLine[], indent: number) {
  return Object.fromEntries(
    lines
      .filter((line) => line.indent === indent && line.text.includes(":"))
      .map((line) => {
        const separator = line.text.indexOf(":");
        return [line.text.slice(0, separator), scalar(line.text.slice(separator + 1).trim())];
      }),
  ) as Record<string, string>;
}

function foldedValue(lines: YamlLine[], key: string, indent: number) {
  const start = lines.findIndex((line) => line.indent === indent && line.text.startsWith(`${key}:`));
  expect(start).toBeGreaterThanOrEqual(0);
  return collectIndented(lines, start, indent).join(" ");
}

function collectIndented(lines: YamlLine[], start: number, indent: number) {
  const values: string[] = [];
  for (let index = start + 1; index < lines.length && lines[index].indent > indent; index += 1) {
    values.push(lines[index].text);
  }
  return values;
}

function validateTrustedCheckout(source: string) {
  const lines = activeYamlLines(source);
  const checkoutUses = lines.flatMap((line, index) =>
    line.text.startsWith("uses: actions/checkout@") ? [index] : [],
  );
  if (checkoutUses.length !== 1) return ["exactly one checkout action is required"];

  const useIndex = checkoutUses[0];
  const stepIndent = lines[useIndex].indent - 2;
  let stepStart = useIndex;
  while (
    stepStart >= 0 &&
    !(lines[stepStart].indent === stepIndent && lines[stepStart].text.startsWith("- "))
  ) {
    stepStart -= 1;
  }
  const stepEnd = lines.findIndex(
    (line, index) =>
      index > useIndex && line.indent === stepIndent && line.text.startsWith("- "),
  );
  const step = lines.slice(stepStart + 1, stepEnd === -1 ? undefined : stepEnd);
  const withIndent = stepIndent + 2;
  const withIndex = step.findIndex(
    (line) => line.indent === withIndent && line.text === "with:",
  );
  const withEnd = step.findIndex(
    (line, index) => index > withIndex && line.indent <= withIndent,
  );
  const withLines = step.slice(withIndex + 1, withEnd === -1 ? undefined : withEnd);
  const errors: string[] = [];

  for (const [key, expected] of [
    ["repository", "${{ github.repository }}"],
    ["ref", "${{ github.event.repository.default_branch }}"],
    ["persist-credentials", "false"],
  ] as const) {
    const values = withLines
      .filter((line) => line.indent === withIndent + 2 && line.text.startsWith(`${key}:`))
      .map((line) => scalar(line.text.slice(key.length + 1).trim()));
    if (values.length !== 1) errors.push(`checkout ${key} must appear exactly once`);
    else if (values[0] !== expected) {
      errors.push(
        key === "ref"
          ? "checkout ref must be the trusted default branch"
          : `checkout ${key} has an unsafe value`,
      );
    }
  }

  return errors;
}

function stepRun(source: string, name: string) {
  const lines = source.split(/\r?\n/u);
  const nameIndex = lines.findIndex((line) => line.trim() === `- name: ${name}`);
  expect(nameIndex).toBeGreaterThanOrEqual(0);
  const stepIndent = lines[nameIndex].length - lines[nameIndex].trimStart().length;
  const runIndex = lines.findIndex(
    (line, index) => index > nameIndex && line.trim() === "run: |" && line.length - line.trimStart().length === stepIndent + 2,
  );
  const end = lines.findIndex(
    (line, index) => index > runIndex && line.trim() && line.length - line.trimStart().length <= stepIndent,
  );
  return lines.slice(runIndex + 1, end === -1 ? undefined : end).join("\n");
}

function activeShellCommands(run: string) {
  return run
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("echo "));
}
