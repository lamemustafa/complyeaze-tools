import { buildReviewCopyArtifact } from "./review-copy-builder";
import {
  buildAisArtifact,
  buildGstPortalArtifact,
  buildGstr2bFollowUpArtifact,
  buildGstr2bReconciliationArtifact,
  buildMsmeArtifact,
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
