resource "cloudflare_ruleset" "tools_custom_firewall" {
  zone_id = var.cloudflare_zone_id
  name    = "tools.complyeaze.com custom firewall"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    {
      ref         = "tools_block_non_standard_edge_ports"
      description = "Block non-standard edge ports for the tools host"
      expression  = "(http.host eq \"tools.complyeaze.com\" and not cf.edge.server_port in {80 443})"
      action      = "block"
    }
  ]
}
