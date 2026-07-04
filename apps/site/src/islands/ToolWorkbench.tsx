import { useMemo, useState } from "react";
import { toolInputClass } from "@complyeaze-tools/ui-react";
import {
  buildToolReviewArtifact,
  configs,
  getToolArtifactDefinition,
  type WorkbenchTool,
} from "@complyeaze-tools/artifacts";

type Props = {
  tool: WorkbenchTool;
};

export default function ToolWorkbench({ tool }: Props) {
  const config = configs[tool.slug] ?? configs["/privacy/review-copy-builder"];
  const artifactDefinition = getToolArtifactDefinition(tool.slug);
  const [input, setInput] = useState(config.sample);
  const [asOfDate, setAsOfDate] = useState(() =>
    tool.slug === "/msme-45-day-payment-due-date-calculator"
      ? new Date().toISOString().slice(0, 10)
      : "",
  );
  const [strictGstrMatch, setStrictGstrMatch] = useState(false);
  const inputHelpId = "tool-input-help";
  const outputStatusId = "tool-output-status";

  const artifactResult = useMemo(
    () =>
      buildToolReviewArtifact({
        tool: {
          slug: tool.slug,
          title: tool.h1,
          officialSources: tool.officialSources,
          unsupportedCases: tool.unsupportedCases,
        },
        input,
        asOfDate,
        options: { strictGstrMatch },
      }),
    [tool, input, asOfDate, strictGstrMatch],
  );
  const output = artifactResult.text;
  const blockedOutput = artifactResult.status === "blocked";
  const outputStatus = blockedOutput
    ? output
    : "Draft output updated. Review it before downloading or sharing.";

  return (
    <div className="workbench-panel">
      <div className="workbench-column">
        <div className="workbench-guide">
          <h2>Input format</h2>
          <p>{config.guidance}</p>
          {artifactDefinition.requiredColumns ? (
            <p>Expected columns: {artifactDefinition.requiredColumns.join(", ")}</p>
          ) : null}
        </div>
        {tool.slug === "/msme-45-day-payment-due-date-calculator" ? (
          <label className="as-of-control">
            <span>Review as-of date</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(event) => setAsOfDate(event.currentTarget.value)}
              aria-describedby={outputStatusId}
            />
          </label>
        ) : null}
        {tool.slug === "/gstr-2b-purchase-reconciliation-triage" ? (
          <label className="option-control">
            <span>Professional context check</span>
            <input
              type="checkbox"
              checked={strictGstrMatch}
              onChange={(event) => setStrictGstrMatch(event.currentTarget.checked)}
              aria-describedby={outputStatusId}
            />
            <span>
              Include invoice date, document type, amendment table, and ITC/IMS context when present
            </span>
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

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
