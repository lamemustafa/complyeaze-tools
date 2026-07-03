import { spawnSync } from "node:child_process";

export function buildLivePreflightChecks({ imageDigest }) {
  return [
    {
      id: "github-auth",
      label: "GitHub CLI authenticated",
      command: ["gh", "auth", "status"],
      mutates: false,
    },
    {
      id: "github-repo",
      label: "GitHub repository exists and is accessible",
      command: ["gh", "repo", "view", "lamemustafa/complyeaze-tools", "--json", "name,url,visibility"],
      mutates: false,
    },
    {
      id: "github-deploy-secret",
      label: "Production kubeconfig secret exists",
      command: ["gh", "secret", "list", "--repo", "lamemustafa/complyeaze-tools"],
      mutates: false,
      expectedOutput: "TOOLS_PROD_KUBECONFIG_B64",
    },
    {
      id: "published-image",
      label: "Published image digest is pullable",
      command: ["docker", "manifest", "inspect", `ghcr.io/lamemustafa/complyeaze-tools@${imageDigest}`],
      mutates: false,
      requireOutput: true,
    },
    {
      id: "dns-record",
      label: "tools.complyeaze.com has DNS",
      command: ["dig", "+short", "tools.complyeaze.com"],
      mutates: false,
      requireOutput: true,
    },
    {
      id: "clusterissuer",
      label: "letsencrypt-prod ClusterIssuer ready",
      command: ["kubectl", "get", "clusterissuer", "letsencrypt-prod"],
      mutates: false,
    },
    {
      id: "kustomize-production",
      label: "Production Kustomize render succeeds",
      command: ["kubectl", "kustomize", "deploy/k8s/overlays/production"],
      mutates: false,
      requireOutput: true,
    },
    {
      id: "namespace",
      label: "Production namespace exists",
      command: ["kubectl", "get", "namespace", "complyeaze-tools"],
      mutates: false,
    },
    {
      id: "live-homepage-public-links",
      label: "Live homepage does not emit stale :8080 public links",
      command: ["curl", "-fsSL", "https://tools.complyeaze.com/"],
      mutates: false,
      requireOutput: true,
      expectedOutput: "https://tools.complyeaze.com",
      forbiddenOutput: [":8080"],
    },
    {
      id: "live-tool-public-links",
      label: "Live tool page does not emit stale :8080 public links",
      command: [
        "curl",
        "-fsSL",
        "https://tools.complyeaze.com/msme-45-day-payment-due-date-calculator/",
      ],
      mutates: false,
      requireOutput: true,
      expectedOutput: "https://tools.complyeaze.com/msme-45-day-payment-due-date-calculator",
      forbiddenOutput: [":8080"],
    },
    {
      id: "live-sitemap-public-links",
      label: "Live sitemap does not emit stale :8080 public links",
      command: ["curl", "-fsSL", "https://tools.complyeaze.com/sitemap.xml"],
      mutates: false,
      requireOutput: true,
      expectedOutput: "https://tools.complyeaze.com",
      forbiddenOutput: [":8080"],
    },
  ];
}

export function runCheck(check) {
  const result = spawnSync(check.command[0], check.command.slice(1), {
    encoding: "utf8",
    shell: false,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  const hasRequiredOutput = !check.requireOutput || result.stdout.trim().length > 0;
  const hasExpectedOutput = !check.expectedOutput || output.includes(check.expectedOutput);
  const hasForbiddenOutput = (check.forbiddenOutput ?? []).some((forbiddenOutput) =>
    output.includes(forbiddenOutput),
  );

  return {
    id: check.id,
    label: check.label,
    command: check.command.join(" "),
    ok: result.status === 0 && hasRequiredOutput && hasExpectedOutput && !hasForbiddenOutput,
    output,
  };
}

export function renderResult(result) {
  const status = result.ok ? "PASS" : "FAIL";
  const lines = [`[${status}] ${result.id} - ${result.label}`, `  $ ${result.command}`];
  if (result.output) {
    lines.push(`  ${previewOutput(result.output).split("\n").slice(0, 6).join("\n  ")}`);
  }
  return lines.join("\n");
}

function previewOutput(output) {
  const maxOutputChars = 720;

  return output.length > maxOutputChars ? `${output.slice(0, maxOutputChars)}...` : output;
}

function main() {
  const imageDigest = readArg("--image-digest") ?? process.env.IMAGE_DIGEST;
  if (!imageDigest?.match(/^sha256:[0-9a-f]{64}$/)) {
    console.error("Usage: pnpm preflight:live -- --image-digest sha256:<64 lowercase hex chars>");
    process.exitCode = 1;
    return;
  }

  const results = buildLivePreflightChecks({ imageDigest }).map(runCheck);
  console.log(results.map(renderResult).join("\n\n"));
  process.exitCode = results.every((result) => result.ok) ? 0 : 1;
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
