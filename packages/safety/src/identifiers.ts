const panLike = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
const gstinLike = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g;
const tanLike = /\b[A-Z]{4}[0-9]{5}[A-Z]\b/g;

export function maskIndianIdentifiers(input: string): string {
  return input
    .replace(gstinLike, "[GSTIN masked]")
    .replace(panLike, "[PAN masked]")
    .replace(tanLike, "[TAN masked]");
}
