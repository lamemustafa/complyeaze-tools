export const PUBLIC_SITE_ORIGIN = "https://tools.complyeaze.com";

export function publicSiteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, `${PUBLIC_SITE_ORIGIN}/`);
  const lastSegment = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
  const isStaticAsset = lastSegment.includes(".");
  if (!isStaticAsset && !url.pathname.endsWith("/")) url.pathname = `${url.pathname}/`;
  return url.href;
}
