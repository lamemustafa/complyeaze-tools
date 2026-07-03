import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const k8sRoot = join(process.cwd(), "deploy", "k8s", "base");

function read(name: string) {
  return readFileSync(join(k8sRoot, name), "utf8");
}

describe("Kubernetes static deployment policy", () => {
  it("declares the production namespace in the deployable manifest set", () => {
    const namespace = read("namespace.yaml");
    const kustomization = read("kustomization.yaml");

    expect(namespace).toContain("kind: Namespace");
    expect(namespace).toContain("name: complyeaze-tools");
    expect(namespace).toContain("pod-security.kubernetes.io/enforce: restricted");
    expect(namespace).toContain("pod-security.kubernetes.io/audit: restricted");
    expect(namespace).toContain("pod-security.kubernetes.io/warn: restricted");
    expect(kustomization).toContain("- namespace.yaml");
  });

  it("keeps the tools workload static, secretless, and locked down", () => {
    const deployment = read("deployment.yaml");

    expect(deployment).toContain("name: complyeaze-tools");
    expect(deployment).toMatch(
      /image: ghcr\.io\/lamemustafa\/complyeaze-tools@sha256:[0-9a-f]{64}/,
    );
    expect(deployment).not.toContain(":latest");
    expect(deployment).toContain("automountServiceAccountToken: false");
    expect(deployment).toContain("runAsNonRoot: true");
    expect(deployment).toContain("readOnlyRootFilesystem: true");
    expect(deployment).toContain("allowPrivilegeEscalation: false");
    expect(deployment).toContain("drop:");
    expect(deployment).toContain("- ALL");
    expect(deployment).not.toContain("imagePullSecrets:");
    expect(deployment).not.toContain("envFrom:");
    expect(deployment).not.toContain("DATABASE_URL");
    expect(deployment).not.toContain("REDIS");
    expect(deployment).not.toContain("complyeaze-secrets");
  });

  it("exposes tools.complyeaze.com without touching Pack or root hosts", () => {
    const ingress = read("ingress.yaml");

    expect(ingress).toContain("host: tools.complyeaze.com");
    expect(ingress).toContain("secretName: complyeaze-tools-tls");
    expect(ingress).not.toContain("pack.complyeaze.com");
    expect(ingress).not.toMatch(/host:\s+complyeaze\.com\b/);
  });

  it("keeps production image references digest-oriented", () => {
    const production = readFileSync(
      join(process.cwd(), "deploy", "k8s", "overlays", "production", "kustomization.yaml"),
      "utf8",
    );

    expect(production).not.toContain("newTag: latest");
    expect(production).not.toContain(":latest");
  });

  it("keeps staging isolated from production host and resource names", () => {
    const staging = readFileSync(
      join(process.cwd(), "deploy", "k8s", "overlays", "staging", "kustomization.yaml"),
      "utf8",
    );

    expect(staging).toContain("nameSuffix: -staging");
    expect(staging).toContain("tools-staging.complyeaze.com");
    expect(staging).toContain("complyeaze-tools-staging-tls");
  });

  it("denies egress by default", () => {
    const networkPolicy = read("network-policy.yaml");

    expect(networkPolicy).toContain("kind: NetworkPolicy");
    expect(networkPolicy).toContain("policyTypes:");
    expect(networkPolicy).toContain("- Egress");
    expect(networkPolicy).toContain("egress: []");
  });

  it("deploys the production overlay and bootstraps the namespace", () => {
    const workflow = readFileSync(
      join(process.cwd(), ".github", "workflows", "deploy-production.yml"),
      "utf8",
    );

    expect(workflow).toContain("cp -R deploy/k8s /tmp/complyeaze-tools-k8s");
    expect(workflow).toContain("source_sha");
    expect(workflow).toContain("Verify reviewed publish run");
    expect(workflow).toContain("--workflow publish-image.yml");
    expect(workflow).toContain("docker buildx imagetools inspect");
    expect(workflow).toContain("complyeaze-tools@sha256");
    expect(workflow).not.toContain("perl -0pi");
    expect(workflow).toContain("IMAGE_REF: ${{ env.IMAGE_NAME }}@${{ inputs.image_digest }}");
    expect(workflow).toContain("python3 - <<'PY'");
    expect(workflow).toContain(
      "kubectl kustomize /tmp/complyeaze-tools-k8s/overlays/production",
    );
    expect(workflow).toContain("Drop bootstrap-only namespace document");
    expect(workflow).toContain("expected to drop exactly one namespace document");
    expect(workflow).toContain('kubectl -n "${{ env.NAMESPACE }}" apply');
    expect(workflow).not.toContain("kubectl create namespace complyeaze-tools");
    expect(workflow).toContain("Live smoke checks");
    expect(workflow).toContain("https://tools.complyeaze.com/-/health");
  });

  it("keeps GitHub deploy access namespace-scoped", () => {
    const serviceAccount = readFileSync(
      join(process.cwd(), "deploy", "k8s", "deploy-access", "service-account.yaml"),
      "utf8",
    );
    const role = readFileSync(
      join(process.cwd(), "deploy", "k8s", "deploy-access", "role.yaml"),
      "utf8",
    );
    const roleBinding = readFileSync(
      join(process.cwd(), "deploy", "k8s", "deploy-access", "rolebinding.yaml"),
      "utf8",
    );

    expect(serviceAccount).toContain("name: complyeaze-tools-deployer");
    expect(serviceAccount).toContain("namespace: complyeaze-tools");
    expect(serviceAccount).toContain("automountServiceAccountToken: false");
    expect(serviceAccount).toContain("kubernetes.io/service-account-token");
    expect(role).toContain("kind: Role");
    expect(role).not.toContain("kind: ClusterRole");
    expect(role).toContain('resources: ["services"]');
    expect(role).toContain('resources: ["deployments"]');
    expect(role).toContain('resources: ["ingresses", "networkpolicies"]');
    expect(role).not.toContain("secrets");
    expect(role).not.toContain("namespaces");
    expect(roleBinding).toContain("kind: RoleBinding");
    expect(roleBinding).not.toContain("kind: ClusterRoleBinding");
  });
});
