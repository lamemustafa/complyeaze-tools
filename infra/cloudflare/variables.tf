variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for complyeaze.com. Supply through an ignored tfvars file, environment variable, or CI secret."
  type        = string
}

variable "tools_hostname" {
  description = "Public hostname owned by this repo."
  type        = string
  default     = "tools.complyeaze.com"

  validation {
    condition     = var.tools_hostname == "tools.complyeaze.com"
    error_message = "This Terraform package may only manage tools.complyeaze.com."
  }
}

variable "tools_origin_record_type" {
  description = "DNS record type for the static tools ingress."
  type        = string
  default     = "A"

  validation {
    condition     = contains(["A", "AAAA", "CNAME"], var.tools_origin_record_type)
    error_message = "tools_origin_record_type must be A, AAAA, or CNAME."
  }
}

variable "tools_origin_target" {
  description = "Origin target for tools.complyeaze.com. Use the current ingress IP or CNAME."
  type        = string
}
