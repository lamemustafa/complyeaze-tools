import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dockerRoot = join(process.cwd(), "deploy", "docker");

describe("Docker static image policy", () => {
  it("builds a static nginx image with no runtime app server", () => {
    const dockerfile = readFileSync(join(dockerRoot, "Dockerfile"), "utf8");

    expect(dockerfile).toContain("FROM node:22-alpine AS build");
    expect(dockerfile).toContain("FROM nginxinc/nginx-unprivileged:1.27-alpine");
    expect(dockerfile).toContain("ASTRO_TELEMETRY_DISABLED=1");
    expect(dockerfile).toContain("pnpm install --frozen-lockfile");
    expect(dockerfile).toContain("HEALTHCHECK");
    expect(dockerfile).not.toContain("DATABASE_URL");
    expect(dockerfile).not.toContain("REDIS");
  });

  it("does not expose the internal nginx port in public redirects", () => {
    const nginxConfig = readFileSync(join(dockerRoot, "nginx.conf"), "utf8");

    expect(nginxConfig).toContain("absolute_redirect off;");
    expect(nginxConfig).toContain("port_in_redirect off;");
  });

  it("serves static tools with headers compatible with Astro islands", () => {
    const nginxConfig = readFileSync(join(dockerRoot, "nginx.conf"), "utf8");

    expect(nginxConfig).toContain("script-src 'self' 'unsafe-inline'");
    expect(nginxConfig).toContain("script-src-attr 'none'");
    expect(nginxConfig).toContain("style-src 'self' 'unsafe-inline'");
    expect(nginxConfig).toContain("style-src-attr 'none'");
    expect(nginxConfig).toContain("connect-src 'none'");
  });

  it("serves the web manifest with a browser-readable content type", () => {
    const nginxConfig = readFileSync(join(dockerRoot, "nginx.conf"), "utf8");

    expect(nginxConfig).toContain("location = /site.webmanifest");
    expect(nginxConfig).toContain("default_type application/manifest+json;");
  });

  it("keeps Docker build context tight", () => {
    const dockerignore = readFileSync(join(process.cwd(), ".dockerignore"), "utf8");

    expect(dockerignore).toContain("node_modules");
    expect(dockerignore).toContain("deploy/k8s");
    expect(dockerignore).toContain("tests");
  });
});
