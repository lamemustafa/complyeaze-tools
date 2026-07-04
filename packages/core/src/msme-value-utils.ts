import type {
  MsmeAgreement,
  MsmeUdyamEvidenceStatus,
} from "./msme-types";

export function normalizeAgreement(value: string): MsmeAgreement {
  const normalized = normalizeText(value);
  if (["yes", "y", "true", "written", "agreement"].includes(normalized)) return "yes";
  if (["no", "n", "false", "none", "noagreement"].includes(normalized)) return "no";
  return "unknown";
}

export function normalizeUdyamEvidence(value: string): MsmeUdyamEvidenceStatus {
  const normalized = normalizeText(value);
  if (["available", "yes", "y", "verified", "provided"].includes(normalized)) {
    return "available";
  }
  if (["missing", "no", "n", "notavailable", "pending"].includes(normalized)) {
    return "missing";
  }
  return "not-reviewed";
}

export function parseWholeNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function daysBetween(value: string, asOf: Date, floorAtZero = true): number | null {
  if (!value) return null;
  const date = parseDate(value);
  if (!date) return null;
  const ms = asOf.getTime() - date.getTime();
  const days = Math.floor(ms / 86_400_000);
  return floorAtZero ? Math.max(0, days) : days;
}

export function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function isAfter(left: string, right: string): boolean {
  const leftDate = parseDate(left);
  const rightDate = parseDate(right);
  return Boolean(leftDate && rightDate && leftDate.getTime() > rightDate.getTime());
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
