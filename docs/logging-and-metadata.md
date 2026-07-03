# Logging And Metadata

The static host may produce platform access logs for page and asset delivery.
Those logs must not be treated as product analytics and must not include tool
input, generated output, uploaded files, or pasted record content.

Cloudflare security products, when enabled for `tools.complyeaze.com`, may run
client-side bot/security checks on HTML requests and may set Cloudflare cookies
such as `cf_clearance`. This is disclosed on the privacy page and is separate
from product analytics. Keep `connect-src 'none'` unless a reviewed design
changes the tool runtime boundary.

Do not add client-side analytics, replay scripts, third-party pixels, or custom
event capture without a new privacy/security review and explicit test coverage.
