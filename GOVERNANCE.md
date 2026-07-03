# Governance

ComplyEaze Tools is maintained by the ComplyEaze maintainers.

## Maintainer Responsibilities

Maintainers are responsible for:

- keeping the public site local-first and source-backed;
- reviewing source, privacy, security, fixture, and copy-claim changes before
  release;
- requiring synthetic fixtures and rejecting real taxpayer artifacts;
- keeping production deploys digest-pinned;
- documenting unsupported cases and Axal upgrade paths without overstating V0.

## Decision Policy

Changes that affect privacy posture, security posture, source claims, public
copy, official-source metadata, deployment, or generated artifacts require a
maintainer review before merge.

Small copy, documentation, fixture, and test-only changes may merge after one
maintainer review when CI is green.

Deploy, security, privacy, Cloudflare, source-register, and public trust-surface
changes should receive a second maintainer or platform/security review once a
backup maintainer or GitHub team is configured. Until then, PRs must document
the solo-maintainer exception and leave enough CI, source, and runtime evidence
for later audit.

## Release Policy

Production releases must pass `pnpm verify`, publish a GHCR image with SBOM and
provenance evidence, and deploy by immutable image digest.

## Data Policy

Public issues, pull requests, examples, tests, screenshots, and docs must use
synthetic data only.
