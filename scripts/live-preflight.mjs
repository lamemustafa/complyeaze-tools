import { spawnSync } from "node:child_process";

export const LIVE_PREFLIGHT_CHECKS = [
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
    id: "docker-daemon",
    label: "Docker daemon available",
    command: ["docker", "version", "--format", "{{.Server.Version}}"],
    mutates: false,
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
];

export function runCheck(check) {
  const result = spawnSync(check.command[0], check.command.slice(1), {
    encoding: "utf8",
    shell: false,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  const hasRequiredOutput = !check.requireOutput || result.stdout.trim().length > 0;

  return {
    id: check.id,
    label: check.label,
    command: check.command.join(" "),
    ok: result.status === 0 && hasRequiredOutput,
    output,
  };
}

export function renderResult(result) {
  const status = result.ok ? "PASS" : "FAIL";
  const lines = [`[${status}] ${result.id} - ${result.label}`, `  $ ${result.command}`];
  if (result.output) lines.push(`  ${result.output.split("\n").slice(0, 6).join("\n  ")}`);
  return lines.join("\n");
}

function main() {
  const results = LIVE_PREFLIGHT_CHECKS.map(runCheck);
  console.log(results.map(renderResult).join("\n\n"));
  process.exitCode = results.every((result) => result.ok) ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
