import { useMemo, useState } from "react";
import { buildReviewFooter } from "@complyeaze-tools/artifacts";
import {
  buildGstr2bReconciliationTriage,
  buildMsmePayableReview,
  parseSimpleCsv,
} from "@complyeaze-tools/core";
import { maskIndianIdentifiers } from "@complyeaze-tools/safety";
import { toolInputClass } from "@complyeaze-tools/ui-react";
import type { ToolMeta } from "@complyeaze-tools/source-register";

type Props = {
  tool: Pick<ToolMeta, "slug">;
};

type WorkbenchConfig = {
  inputLabel: string;
  outputLabel: string;
  guidance: string;
  sample: string;
  requiredColumns?: string[];
  reviewLabel: string;
};

const configs: Record<string, WorkbenchConfig> = {
  "/msme-45-day-payment-due-date-calculator": {
    inputLabel: "Payables rows",
    outputLabel: "Due-date review draft",
    guidance:
      "Paste CSV-style rows with vendor, amount, invoiceDate, and acceptanceDate. Dates should be YYYY-MM-DD.",
    sample:
      "vendor,amount,invoiceDate,acceptanceDate\nAcme Components,125000,2026-05-01,2026-05-03\nNorthline Supplies,42000,2026-06-20,2026-06-21",
    requiredColumns: ["vendor", "amount", "invoiceDate", "acceptanceDate"],
    reviewLabel: "MSME payable rows",
  },
  "/gstr-2b-missing-invoice-vendor-follow-up": {
    inputLabel: "Supplier issue rows",
    outputLabel: "Supplier follow-up draft",
    guidance:
      "Paste rows with supplier, invoice, amount, and status. This creates follow-up text only, not ITC eligibility conclusions.",
    sample:
      "supplier,invoice,amount,status\nAcme Components,INV-102,125000,missing in 2B\nNorthline Supplies,INV-205,42000,value mismatch",
    requiredColumns: ["supplier", "invoice", "status"],
    reviewLabel: "GSTR-2B and purchase rows",
  },
  "/gstr-2b-purchase-reconciliation-triage": {
    inputLabel: "Purchase and GSTR-2B rows",
    outputLabel: "Reconciliation triage draft",
    guidance:
      "Paste one CSV with source, supplier, gstin, invoice, and taxAmount. Use source values purchase or 2b.",
    sample:
      "source,supplier,gstin,invoice,taxAmount\npurchase,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000\n2b,Acme Components,SYNTH-ACME-GSTIN,INV-102,18000\npurchase,Northline Supplies,SYNTH-NORTH-GSTIN,INV-205,7560\n2b,Northline Supplies,SYNTH-NORTH-GSTIN,INV-205,7000\npurchase,Delta Traders,SYNTH-DELTA-GSTIN,INV-301,5400\n2b,Metro Inputs,SYNTH-METRO-GSTIN,INV-777,900",
    requiredColumns: ["source", "supplier", "invoice", "taxAmount"],
    reviewLabel: "GSTR-2B reconciliation triage rows",
  },
  "/ais-form-26as-mismatch-checker": {
    inputLabel: "Mismatch rows",
    outputLabel: "Tax statement review draft",
    guidance:
      "Paste rows with source, category, amount, recordsAmount, and note. This prepares a review table and correction request text.",
    sample:
      "source,category,amount,recordsAmount,note\nAIS,Interest,5400,0,missing in books\nForm 26AS,TDS,1200,1000,TDS amount mismatch",
    requiredColumns: ["source", "category", "amount", "recordsAmount"],
    reviewLabel: "AIS/Form 26AS review rows",
  },
  "/gst-portal-issue-evidence-memo": {
    inputLabel: "Attempt timeline rows",
    outputLabel: "Evidence memo draft",
    guidance:
      "Paste rows with attemptedAt, action, and error. This records user-observed attempts only.",
    sample:
      "attemptedAt,action,error\n2026-07-02 20:10,Login,OTP page timed out\n2026-07-02 20:24,Save GSTR-3B,Unable to load template",
    requiredColumns: ["attemptedAt", "action", "error"],
    reviewLabel: "user-observed portal attempts",
  },
  "/privacy/review-copy-builder": {
    inputLabel: "Review text",
    outputLabel: "Masked review copy",
    guidance:
      "Paste plain text and review the masked output before sharing. V0 masks common PAN, TAN, and GSTIN-like identifiers only.",
    sample:
      "Paste compliance review text here. Replace any taxpayer identifiers before sharing the draft.",
    reviewLabel: "review copy input",
  },
};

