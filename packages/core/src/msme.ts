import { parseSimpleCsv, type CsvRow } from "./csv";

export type MsmePayableReview = {
  vendor: string;
  amount: string;
  invoiceDate: string;
  acceptanceDate: string;
  deemedAcceptanceDate: string;
  writtenAgreement: "yes" | "no" | "unknown";
  agreedPaymentDays: number | null;
  reviewDate: string | null;
  reviewBasis: string;
  ageDays: number | null;
  daysPastReviewDate: number | null;
  paymentStatus: "unpaid" | "partly-paid" | "paid" | "unknown";
  udyamEvidenceStatus: "available" | "missing" | "not-reviewed";
  evidenceChecks: string[];
  possibleFlag:
    | "review-needed"
    | "missing-review-date"
    | "within-review-window"
    | "paid-review-context"
    | "disputed-review-context";
};

export function buildMsmePayableReview(
  input: string | CsvRow[],
  asOf = new Date(),
): MsmePayableReview[] {
  const rows = typeof input === "string" ? parseSimpleCsv(input) : input;
  const asOfDate = normalizeDateOnly(asOf);
  return rows.map((row) => {
    const invoiceDate = row.invoiceDate || row.invoice_date || "";
    const acceptanceDate = row.acceptanceDate || invoiceDate || "";
    const deemedAcceptanceDate = row.deemedAcceptanceDate || "";
    const reviewStartDate = acceptanceDate || deemedAcceptanceDate;
    const agreement = normalizeAgreement(row.writtenAgreement || row.agreement || "");
    const agreedPaymentDays = parseWholeNumber(
      row.agreedPaymentDays || row.paymentTermDays || row.agreedDays,
    );
    const reviewBasis = buildReviewBasis(agreement, agreedPaymentDays);
    const reviewDate = buildReviewDate(reviewStartDate, agreement, agreedPaymentDays);
    const ageDays = daysBetween(reviewStartDate, asOfDate);
    const daysPastReviewDate = reviewDate ? daysBetween(reviewDate, asOfDate, false) : null;
    const paymentStatus = paymentStatusFor(row, asOfDate);
    const udyamEvidenceStatus = normalizeUdyamEvidence(
      row.udyamEvidence || row.udyamEvidenceStatus || row.mseEvidence || "",
    );
    const disputed = isDisputed(row.disputeStatus || row.dispute || "");
    const evidenceChecks = buildEvidenceChecks({
      agreement,
      agreedPaymentDays,
      paymentStatus,
      udyamEvidenceStatus,
      disputed,
      usedInvoiceDateFallback: !row.acceptanceDate && !row.deemedAcceptanceDate && Boolean(invoiceDate),
    });

    return {
      vendor: row.vendor || row.vendorName || row.supplier || "Unnamed vendor",
      amount: row.amount || "",
      invoiceDate,
      acceptanceDate,
      deemedAcceptanceDate,
      writtenAgreement: agreement,
      agreedPaymentDays,
      reviewDate,
      reviewBasis,
      ageDays,
      daysPastReviewDate,
      paymentStatus,
      udyamEvidenceStatus,
      evidenceChecks,
      possibleFlag: flagFor({
        ageDays,
        daysPastReviewDate,
        disputed,
        paymentStatus,
        reviewDate,
      }),
    };
  });
}

function buildReviewBasis(
  agreement: MsmePayableReview["writtenAgreement"],
  agreedPaymentDays: number | null,
): string {
  if (agreement === "no") {
    return "No written agreement: appointed-day review date after 15 days from acceptance/deemed acceptance.";
  }
  if (agreement === "yes" && agreedPaymentDays !== null && agreedPaymentDays > 45) {
    return "Written agreement exceeds 45 days: review capped at 45 days from acceptance/deemed acceptance.";
  }
  if (agreement === "yes" && agreedPaymentDays !== null) {
    return "Written agreement: user-entered payment period used for review.";
  }
  if (agreement === "yes") {
    return "Written agreement entered without payment days: confirm terms before relying on this row.";
  }
  return "Agreement not provided: 45-day review screen used until terms are confirmed.";
}

