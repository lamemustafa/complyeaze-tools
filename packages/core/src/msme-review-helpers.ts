import type { CsvRow } from "./csv";
import type {
  MsmeAgreement,
  MsmePayableReview,
  MsmePaymentStatus,
  MsmeReviewStartSource,
  MsmeUdyamEvidenceStatus,
} from "./msme-types";
import {
  addDays,
  daysBetween,
  formatDate,
  isAfter,
  normalizeAgreement,
  normalizeText,
  normalizeUdyamEvidence,
  parseAmount,
  parseDate,
  parseWholeNumber,
} from "./msme-value-utils";

export function reviewMsmePayableRow(row: CsvRow, asOf: Date): MsmePayableReview {
  const invoiceDate = row.invoiceDate || row.invoice_date || "";
  const acceptanceDate = row.acceptanceDate || "";
  const deemedAcceptanceDate = row.deemedAcceptanceDate || "";
  const objectionRaisedDate = row.objectionRaisedDate || row.objectionDate || "";
  const objectionResolvedDate = row.objectionResolvedDate || row.objectionResolutionDate || "";
  const reviewStart = resolveReviewStartDate({
    acceptanceDate,
    deemedAcceptanceDate,
    invoiceDate,
    objectionResolvedDate,
  });
  const agreement = normalizeAgreement(row.writtenAgreement || row.agreement || "");
  const agreedPaymentDays = parseWholeNumber(
    row.agreedPaymentDays || row.paymentTermDays || row.agreedDays,
  );
  const reviewBasis = buildReviewBasis(agreement, agreedPaymentDays);
  const applicableLimit = buildApplicableLimit(agreement, agreedPaymentDays);
  const candidateReviewMarkerDate = buildReviewDate(
    reviewStart.date,
    agreement,
    agreedPaymentDays,
  );
  const ageDays = daysBetween(reviewStart.date, asOf);
  const daysPastCandidateMarker = candidateReviewMarkerDate
    ? daysBetween(candidateReviewMarkerDate, asOf, false)
    : null;
  const paymentStatus = paymentStatusFor(row, asOf);
  const amountValue = parseAmount(row.amount);
  const paidAmount = parseAmount(row.paidAmount || row.amountPaid);
  const asOfPaidAmount = hasFuturePaymentDate(row, asOf) ? 0 : paidAmount;
  const openBalance =
    amountValue !== null && asOfPaidAmount !== null
      ? Math.max(0, amountValue - asOfPaidAmount)
      : null;
  const udyamEvidenceStatus = normalizeUdyamEvidence(
    row.udyamEvidence || row.udyamEvidenceStatus || row.mseEvidence || "",
  );
  const udyamRegistrationDate = row.udyamRegistrationDate || row.udyamDate || "";
  const disputeStatus = normalizeText(row.disputeStatus || row.dispute || "");
  const missingFactChecks = buildEvidenceChecks({
    agreement,
    agreedPaymentDays,
    paymentStatus,
    udyamEvidenceStatus,
    disputeStatus,
    usedInvoiceDateFallback: reviewStart.source === "invoice-date-fallback",
    hasPaymentDateWithoutAmount:
      Boolean((row.paymentDate || row.paidDate || "").trim()) && paidAmount === null,
    hasObjectionContext: Boolean(objectionRaisedDate || objectionResolvedDate),
    invoiceDate,
    udyamRegistrationDate,
  });
  const nextReviewActions = buildNextReviewActions({
    agreement,
    missingFactChecks,
    reviewStartSource: reviewStart.source,
    udyamEvidenceStatus,
  });

  return {
    vendor: row.vendor || row.vendorName || row.supplier || "Unnamed vendor",
    amount: row.amount || "",
    invoiceDate,
    acceptanceDate,
    deemedAcceptanceDate,
    objectionRaisedDate,
    objectionResolvedDate,
    writtenAgreement: agreement,
    agreedPaymentDays,
    reviewStartSource: reviewStart.source,
    reviewStartDate: reviewStart.date,
    candidateReviewMarkerDate,
    applicableLimitDays: applicableLimit.days,
    thresholdCapApplied: applicableLimit.capApplied,
    reviewDate: candidateReviewMarkerDate,
    reviewBasis,
    ageDays,
    daysPastCandidateMarker,
    daysPastReviewDate: daysPastCandidateMarker,
    paymentStatus,
    openBalance,
    udyamEvidenceStatus,
    udyamRegistrationDate,
    evidenceChecks: missingFactChecks,
    missingFactChecks,
    nextReviewActions,
    possibleFlag: flagFor({
      ageDays,
      daysPastReviewDate: daysPastCandidateMarker,
      disputeStatus,
      paymentStatus,
      reviewDate: candidateReviewMarkerDate,
    }),
  };
}

