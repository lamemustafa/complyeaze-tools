#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const publicOrigin = "https://tools.complyeaze.com";
const activeLinkRels = new Set([
  "dns-prefetch",
  "modulepreload",
  "preconnect",
  "prefetch",
  "preload",
  "prerender",
  "stylesheet",
]);

export const forbiddenBuiltRuntimePatterns = [
  { label: "fetch", pattern: /\bfetch\s*\(/ },
  { label: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { label: "sendBeacon", pattern: /\bnavigator\.sendBeacon\b/ },
  { label: "WebSocket", pattern: /\bWebSocket\b/ },
  { label: "EventSource", pattern: /\bEventSource\b/ },
  { label: "serviceWorker.register", pattern: /\bserviceWorker\.register\b/ },
  { label: "remote dynamic import", pattern: /\bimport\s*\(\s*["'](?:https?:)?\/\// },
  { label: "remote static import", pattern: /\b(?:import|export)(?!\s*\()\s*(?:[^"'()]*)?["'](?:https?:)?\/\// },
];

export function listBuiltRuntimeFiles(distDir = join(process.cwd(), "apps", "site", "dist")) {
  if (!existsSync(distDir)) {
    throw new Error(`Built site directory not found: ${distDir}. Run pnpm build first.`);
  }

  return walk(distDir).filter((file) => /\.(css|html|js|mjs)$/.test(file));
}

export function scanBuiltRuntimeNetwork({
  distDir = join(process.cwd(), "apps", "site", "dist"),
} = {}) {
  return listBuiltRuntimeFiles(distDir).flatMap((file) => {
    const source = readFileSync(file, "utf8");

    const patternOffenders = forbiddenBuiltRuntimePatterns
      .filter(({ label, pattern }) => shouldScanPattern(label, file) && pattern.test(source))
      .map(({ label }) => `${relative(process.cwd(), file)}: ${label}`);
    const resourceOffenders =
      extname(file) === ".css"
        ? scanCssResources(source, file)
        : scanHtmlResources(source, file).concat(scanCssResources(source, file));

    return patternOffenders.concat(resourceOffenders);
  });
}

function shouldScanPattern(label, file) {
  if (label === "remote static import") return /\.(?:js|mjs)$/.test(file);
  return true;
}

function scanHtmlResources(source, file) {
  const offenders = [];

  for (const tag of source.matchAll(/<script\b[^>]*>/gi)) {
    const src = readAttribute(tag[0], "src");
    if (src && isForbiddenRemoteUrl(src)) offenders.push(formatOffender(file, "remote script src", src));
  }

  for (const tag of source.matchAll(/<link\b[^>]*>/gi)) {
    const rel = readAttribute(tag[0], "rel") ?? "";
    const href = readAttribute(tag[0], "href");
    const rels = rel.toLowerCase().split(/\s+/).filter(Boolean);
    if (href && rels.some((item) => activeLinkRels.has(item)) && isForbiddenRemoteUrl(href)) {
      offenders.push(formatOffender(file, `remote link ${rels.join(" ")}`, href));
    }
  }

  for (const tag of source.matchAll(/<(?:audio|embed|iframe|img|object|source|video)\b[^>]*>/gi)) {
    for (const attribute of ["data", "poster", "src"]) {
      const value = readAttribute(tag[0], attribute);
      if (value && isForbiddenRemoteUrl(value)) {
        offenders.push(formatOffender(file, `remote ${attribute}`, value));
      }
    }
  }

  for (const match of source.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/gis)) {
    for (const candidate of readSrcsetUrls(match[2])) {
      if (isForbiddenRemoteUrl(candidate)) {
        offenders.push(formatOffender(file, "remote srcset", candidate));
      }
    }
  }

  for (const tag of source.matchAll(/<form\b[^>]*>/gi)) {
    const action = readAttribute(tag[0], "action");
    if (action && isForbiddenRemoteUrl(action)) offenders.push(formatOffender(file, "remote form action", action));
  }

  return offenders;
}

function scanCssResources(source, file) {
  const offenders = [];

  for (const match of source.matchAll(/@import\s+(?:url\(\s*)?(["']?)((?:https?:)?\/\/[^'")\s]+)\1/gi)) {
    if (isForbiddenRemoteUrl(match[2])) offenders.push(formatOffender(file, "remote css import", match[2]));
  }

  for (const match of source.matchAll(/url\(\s*(["']?)((?:https?:)?\/\/[^'")]+)\1\s*\)/gi)) {
    if (isForbiddenRemoteUrl(match[2])) offenders.push(formatOffender(file, "remote css url", match[2]));
  }

  return offenders;
}

function readAttribute(tag, name) {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`,
    "i",
  ).exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function readSrcsetUrls(value) {
  return value
    .split(",")
    .map((item) => item.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function isForbiddenRemoteUrl(value) {
  const normalized = value.startsWith("//") ? `https:${value}` : value;
  if (!/^https?:\/\//i.test(normalized)) return false;

  try {
    return new URL(normalized).origin !== publicOrigin;
  } catch {
    return true;
  }
}

function formatOffender(file, label, value) {
  return `${relative(process.cwd(), file)}: ${label}: ${value}`;
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) return walk(path);
    return [path];
  });
}

function main() {
  const offenders = scanBuiltRuntimeNetwork();

  if (offenders.length > 0) {
    console.error("Built runtime contains forbidden data-network APIs:");
    for (const offender of offenders) console.error(`- ${offender}`);
    process.exitCode = 1;
    return;
  }

  console.log("Built runtime network scan passed.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
