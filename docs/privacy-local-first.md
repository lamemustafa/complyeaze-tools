# Privacy Posture

ComplyEaze Tools is local-first for tool input handling:

- Files and pasted records are processed in the browser.
- No account or file upload is required.
- The runtime code must not use `fetch`, `XMLHttpRequest`, `sendBeacon`,
  `WebSocket`, `EventSource`, or service-worker registration for tool data.
- The static host may receive normal web request metadata when serving HTML,
  JavaScript, CSS, images, and other static assets.

Do not describe this as zero data collection, no data leaves the device, DPDP
compliant, forensic redaction, or legally irreversible redaction. Those claims
are intentionally outside the V0 evidence boundary.
