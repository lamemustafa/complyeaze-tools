# Privacy Posture

ComplyEaze Tools is local-first for tool input handling:

- Files and pasted records are processed in the browser.
- No account or file upload is required.
- The runtime code must not use `fetch`, `XMLHttpRequest`, `sendBeacon`,
  `WebSocket`, `EventSource`, or service-worker registration for tool data.
- The static host may receive normal web request metadata when serving HTML,
  JavaScript, CSS, images, and other static assets.
- Cloudflare or another edge security layer may run bot/security checks on
  public HTML requests, including JavaScript Detections or challenge scripts
  served from `/cdn-cgi/challenge-platform`. Those systems may process
  browser/security signals and set Cloudflare cookies such as `cf_clearance`.
  They are not part of the tool workbench; the tool code must not intentionally
  send pasted rows, generated drafts, or downloaded artifacts to ComplyEaze,
  Cloudflare, or any application API.

Do not describe this as zero data collection, no data leaves the device, DPDP
compliant, forensic redaction, or legally irreversible redaction. Those claims
are intentionally outside the V0 evidence boundary.