export default function ToolWorkbench({ tool }: Props) {
  const config = configs[tool.slug] ?? configs["/privacy/review-copy-builder"];
  const [input, setInput] = useState(config.sample);
  const [asOfDate, setAsOfDate] = useState(() =>
    tool.slug === "/msme-45-day-payment-due-date-calculator"
      ? new Date().toISOString().slice(0, 10)
      : "",
  );
  const inputHelpId = "tool-input-help";
  const outputStatusId = "tool-output-status";

  const output = useMemo(
    () => buildOutput(tool.slug, input, config, asOfDate),
    [tool.slug, input, config, asOfDate],
  );
  const blockedOutput = isBlockingOutput(output);
  const outputStatus = blockedOutput
    ? output
    : "Draft output updated. Review it before downloading or sharing.";

  return (
    <div className="workbench-panel">
      <div className="workbench-column">
        <div className="workbench-guide">
          <h2>Input format</h2>
          <p>{config.guidance}</p>
          {config.requiredColumns ? (
            <p>Expected columns: {config.requiredColumns.join(", ")}</p>
          ) : null}
        </div>
        {tool.slug === "/msme-45-day-payment-due-date-calculator" ? (
          <label className="as-of-control">
            <span>As-of date</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(event) => setAsOfDate(event.currentTarget.value)}
              aria-describedby={outputStatusId}
            />
          </label>
        ) : null}
        <label className="field-label" htmlFor="tool-input">
          {config.inputLabel}
        </label>
        <textarea
          id="tool-input"
          className={toolInputClass}
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          aria-describedby={`${inputHelpId} ${outputStatusId}`}
          aria-invalid={blockedOutput ? "true" : "false"}
        />
        <p className="field-help" id={inputHelpId}>
          This field stays in your browser. Use synthetic data while testing.
        </p>
      </div>
      <div className="workbench-column">
        <label className="field-label" htmlFor="tool-output">
          {config.outputLabel}
        </label>
        <textarea
          id="tool-output"
          className={toolInputClass}
          value={output}
          readOnly
          aria-describedby={outputStatusId}
        />
        <p
          className={blockedOutput ? "field-help field-help-error" : "field-help"}
          id={outputStatusId}
          role="status"
          aria-live="polite"
        >
          {outputStatus}
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            downloadText(`${tool.slug.split("/").filter(Boolean).pop()}.txt`, output)
          }
          disabled={blockedOutput}
        >
          Download draft
        </button>
      </div>
    </div>
  );
}

function isBlockingOutput(output: string): boolean {
  return output.startsWith("Paste ") || output.startsWith("Choose ");
}

function buildOutput(
  slug: string,
  input: string,
  config: WorkbenchConfig,
  asOfDate: string,
): string {
  if (slug === "/privacy/review-copy-builder") {
    if (!input.trim()) return "Paste plain text to create a review copy.";
    return `${maskIndianIdentifiers(input)}${buildReviewFooter(config.reviewLabel)}`;
  }

  const rows = parseSimpleCsv(input);
  const inputError = validateRows(input, rows, config.requiredColumns ?? []);
  if (inputError) return inputError;

  if (slug === "/msme-45-day-payment-due-date-calculator") {
    if (!asOfDate) return "Choose an as-of date to calculate payment age.";
    const review = buildMsmePayableReview(input, new Date(`${asOfDate}T00:00:00`));
    return [
      `MSME payment review draft`,
      `As-of date: ${asOfDate}`,
      ...review.map(
        (row) =>
          `${row.vendor}: ${row.ageDays ?? "missing"} days since acceptance; ${row.possibleFlag}`,
      ),
      buildReviewFooter(config.reviewLabel),
    ].join("\n");
  }

  if (slug === "/gstr-2b-missing-invoice-vendor-follow-up") {
    return [
      "Supplier follow-up drafts",
      ...rows.map(
        (row) =>
          `${row.supplier}: Please review ${row.invoice} (${row.status}) for professional follow-up.`,
      ),
      buildReviewFooter(config.reviewLabel),
    ].join("\n");
  }

  if (slug === "/gstr-2b-purchase-reconciliation-triage") {
    const summary = buildGstr2bReconciliationTriage(input);
    return [
      "GSTR-2B purchase reconciliation triage",
      `Rows reviewed: ${summary.totalRows}`,
      `Missing in 2B: ${summary.counts["missing-in-2b"]}`,
      `Extra in 2B: ${summary.counts["extra-in-2b"]}`,
      `Value mismatch: ${summary.counts["value-mismatch"]}`,
      `Duplicate keys: ${summary.counts["duplicate-key"]}`,
      `Matched within tolerance: ${summary.counts.matched}`,
      "",
      ...summary.issues.map(
        (issue) =>
          `${issue.status} | ${issue.supplier} | ${issue.invoice} | purchase ${formatAmount(issue.purchaseTaxAmount)} | 2B ${formatAmount(issue.gstr2bTaxAmount)} | diff ${formatAmount(issue.difference)} | ${issue.note}`,
      ),
      buildReviewFooter(config.reviewLabel),
    ].join("\n");
  }

  if (slug === "/ais-form-26as-mismatch-checker") {
    return [
      "Tax statement mismatch review",
      ...rows.map(
        (row) =>
          `${row.source} ${row.category}: reported ${row.amount}, records ${row.recordsAmount || "-"}; ${row.note || "review"}`,
      ),
      buildReviewFooter(config.reviewLabel),
    ].join("\n");
  }

  if (slug === "/gst-portal-issue-evidence-memo") {
    return [
      "GST portal issue evidence memo",
      ...rows.map((row) => `${row.attemptedAt} - ${row.action} - ${row.error}`),
      buildReviewFooter(config.reviewLabel),
    ].join("\n");
  }

  return `${input}${buildReviewFooter("local input")}`;
}

function formatAmount(value: number | null) {
  return value === null ? "-" : value.toFixed(2);
}

function validateRows(
  input: string,
  rows: Record<string, string>[],
  requiredColumns: string[],
): string | null {
  if (!input.trim()) return "Paste rows to create a draft output.";
  if (!rows.length) return "Paste rows with a header line and at least one data row.";

  const missing = requiredColumns.filter((column) => !(column in rows[0]));
  if (missing.length) {
    return `Paste rows with these columns: ${requiredColumns.join(", ")}. Missing: ${missing.join(", ")}.`;
  }

  return null;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