function resolveReviewStartDate(input: {
  acceptanceDate: string;
  deemedAcceptanceDate: string;
  invoiceDate: string;
  objectionResolvedDate: string;
}): { source: MsmeReviewStartSource; date: string } {
  if (input.objectionResolvedDate) {
    return { source: "objection-resolved-date", date: input.objectionResolvedDate };
  }
  if (input.acceptanceDate) {
    return { source: "acceptance-date", date: input.acceptanceDate };
  }
  if (input.deemedAcceptanceDate) {
    return { source: "deemed-acceptance-date", date: input.deemedAcceptanceDate };
  }
  if (input.invoiceDate) {
    return { source: "invoice-date-fallback", date: input.invoiceDate };
  }
  return { source: "missing", date: "" };
}

function buildReviewBasis(agreement: MsmeAgreement, agreedPaymentDays: number | null): string {
  if (agreement === "no") {
    return "No written agreement: candidate marker uses the day after 15 days from acceptance/deemed acceptance.";
  }
  if (agreement === "yes" && agreedPaymentDays !== null && agreedPaymentDays > 45) {
    return "Written agreement exceeds 45 days: candidate marker capped at 45 days from acceptance/deemed acceptance.";
  }
  if (agreement === "yes" && agreedPaymentDays !== null) {
    return "Written agreement: user-entered payment period used for candidate marker.";
  }
  if (agreement === "yes") {
    return "Written agreement entered without payment days: confirm terms before relying on this row.";
  }
  return "Agreement not provided: 45-day screening marker used until terms are confirmed.";
}

