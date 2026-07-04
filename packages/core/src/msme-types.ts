export type MsmeReviewStartSource =
  | "acceptance-date"
  | "deemed-acceptance-date"
  | "invoice-date-fallback"
  | "objection-resolved-date"
  | "missing";

export type MsmeAgreement = "yes" | "no" | "unknown";

export type MsmePaymentStatus = "unpaid" | "partly-paid" | "paid" | "unknown";

export type MsmeUdyamEvidenceStatus = "available" | "missing" | "not-reviewed";

export type MsmePossibleFlag =
  | "review-needed"
  | "missing-review-date"
  | "within-review-window"
  | "paid-review-context"
  | "disputed-review-context";

export type MsmePayableReview = {
  vendor: string;
  amount: string;
  invoiceDate: string;
  acceptanceDate: string;
  deemedAcceptanceDate: string;
  objectionRaisedDate: string;
  objectionResolvedDate: string;
  writtenAgreement: MsmeAgreement;
  agreedPaymentDays: number | null;
  reviewStartSource: MsmeReviewStartSource;
  reviewStartDate: string;
  candidateReviewMarkerDate: string | null;
  applicableLimitDays: number | null;
  thresholdCapApplied: boolean;
  reviewDate: string | null;
  reviewBasis: string;
  ageDays: number | null;
  daysPastCandidateMarker: number | null;
  daysPastReviewDate: number | null;
  paymentStatus: MsmePaymentStatus;
  openBalance: number | null;
  udyamEvidenceStatus: MsmeUdyamEvidenceStatus;
  udyamRegistrationDate: string;
  evidenceChecks: string[];
  missingFactChecks: string[];
  nextReviewActions: string[];
  possibleFlag: MsmePossibleFlag;
};
