# Security Policy

ComplyEaze Tools is an open-source, browser-local static tools site for
professional compliance workflows. Security and privacy reports must be handled
privately because examples can easily include taxpayer identifiers, portal
artifacts, credentials, or client records.

## Supported Versions

The `main` branch and the version currently deployed at
`https://tools.complyeaze.com` are supported. Older commits, forks, local
modifications, and unpublished branches are not covered by this policy unless a
maintainer explicitly asks you to test them.

## Reporting A Vulnerability

Email security@complyeaze.com with the subject `ComplyEaze Tools security
report`.

Include:

- affected URL, package, workflow, container, or Kubernetes manifest;
- reproduction steps using synthetic data only;
- expected and actual behavior;
- impact, including whether browser-local tool input, generated artifacts,
  supply-chain evidence, or deployment credentials could be exposed;
- browser, operating system, and commit or container digest if relevant.

Do not open a public issue for suspected vulnerabilities. Do not include real
PAN, TAN, GSTIN, Aadhaar, bank details, taxpayer documents, notices, ledgers,
portal screenshots, credentials, cookies, OTPs, CAPTCHA answers, local file
paths, or downloaded compliance documents in public issues, pull requests,
screenshots, fixtures, or logs.

## Response Targets

Maintainers aim to acknowledge credible reports within 3 business days, provide
an initial triage decision within 7 business days, and coordinate a fix or
disclosure plan based on severity and exploitability. These are targets, not
guarantees.

## Safe Harbor

Good-faith research is welcome when it:

- avoids denial-of-service, persistence, credential capture, social engineering,
  spam, and data exfiltration;
- uses synthetic data and accounts you control;
- stops testing and reports promptly after confirming a vulnerability;
- gives maintainers reasonable time to remediate before public disclosure.

Activity outside these boundaries is not authorized by this policy.

## Project Security Posture

Do not include real PAN, GSTIN, Aadhaar, bank details, taxpayer documents,
notices, ledgers, portal screenshots, credentials, cookies, OTPs, CAPTCHA
answers, local file paths, or downloaded compliance documents in public issues,
pull requests, screenshots, fixtures, or logs.

ComplyEaze Tools is designed for browser-local processing. Normal web request
metadata may still be processed by hosting and ingress systems when pages and
static assets are served.

Production is expected to remain static and local-first: no accounts, no
application backend, no database, no analytics, no document upload surface, no
workload secrets, and no runtime network calls from tool code.