function buildReviewDate(
  value: string,
  agreement: MsmeAgreement,
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

function buildApplicableLimit(
  agreement: MsmeAgreement,
  agreedPaymentDays: number | null,
): { days: number | null; capApplied: boolean } {
  if (agreement === "no") return { days: 15, capApplied: false };
  if (agreement === "yes") {
    if (agreedPaymentDays === null) return { days: null, capApplied: false };
    return { days: Math.min(agreedPaymentDays, 45), capApplied: agreedPaymentDays > 45 };
  }
  return { days: 45, capApplied: false };
}

function flagFor(input: {
  ageDays: number | null;
  daysPastReviewDate: number | null;
  disputeStatus: string;
  paymentStatus: MsmePaymentStatus;
  reviewDate: string | null;
}): MsmePayableReview["possibleFlag"] {
  if (input.ageDays === null || !input.reviewDate) return "missing-review-date";
  if (isDisputed(input.disputeStatus)) return "disputed-review-context";
  if (input.paymentStatus === "paid") return "paid-review-context";
  return input.daysPastReviewDate !== null && input.daysPastReviewDate > 0
    ? "review-needed"
    : "within-review-window";
}

function buildEvidenceChecks(input: {
  agreement: MsmeAgreement;
  agreedPaymentDays: number | null;
  paymentStatus: MsmePaymentStatus;
  udyamEvidenceStatus: MsmeUdyamEvidenceStatus;
  disputeStatus: string;
  usedInvoiceDateFallback: boolean;
  hasPaymentDateWithoutAmount: boolean;
  hasObjectionContext: boolean;
  invoiceDate: string;
  udyamRegistrationDate: string;
}): string[] {
  const checks: string[] = [];
  if (input.udyamEvidenceStatus !== "available") {
    checks.push("Collect or verify Udyam/MSE evidence before relying on this row.");
  }
  if (input.agreement === "yes" && input.agreedPaymentDays === null) {
    checks.push("Confirm written agreement payment period before using the candidate marker.");
  }
  if (input.agreement === "unknown") {
    checks.push("Confirm whether a written payment agreement exists.");
  }
  if (input.usedInvoiceDateFallback) {
    checks.push(
      "Confirm acceptance or deemed acceptance date; invoice date is only a fallback for screening.",
    );
  }
  if (input.hasObjectionContext) {
    checks.push(
      "Review objection correspondence; objection fields are screening prompts, not dispute adjudication.",
    );
  }
  if (isDisputed(input.disputeStatus)) {
    checks.push(
      "Review dispute correspondence separately before sending a vendor or management follow-up.",
    );
  }
  if (input.paymentStatus === "partly-paid") {
    checks.push("Confirm whether the paid amount is partial and whether a balance remains open.");
  }
  if (input.hasPaymentDateWithoutAmount) {
    checks.push(
      "Payment date was entered without paidAmount; confirm whether any balance remains open.",
    );
  }
  if (isAfter(input.udyamRegistrationDate, input.invoiceDate)) {
    checks.push(
      "Review whether Udyam/MSE evidence predates the disputed invoice; this tool does not decide admissibility.",
    );
  }
  return checks;
}

function buildNextReviewActions(input: {
  agreement: MsmeAgreement;
  missingFactChecks: string[];
  reviewStartSource: MsmeReviewStartSource;
  udyamEvidenceStatus: MsmeUdyamEvidenceStatus;
}): string[] {
  const actions: string[] = [];
  if (input.reviewStartSource === "invoice-date-fallback") {
    actions.push(
      "Confirm acceptance/deemed-acceptance evidence before using the marker in a management note.",
    );
  }
  if (input.agreement === "unknown") {
    actions.push("Confirm written payment terms and update the row before sending follow-up copy.");
  }
  if (input.udyamEvidenceStatus !== "available") {
    actions.push("Attach or review Udyam/MSE evidence separately before relying on this row.");
  }
  if (input.missingFactChecks.some((check) => check.includes("objection"))) {
    actions.push("Review objection correspondence outside this tool before deciding next steps.");
  }
  if (input.missingFactChecks.some((check) => check.includes("balance remains open"))) {
    actions.push("Confirm open balance from books or payment records.");
  }
  return actions;
}

function isDisputed(value: string): boolean {
  const normalized = normalizeText(value);
  if (["notdisputed", "nodispute", "undisputed", "nondisputed"].includes(normalized)) {
    return false;
  }
  return normalized.includes("disput");
}

function paymentStatusFor(row: CsvRow, asOf: Date): MsmePaymentStatus {
  const amount = parseAmount(row.amount);
  const paidAmount = parseAmount(row.paidAmount || row.amountPaid);
  const paymentDate = row.paymentDate || row.paidDate || "";

  if (hasFuturePaymentDate(row, asOf)) return "unpaid";

  if (paidAmount !== null && amount !== null) {
    if (paidAmount >= amount) return "paid";
    if (paidAmount > 0) return "partly-paid";
  }
  if (paidAmount !== null && paidAmount > 0) return "partly-paid";
  if (paymentDate.trim()) return "unknown";
  return "unpaid";
}

function hasFuturePaymentDate(row: CsvRow, asOf: Date): boolean {
  const paymentDate = row.paymentDate || row.paidDate || "";
  return Boolean(paymentDate.trim()) && isAfter(paymentDate, formatDate(asOf));
}
