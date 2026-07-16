export type EvidenceRow = {
  check: string;
  evidence: string;
  source: string;
  cadence: string;
  boundary: string;
};

export const verificationEvidence: EvidenceRow[] = [
  {
    check: "verify",
    evidence: "Runs pnpm audit:high and pnpm verify on pull requests and protected branches.",
    source: ".github/workflows/ci.yml",
    cadence: "Pull request, master push, tapish-codex branch push",
    boundary: "Required protected check; includes typecheck, lint, tests, source freshness scan, build, and built runtime network scan.",
  },
  {
    check: "Review gate",
    evidence: "Blocks unresolved current-head review findings and requested-changes reviews.",
    source: ".github/workflows/review-gate.yml",
    cadence: "Pull request lifecycle, manual dispatch, scheduled trusted refresh",
    boundary: "Findings gate only; it is not an approving reviewer-count requirement.",
  },
  {
    check: "Analyze",
    evidence: "Runs GitHub CodeQL with security-extended and security-and-quality queries.",
    source: ".github/workflows/codeql.yml",
    cadence: "Pull request, master push, weekly schedule",
    boundary: "Static analysis signal; does not replace manual review of privacy and source claims.",
  },
  {
    check: "Review dependency changes",
    evidence: "Runs GitHub Dependency Review and fails on high-severity dependency changes.",
    source: ".github/workflows/dependency-review.yml",
    cadence: "Pull request",
    boundary: "Dependency diff check; the app still avoids adding runtime data-network dependencies.",
  },
  {
    check: "Image scan and digest promotion",
    evidence: "Builds the static image, scans it with Trivy, then publishes and deploys by immutable digest.",
    source: ".github/workflows/publish-image.yml and .github/workflows/deploy-production.yml",
    cadence: "Master push publish; manual production deploy",
    boundary: "Deploy requires a reviewed source SHA and published digest; this page does not expose live cluster state.",
  },
  {
    check: "Live deploy smoke",
    evidence: "Deployment checks /-/health, CSP headers, and public sitemap content through a service port-forward.",
    source: ".github/workflows/deploy-production.yml",
    cadence: "Production deploy",
    boundary: "Post-rollout smoke only; use external monitors and incident review for availability claims.",
  },
];

export const securityBoundaryEvidence: EvidenceRow[] = [
  {
    check: "Browser-local runtime",
    evidence: "Source and built-output scanners block browser data-network APIs, background channel APIs, service-worker registration, and remote active resources.",
    source: "tests/policy/runtime-network.test.ts and scripts/scan-built-runtime-network.mjs",
    cadence: "pnpm verify",
    boundary: "Protects tool input/runtime code; static hosting and edge security still process ordinary request metadata.",
  },
  {
    check: "Content Security Policy",
    evidence: "Nginx serves connect-src 'none', form-action 'none', frame-ancestors 'none', object-src 'none', and GET/HEAD-only static routes.",
    source: "deploy/docker/nginx.conf",
    cadence: "Container build and deploy smoke checks",
    boundary: "Astro static islands currently require first-party unsafe-inline script/style allowance.",
  },
  {
    check: "Static Kubernetes workload",
    evidence: "Production manifests run a two-replica static nginx workload with no app secrets, no PVC, no service account token, read-only root filesystem, dropped capabilities, and non-root user.",
    source: "deploy/k8s/base/deployment.yaml",
    cadence: "pnpm scan:k8s and deployment review",
    boundary: "Only static site hosting is in scope; Axal owns saved workflows, documents, and collaboration.",
  },
  {
    check: "Network egress",
    evidence: "A default-deny egress NetworkPolicy is applied to the tools workload.",
    source: "deploy/k8s/base/network-policy.yaml",
    cadence: "pnpm scan:k8s and production deploy",
    boundary: "Does not describe Cloudflare or ingress metadata processing; see privacy notes.",
  },
  {
    check: "Private security intake",
    evidence: "Security and privacy reports route to private email with synthetic reproduction guidance.",
    source: "SECURITY.md and apps/site/src/pages/security.astro",
    cadence: "Governance review",
    boundary: "Public issues must not include taxpayer identifiers, credentials, portal screenshots, or document contents.",
  },
];