function buildReviewDate(
  value: string,
  agreement: MsmePayableReview["writtenAgreement"],
  agreedPaymentDays: number | null,
): string | null {
  const date = parseDate(value);
  if (!date) return null;
  if (agreement === "no") return formatDate(addDays(date, 16));
  if (agreement === "yes") {
    if (agreedPaymentDays === null) return null;
    return formatDate(addDays(date, Math.min(agreedPaymentDays, 45)));
  }
  return formatDate(addDays(date, 45));
}

function flagFor(input: {
  ageDays: number | null;
  daysPastReviewDate: number | null;
  disputed: boolean;
  paymentStatus: MsmePayableReview["paymentStatus"];
  reviewDate: string | null;
}): MsmePayableReview["possibleFlag"] {
  if (input.ageDays === null || !input.reviewDate) return "missing-review-date";
  if (input.disputed) return "disputed-review-context";
  if (input.paymentStatus === "paid") return "paid-review-context";
  return input.daysPastReviewDate !== null && input.daysPastReviewDate > 0
    ? "review-needed"
    : "within-review-window";
}

function buildEvidenceChecks(input: {
  agreement: MsmePayableReview["writtenAgreement"];
  agreedPaymentDays: number | null;
  paymentStatus: MsmePayableReview["paymentStatus"];
  udyamEvidenceStatus: MsmePayableReview["udyamEvidenceStatus"];
  disputed: boolean;
  usedInvoiceDateFallback: boolean;
}): string[] {
  const checks: string[] = [];
  if (input.udyamEvidenceStatus !== "available") {
    checks.push("Collect or verify Udyam/MSE evidence before relying on this row.");
  }
  if (input.agreement === "yes" && input.agreedPaymentDays === null) {
    checks.push("Confirm written agreement payment period before using the review date.");
  }
  if (input.agreement === "unknown") {
    checks.push("Confirm whether a written payment agreement exists.");
  }
  if (input.usedInvoiceDateFallback) {
    checks.push("Confirm acceptance or deemed acceptance date; invoice date is only a fallback.");
  }
  if (input.disputed) {
    checks.push("Review dispute correspondence separately before sending a demand or management note.");
  }
  if (input.paymentStatus === "partly-paid") {
    checks.push("Confirm whether the paid amount is partial and whether a balance remains open.");
  }
  return checks;
}

function paymentStatusFor(row: CsvRow, asOf: Date): MsmePayableReview["paymentStatus"] {
  const amount = parseAmount(row.amount);
  const paidAmount = parseAmount(row.paidAmount || row.amountPaid);
  const paymentDate = parseDate(row.paymentDate || row.paidDate || "");

  if (paymentDate && paymentDate.getTime() > asOf.getTime()) return "unpaid";

  if (paidAmount !== null && amount !== null) {
    if (paidAmount >= amount) return "paid";
    if (paidAmount > 0) return "partly-paid";
  }
  if (paidAmount !== null && paidAmount > 0) return "partly-paid";
  if (paymentDate) return "paid";
  return "unpaid";
}

function normalizeAgreement(value: string): MsmePayableReview["writtenAgreement"] {
  const normalized = normalizeText(value);
  if (["yes", "y", "true", "written", "agreement"].includes(normalized)) return "yes";
  if (["no", "n", "false", "none", "noagreement"].includes(normalized)) return "no";
  return "unknown";
}

function normalizeUdyamEvidence(value: string): MsmePayableReview["udyamEvidenceStatus"] {
  const normalized = normalizeText(value);
  if (["available", "yes", "y", "verified", "provided"].includes(normalized)) {
    return "available";
  }
  if (["missing", "no", "n", "notavailable", "pending"].includes(normalized)) {
    return "missing";
  }
  return "not-reviewed";
}

function parseWholeNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseAmount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function daysBetween(value: string, asOf: Date, floorAtZero = true): number | null {
  if (!value) return null;
  const date = parseDate(value);
  if (!date) return null;
  const ms = asOf.getTime() - date.getTime();
  const days = Math.floor(ms / 86_400_000);
  return floorAtZero ? Math.max(0, days) : days;
}

function isDisputed(value: string): boolean {
  const normalized = normalizeText(value);
  if (["notdisputed", "nodispute", "undisputed", "nondisputed"].includes(normalized)) {
    return false;
  }
  return normalized.includes("disput");
}

function normalizeDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
