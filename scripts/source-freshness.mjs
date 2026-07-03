#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function buildSourceFreshnessReport({
  asOf = new Date().toISOString().slice(0, 10),
  sourcePath = join(process.cwd(), "packages", "source-register", "src", "tools.ts"),
} = {}) {
  const sourceText = readFileSync(sourcePath, "utf8");
  const constants = parseStringConstants(sourceText);
  const asOfDate = parseIsoDate(asOf);
  const sources = parseToolSources(sourceText, constants).map((source) => {
    const reviewedDate = parseIsoDate(source.lastReviewedAt);
    const ageDays = reviewedDate && asOfDate ? daysBetween(reviewedDate, asOfDate) : null;
    const nextReviewDate = reviewedDate
      ? addDays(reviewedDate, source.staleAfterDays).toISOString().slice(0, 10)
      : "invalid";
    const stale = ageDays === null ? true : ageDays > source.staleAfterDays;

    return {
      ...source,
      ageDays,
      nextReviewDate,
      stale,
    };
  });

  return {
    asOf,
    staleCount: sources.filter((source) => source.stale).length,
    sources,
  };
}

export function renderMarkdown(report) {
  const rows = report.sources
    .map((source) =>
      [
        source.stale ? "stale" : "ok",
        source.publisher,
        `[${source.title}](${source.url})`,
        source.lastReviewedAt,
        `${source.staleAfterDays} days`,
        source.nextReviewDate,
        source.usedFor.join(", "),
      ].join(" | "),
    )
    .join("\n");

  return [
    "# Source Freshness Report",
    "",
    `Generated as of ${report.asOf}.`,
    "",
    `Stale sources: ${report.staleCount}`,
    "",
    "| Status | Publisher | Source | Reviewed | Stale after | Next review due | Used for |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    rows,
    "",
    "If a source is stale, review the official source, update `packages/source-register/src/tools.ts`, weaken unsupported public claims when needed, and run `pnpm verify`.",
    "",
  ].join("\n");
}

function parseStringConstants(sourceText) {
  return Object.fromEntries(
    [...sourceText.matchAll(/^const\s+(\w+)\s*=\s*"([^"]+)";$/gm)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}

function parseToolSources(sourceText, constants) {
  return [...sourceText.matchAll(/^const\s+\w+:\s+ToolSource\s*=\s*\{([\s\S]*?)^};$/gm)].map(
    (match) => {
      const block = match[1];

      return {
        title: readStringProperty(block, "title", constants),
        publisher: readStringProperty(block, "publisher", constants),
        url: readStringProperty(block, "url", constants),
        lastReviewedAt: readStringProperty(block, "lastReviewedAt", constants),
        staleAfterDays: Number(readNumberProperty(block, "staleAfterDays")),
        usedFor: readStringArrayProperty(block, "usedFor"),
      };
    },
  );
}

function readStringProperty(block, key, constants) {
  const direct = new RegExp(`${key}:\\s*"([^"]+)"`).exec(block);
  if (direct) return direct[1];

  const variable = new RegExp(`${key}:\\s*(\\w+)`).exec(block);
  if (variable && constants[variable[1]]) return constants[variable[1]];

  throw new Error(`Missing string property ${key}`);
}

function readNumberProperty(block, key) {
  const match = new RegExp(`${key}:\\s*(\\d+)`).exec(block);
  if (!match) throw new Error(`Missing number property ${key}`);
  return match[1];
}

function readStringArrayProperty(block, key) {
  const match = new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]`).exec(block);
  if (!match) throw new Error(`Missing array property ${key}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function parseIsoDate(value) {
  if (!isoDate.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start, end) {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function main() {
  const report = buildSourceFreshnessReport({
    asOf: readArg("--as-of") ?? new Date().toISOString().slice(0, 10),
  });
  const markdown = renderMarkdown(report);
  const markdownPath = readArg("--write-md");
  const jsonPath = readArg("--write-json");

  if (markdownPath) writeFileSync(markdownPath, markdown);
  if (jsonPath) writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  if (!markdownPath && !jsonPath) process.stdout.write(markdown);

  if (hasFlag("--fail-on-stale") && report.staleCount > 0) {
    console.error(`${report.staleCount} source(s) are stale as of ${report.asOf}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
