import { useMemo, useState } from "react";
import { toolInputClass } from "@complyeaze-tools/ui-react";
import {
  buildOutput,
  configs,
  isBlockingOutput,
  type WorkbenchTool,
} from "./tool-workbench-logic";

type Props = {
  tool: WorkbenchTool;
};

export default function ToolWorkbench({ tool }: Props) {
  const config = configs[tool.slug] ?? configs["/privacy/review-copy-builder"];
  const [input, setInput] = useState(config.sample);
  const [asOfDate, setAsOfDate] = useState(() =>
    tool.slug === "/msme-45-day-payment-due-date-calculator"
      ? new Date().toISOString().slice(0, 10)
      : "",
  );
  const [strictGstrMatch, setStrictGstrMatch] = useState(false);
  const [gstr3bAlreadyFiled, setGstr3bAlreadyFiled] = useState(false);
  const inputHelpId = "tool-input-help";
  const outputStatusId = "tool-output-status";

  const output = useMemo(
    () => buildOutput(tool, input, config, asOfDate, { strictGstrMatch, gstr3bAlreadyFiled }),
    [tool, input, config, asOfDate, strictGstrMatch, gstr3bAlreadyFiled],
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
            <span>Stricter match key</span>
            <input
              type="checkbox"
              checked={strictGstrMatch}
              onChange={(event) => setStrictGstrMatch(event.currentTarget.checked)}
              aria-describedby={outputStatusId}
            />
            <span>Include invoice date and document type when present</span>
          </label>
        ) : null}
        {tool.slug === "/gstr3b-outward-liability-prelock-gap-checker" ? (
          <label className="option-control">
            <span>Filing status</span>
            <input
              type="checkbox"
              checked={gstr3bAlreadyFiled}
              onChange={(event) => setGstr3bAlreadyFiled(event.currentTarget.checked)}
              aria-describedby={outputStatusId}
            />
            <span>GSTR-3B for this period is already filed</span>
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
