import { parseSimpleCsv, type CsvRow } from "./csv";

type PortalAttempt = {
  attemptedAt: string;
  timezone: string;
  action: string;
  error: string;
  retryCount: string;
  complaintReference: string;
  screenshotReference: string;
  screenshotHash: string;
  browser: string;
  device: string;
  networkContext: string;
};

export function buildGstPortalEvidenceMemo(input: string | CsvRow[]): string {
  const attempts = (typeof input === "string" ? parseSimpleCsv(input) : input)
    .map(normalizeAttempt)
    .filter((attempt): attempt is PortalAttempt => Boolean(attempt));

  return [
    "GST portal issue evidence memo",
    "Observed scope: user-entered attempts only.",
    ...attempts.map(formatAttempt),
    ...formatEvidenceChecks(attempts),
    ...formatNextActions(attempts),
    "Boundary: this memo records user-observed events and does not prove wider portal availability.",
  ].join("\n");
}

function normalizeAttempt(row: CsvRow): PortalAttempt | null {
  const attemptedAt = row.attemptedAt || row.timestamp || "";
  const action = row.action || "";
  const error = row.error || row.errorText || row.note || "";
  if (!attemptedAt || !action) return null;

  return {
    attemptedAt,
    timezone: row.timezone || "local time as entered",
    action,
    error,
    retryCount: row.retryCount || row.retries || "",
    complaintReference: row.complaintReference || row.reference || "",
    screenshotReference: row.screenshotReference || row.screenshotName || row.evidenceReference || "",
    screenshotHash:
      row.screenshotSha256 || row.screenshotHash || row.evidenceHash || row.sha256 || "",
    browser: row.browser || row.browserContext || "",
    device: row.device || row.deviceContext || "",
    networkContext: row.networkContext || row.network || "",
  };
}

function formatAttempt(attempt: PortalAttempt): string {
  const lines = [
    `${attempt.attemptedAt} ${attempt.timezone} - ${attempt.action}`,
    attempt.error ? `error: ${attempt.error}` : null,
    attempt.retryCount ? `retry count ${attempt.retryCount}` : null,
    attempt.complaintReference ? `complaint ${attempt.complaintReference}` : null,
  ].filter((part): part is string => Boolean(part));
  const context = [attempt.browser, attempt.device, attempt.networkContext].filter(Boolean);
  if (context.length) lines.push(`Browser/context: ${context.join("; ")}`);
  if (attempt.screenshotReference) {
    lines.push(`Screenshot/reference entered by user: ${attempt.screenshotReference}`);
  }
  if (attempt.screenshotHash) {
    lines.push(`Screenshot/evidence reference: ${attempt.screenshotHash}`);
  }
  return lines.join(" | ");
}

function formatEvidenceChecks(attempts: PortalAttempt[]): string[] {
  if (!attempts.length) return [];
  const hasEvidenceReference = attempts.some(
    (attempt) => attempt.screenshotHash || attempt.complaintReference,
  );
  const checks = [
    "Evidence integrity notes:",
    "Evidence checks: screenshot hashes and complaint references are user-entered references only.",
    "This tool does not inspect, upload, authenticate, or verify screenshots.",
    "Confirm timestamps, timezone, browser/device context, and error text against retained records.",
  ];
  if (hasEvidenceReference) {
    checks.push("Confirm the hash was generated from the retained file.");
  }
  return checks;
}

function formatNextActions(attempts: PortalAttempt[]): string[] {
  if (!attempts.length) return [];
  return [
    "Next review actions:",
    "Keep original screenshots or tickets outside this text tool.",
    "Separate user, browser, network, and portal factors before making any representation.",
  ];
}
