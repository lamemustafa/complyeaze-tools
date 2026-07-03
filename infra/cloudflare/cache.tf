locals {
  tools_cache_ruleset_phase = "http_request_cache_settings"
  tools_cache_rule_snippet = {
    ref         = "tools_immutable_astro_assets"
    description = "Cache immutable static Astro assets for the tools host"
    expression  = "(http.host eq \"tools.complyeaze.com\" and starts_with(http.request.uri.path, \"/_astro/\"))"
    action      = "set_cache_settings"
    action_parameters = {
      cache = true
      edge_ttl = {
        mode    = "override_origin"
        default = 31536000
      }
      browser_ttl = {
        mode = "respect_origin"
      }
    }
  }
}
