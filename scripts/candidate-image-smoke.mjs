#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const defaultPort = "18081";
const requestTimeoutMs = 5_000;

async function main() {
  const image = readArg("--image");
  if (!image?.match(/^ghcr\.io\/lamemustafa\/complyeaze-tools@sha256:[0-9a-f]{64}$/)) {
    console.error("Usage: node scripts/candidate-image-smoke.mjs --image ghcr.io/lamemustafa/complyeaze-tools@sha256:<64 lowercase hex chars>");
    process.exitCode = 1;
    return;
  }

  const port = process.env.CANDIDATE_SMOKE_PORT || defaultPort;
  const name = `complyeaze-tools-candidate-${process.pid}`;

  run("docker", ["rm", "-f", name], { allowFailure: true });
  run("docker", ["run", "--rm", "-d", "--name", name, "-p", `127.0.0.1:${port}:8080`, image]);

  try {
    await waitForHealth(port);
    await assertNoSlashRedirect(port);
    await assertToolCsp(port);
    await assertManifestContentType(port);
    await assertNoInternalPort(port, ["/", "/privacy/", "/security/", "/msme-45-day-payment-due-date-calculator/", "/sitemap.xml"]);
    console.log(`Candidate image smoke passed for ${image}.`);
  } finally {
    run("docker", ["rm", "-f", name], { allowFailure: true });
  }
}

async function waitForHealth(port) {
  const deadline = Date.now() + 20_000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout(localUrl(port, "/-/health"));
      const text = await response.text();
      if (response.ok && text.trim() === "ok") return;
      lastError = new Error(`health returned ${response.status}: ${text.slice(0, 120)}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(1_000);
  }

  throw new Error(`Candidate image health check did not pass: ${lastError?.message ?? "timeout"}`);
}

async function assertNoSlashRedirect(port) {
  const response = await fetchWithTimeout(localUrl(port, "/gst-portal-issue-evidence-memo"), {
    redirect: "manual",
  });
  const location = response.headers.get("location") || "";
  if (location.includes(":8080")) {
    throw new Error(`No-slash redirect leaked internal port: ${location}`);
  }
  if (!location.includes("/gst-portal-issue-evidence-memo/")) {
    throw new Error(`No-slash redirect location was unexpected: ${location || "(empty)"}`);
  }
}

async function assertToolCsp(port) {
  const response = await fetchWithTimeout(localUrl(port, "/gst-portal-issue-evidence-memo/"), {
    method: "HEAD",
  });
  if (!response.ok) throw new Error(`Tool page returned ${response.status} during candidate CSP check.`);
  const csp = response.headers.get("content-security-policy") || "";
  if (!csp.includes("script-src 'self' 'unsafe-inline'")) {
    throw new Error(`Tool CSP is not Astro-hydration compatible: ${csp || "(missing)"}`);
  }
}

async function assertManifestContentType(port) {
  const response = await fetchWithTimeout(localUrl(port, "/site.webmanifest"), {
    method: "HEAD",
  });
  if (!response.ok) throw new Error(`Manifest returned ${response.status} during candidate smoke.`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/manifest+json")) {
    throw new Error(`Manifest content type is not browser-readable: ${contentType || "(missing)"}`);
  }
}

async function assertNoInternalPort(port, paths) {
  for (const path of paths) {
    const response = await fetchWithTimeout(localUrl(port, path));
    if (!response.ok) throw new Error(`${path} returned ${response.status} during candidate smoke.`);
    const text = await response.text();
    if (text.includes(":8080")) {
      throw new Error(`${path} leaked internal :8080 in candidate output.`);
    }
  }
}

async function fetchWithTimeout(url, init = {}) {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0 && !options.allowFailure) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} ${args.join(" ")} failed${output ? `: ${output}` : ""}`);
  }
  return result.stdout.trim();
}

function localUrl(port, path) {
  return `http://127.0.0.1:${port}${path}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
