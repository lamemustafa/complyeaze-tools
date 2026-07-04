import { useMemo, useState } from "react";
import { parseDelimitedTable } from "@complyeaze-tools/core";
import { toolInputClass } from "@complyeaze-tools/ui-react";
import {
  buildToolReviewArtifact,
  configs,
  filterWorkbenchColumnMapping,
  getColumnMappingTargets,
  getToolArtifactDefinition,
  type WorkbenchTool,
} from "./tool-workbench-logic";

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
  const [gstrTolerance, setGstrTolerance] = useState("2");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const inputHelpId = "tool-input-help";
  const outputStatusId = "tool-output-status";
  const parsedInput = useMemo(() => parseDelimitedTable(input), [input]);
  const mappingTargets = useMemo(
    () =>
      parsedInput.headers.length
        ? getColumnMappingTargets(artifactDefinition, parsedInput.headers, {
            includeOptional:
              tool.slug === "/gstr-2b-purchase-reconciliation-triage" && strictGstrMatch,
          })
        : [],
    [artifactDefinition, parsedInput.headers, strictGstrMatch, tool.slug],
  );
  const effectiveColumnMapping = useMemo(
    () => filterWorkbenchColumnMapping(columnMapping, mappingTargets, parsedInput.headers),
    [columnMapping, mappingTargets, parsedInput.headers],
  );

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
        options: {
          strictGstrMatch,
          gstrTolerance: parseGstrTolerance(gstrTolerance),
          columnMapping: effectiveColumnMapping,
        },
      }),
    [tool, input, asOfDate, strictGstrMatch, gstrTolerance, effectiveColumnMapping],
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
          <div className="gstr-options">
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
            <label className="as-of-control">
              <span>Tax tolerance</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={gstrTolerance}
                onChange={(event) => setGstrTolerance(event.currentTarget.value)}
                aria-describedby={outputStatusId}
              />
            </label>
          </div>
        ) : null}
        {mappingTargets.length ? (
          <div className="column-mapping-panel">
            <h2>Column mapping</h2>
            <p>
              Map detected spreadsheet headers to the expected fields. Mapping
              happens in this browser before the draft is generated.
            </p>
            <p>Detected headers: {parsedInput.originalHeaders.join(", ")}</p>
            <div className="column-mapping-grid">
              {mappingTargets.map((target) => (
                <label key={target.column} className="column-mapping-control">
                  <span>{target.label}</span>
                  <select
                    value={columnMapping[target.column] ?? ""}
                    onChange={(event) =>
                      setColumnMapping((current) => ({
                        ...current,
                        [target.column]: event.currentTarget.value,
                      }))
                    }
                  >
                    <option value="">Not mapped</option>
                    {parsedInput.headers.map((header, index) => (
                      <option key={`${header}-${index}`} value={header}>
                        {parsedInput.originalHeaders[index] ?? header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
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

function parseGstrTolerance(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2;
}
