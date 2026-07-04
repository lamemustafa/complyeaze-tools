import { buildReviewCopyArtifact } from "./review-copy-builder";
import {
  buildAisArtifact,
  buildDrc01bArtifact,
  buildGstPortalArtifact,
  buildGstr2bFollowUpArtifact,
  buildGstr2bReconciliationArtifact,
  buildGstr3bPreLockArtifact,
  buildLabourCodeGratuityArtifact,
  buildMahareraForm3Artifact,
  buildMsmeArtifact,
  buildSchedule112AArtifact,
  buildTdsTranslatorArtifact,
} from "./table-tool-builders";
import { validateGstPortalMemoCells } from "./gst-portal-input-guard";
import type { ToolArtifactBuilder } from "./tool-builder-types";

const tableBuilders: Record<string, ToolArtifactBuilder> = {
  "/msme-45-day-payment-due-date-calculator": {
    inputMode: "table",
    build: buildMsmeArtifact,
  },
  "/gstr-2b-missing-invoice-vendor-follow-up": {
    inputMode: "table",
    build: buildGstr2bFollowUpArtifact,
  },
  "/gstr-2b-purchase-reconciliation-triage": {
    inputMode: "table",
    build: buildGstr2bReconciliationArtifact,
  },
  "/ais-form-26as-mismatch-checker": {
    inputMode: "table",
    build: buildAisArtifact,
  },
  "/gst-portal-issue-evidence-memo": {
    inputMode: "table",
    preValidateParsed: validateGstPortalMemoCells,
    build: buildGstPortalArtifact,
  },
  "/gstr1-gstr3b-liability-mismatch-pre-checker": {
    inputMode: "table",
    build: buildDrc01bArtifact,
  },
  "/gstr3b-outward-liability-prelock-gap-checker": {
    inputMode: "table",
    build: buildGstr3bPreLockArtifact,
  },
  "/income-tax-act-2025-tds-section-translator": {
    inputMode: "table",
    build: buildTdsTranslatorArtifact,
  },
  "/schedule-112a-capital-gains-csv-builder": {
    inputMode: "table",
    build: buildSchedule112AArtifact,
  },
  "/labour-code-gratuity-wage-recalculator": {
    inputMode: "table",
    build: buildLabourCodeGratuityArtifact,
  },
  "/maharera-form3-withdrawal-worksheet": {
    inputMode: "table",
    build: buildMahareraForm3Artifact,
  },
};

const textBuilders: Record<string, ToolArtifactBuilder> = {
  "/privacy/review-copy-builder": {
    inputMode: "text",
    build: buildReviewCopyArtifact,
  },
};

export function getToolArtifactBuilder(slug: string): ToolArtifactBuilder | undefined {
  return textBuilders[slug] ?? tableBuilders[slug];
}
