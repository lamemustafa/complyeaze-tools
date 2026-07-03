import { parseSimpleCsv, type CsvRow } from "./csv";

type PortalAttempt = {
  attemptedAt: string;
  timezone: string;
  action: string;
  error: string;
  retryCount: string;
  complaintReference: string;
};

export function buildGstPortalEvidenceMemo(input: string | CsvRow[]): string {
  const attempts = (typeof input === "string" ? parseSimpleCsv(input) : input)
    .map(normalizeAttempt)
    .filter((attempt): attempt is PortalAttempt => Boolean(attempt));

  return [
    "GST portal issue evidence memo",
    "Observed scope: user-entered attempts only.",
    ...attempts.map(formatAttempt),
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
  };
}

function formatAttempt(attempt: PortalAttempt): string {
  return [
    `${attempt.attemptedAt} ${attempt.timezone} - ${attempt.action}`,
    attempt.error ? `error: ${attempt.error}` : null,
    attempt.retryCount ? `retry count ${attempt.retryCount}` : null,
    attempt.complaintReference ? `complaint ${attempt.complaintReference}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" | ");
}
