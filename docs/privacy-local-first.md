# Privacy Posture

ComplyEaze Tools is local-first for tool input handling:

- Files and pasted records are processed in the browser.
- No account or file upload is required.
- The runtime code must not use `fetch`, `XMLHttpRequest`, `sendBeacon`,
  `WebSocket`, `EventSource`, or service-worker registration for tool data.
- The static host may receive normal web request metadata when serving HTML,
  JavaScript, CSS, images, and other static assets.
- Operational access to static-host and ingress logs should be limited to
  deployment, security, abuse-prevention, cache, and troubleshooting work. These
  logs are not product analytics and are not intended to reconstruct pasted
  rows, generated drafts, or downloaded artifact contents.
- Cloudflare or another edge security layer may run bot/security checks on
  public HTML requests, including JavaScript Detections or challenge scripts
  served from `/cdn-cgi/challenge-platform`. Those systems may process
  browser/security signals, challenge outcomes, Ray IDs, request metadata, and
  set Cloudflare cookies such as `cf_clearance` under the edge provider's
  product controls and retention settings. They are not part of the tool
  workbench; the tool code must not intentionally send pasted rows, generated
  drafts, or downloaded artifacts to ComplyEaze, Cloudflare, or any application
  API.

Do not describe this as zero data collection, no data leaves the device, DPDP
compliant, forensic redaction, or legally irreversible redaction. Those claims
are intentionally outside the V0 evidence boundary.

Do not paste real credentials, OTPs, CAPTCHA answers, GSTINs, Aadhaar numbers,
bank details, portal cookies, portal screenshots, full notices, ledgers, or
taxpayer documents into public issues, screenshots, fixtures, or support
threads. GST portal evidence memo fields for screenshot references and hashes
are manual text references only; the tool does not inspect, upload,
authenticate, or verify screenshots.
