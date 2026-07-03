locals {
  tools_waf_ruleset_phase = "http_request_firewall_custom"
  tools_non_standard_port_rule_snippet = {
    ref         = "tools_block_non_standard_edge_ports"
    description = "Block non-standard edge ports for the tools host"
    expression  = "(http.host eq \"tools.complyeaze.com\" and not cf.edge.server_port in {80 443})"
    action      = "block"
  }
}
