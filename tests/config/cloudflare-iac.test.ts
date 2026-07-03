import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const cloudflareDir = join(root, "infra", "cloudflare");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function readTerraform() {
  return readdirSync(cloudflareDir)
    .filter((name) => name.endsWith(".tf"))
    .map((name) => read(join("infra", "cloudflare", name)))
    .join("\n");
}

describe("Cloudflare IaC scaffold", () => {
  it("documents import-first ownership and state hygiene", () => {
    const readme = read("infra/cloudflare/README.md");
    const gitignore = read(".gitignore");

    expect(readme).toContain("tools.complyeaze.com");
    expect(readme).toContain("Import existing dashboard-managed Cloudflare resources");
    expect(readme.toLowerCase()).toMatch(/must not add an automatic cloudflare\s+apply workflow/);
    expect(readme).toContain("Do not commit provider tokens, zone IDs, account IDs, state, or `.tfvars`.");
    expect(gitignore).toContain(".terraform/");
    expect(gitignore).toContain("*.tfstate");
    expect(gitignore).toContain("*.tfvars");
    expect(gitignore).not.toContain(".terraform.lock.hcl");
    expect(existsSync(join(cloudflareDir, ".terraform.lock.hcl"))).toBe(false);
    expect(readdirSync(cloudflareDir).filter((name) => name.endsWith(".tfvars"))).toEqual([]);
  });

  it("keeps Terraform host-scoped to tools.complyeaze.com", () => {
    const terraform = readTerraform();

    expect(existsSync(join(cloudflareDir, "versions.tf"))).toBe(true);
    expect(terraform).toContain('source  = "cloudflare/cloudflare"');
    expect(terraform).toContain('default     = "tools.complyeaze.com"');
    expect(terraform).toContain('var.tools_hostname == "tools.complyeaze.com"');
    expect(terraform).toContain("cloudflare_dns_record");
    expect(terraform).toContain("cloudflare_ruleset");
    expect(terraform).toContain('zone_id = var.cloudflare_zone_id');
    expect(terraform).toContain('phase   = "http_request_cache_settings"');
    expect(terraform).toContain('phase   = "http_request_firewall_custom"');
    expect(terraform).toContain('http.host eq \\"tools.complyeaze.com\\"');
    expect(terraform).toContain('proxied = true');
    expect(terraform).not.toContain("pack.complyeaze.com");
    expect(terraform).not.toContain('account_id =');
    expect(terraform).not.toContain('name    = "@"');
    expect(terraform).not.toMatch(/http\.host eq "complyeaze\.com"/);
  });

  it("does not commit Cloudflare tokens or provider credentials", () => {
    const terraform = readTerraform();

    expect(terraform).not.toMatch(/api_token\s*=/);
    expect(terraform).not.toMatch(/CLOUDFLARE_API_TOKEN/);
    expect(terraform).not.toMatch(/cloudflare_api_token/);
  });
});
