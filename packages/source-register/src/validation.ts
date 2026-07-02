import type { ToolMeta } from "./types";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const officialHosts = [
  "egazette.gov.in",
  "samadhaan.msme.gov.in",
  "selfservice.gstsystem.in",
  "tutorial.gst.gov.in",
  "www.dcmsme.gov.in",
  "www.incometax.gov.in",
];

export function validateToolMeta(
  tool: ToolMeta,
  asOf = new Date().toISOString().slice(0, 10),
): string[] {
  const errors: string[] = [];
  const asOfDate = parseIsoDate(asOf);

  for (const field of [
    "slug",
    "h1",
    "seoTitle",
    "metaDescription",
    "title",
    "axalUpgradePath",
  ] as const) {
    if (!tool[field]?.trim()) errors.push(`${field} is required`);
  }

  if (!tool.slug.startsWith("/")) errors.push("slug must start with /");
  if (tool.accountRequired !== false) errors.push("accountRequired must be false");
  if (tool.fileUploadRequired !== false) {
    errors.push("fileUploadRequired must be false");
  }
  if (tool.telemetry !== "none") errors.push("telemetry must be none");
  if (tool.privacyMode !== "browser-only") {
    errors.push("privacyMode must be browser-only");
  }
  if (!tool.supportedInputs.length) errors.push("supportedInputs are required");
  if (!tool.unsupportedCases.length) errors.push("unsupportedCases are required");
  if (!tool.outputArtifacts.length) errors.push("outputArtifacts are required");
  if (!tool.trustCopy.length) errors.push("trustCopy is required");
  if (!tool.bannedClaims.length) errors.push("bannedClaims are required");

  for (const source of tool.officialSources) {
    if (source.sourceType !== "official") {
      errors.push(`${source.title} must be an official source`);
    }
    if (!isoDate.test(source.lastReviewedAt)) {
      errors.push(`${source.title} has invalid lastReviewedAt`);
      continue;
    }
    const reviewedDate = parseIsoDate(source.lastReviewedAt);
    if (reviewedDate && asOfDate && reviewedDate.getTime() > asOfDate.getTime()) {
      errors.push(`${source.title} lastReviewedAt cannot be in the future`);
    }
    if (
      reviewedDate &&
      asOfDate &&
      daysBetween(reviewedDate, asOfDate) > source.staleAfterDays
    ) {
      errors.push(`${source.title} source review is stale`);
    }
    if (source.staleAfterDays <= 0) {
      errors.push(`${source.title} must have positive staleAfterDays`);
    }
    if (!officialHosts.includes(new URL(source.url).hostname)) {
      errors.push(`${source.title} must use an approved official host`);
    }
  }

  return errors;
}

function parseIsoDate(value: string): Date | null {
  if (!isoDate.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}
