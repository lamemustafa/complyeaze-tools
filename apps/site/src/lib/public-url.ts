export const PUBLIC_SITE_ORIGIN = "https://tools.complyeaze.com";

export function publicSiteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${PUBLIC_SITE_ORIGIN}/`).href;
}
