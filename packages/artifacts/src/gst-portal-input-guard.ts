import type { ParsedTable } from "@complyeaze-tools/core";
import type { ToolArtifactResult } from "./tool-output-types";

const unsafeGstPortalCellPatterns = [
  /data:image\//iu,
  /;base64,/iu,
  /\b[A-Z]:\\[^\s,;]+/iu,
  /\bfile:\/\//iu,
  /\/Users\/[^\s,;]+/u,
  /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/iu,
  /\b(?:otp|captcha)\b.*\b[0-9]{4,8}\b/iu,
  /\b(?:cookie|session|password|credential|secret|token)\b/iu,
  /\.(?:png|jpe?g|pdf)\b/iu,
];

const unsafeGstPortalInputText =
  "Remove sensitive or file-like content before creating the memo. Do not paste screenshots, files, base64, local paths, GSTINs, OTPs, cookies, or credentials. Use screenshot reference/hash text only.";

export function validateGstPortalMemoCells(parsed: ParsedTable): ToolArtifactResult | null {
  const hasUnsafeCell = parsed.rowRecords.some((record) =>
    Object.values(record.row).some((value) =>
      unsafeGstPortalCellPatterns.some((pattern) => pattern.test(value)),
    ),
  );

  if (!hasUnsafeCell) return null;
  return {
    status: "blocked",
    reason: "unsafe-gst-portal-input",
    text: unsafeGstPortalInputText,
  };
}
