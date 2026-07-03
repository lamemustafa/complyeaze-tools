resource "cloudflare_dns_record" "tools" {
  zone_id = var.cloudflare_zone_id
  name    = var.tools_hostname
  type    = var.tools_origin_record_type
  content = var.tools_origin_target
  ttl     = 1
  proxied = true
  comment = "ComplyEaze Tools production ingress. Import the existing dashboard record before apply."
  tags    = ["app:complyeaze-tools", "surface:public-tools"]
}
