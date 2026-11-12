/**
 * Clash of Clans player tags only use these 14 characters. The letter "O" is
 * never valid, but players often type it in place of zero.
 */
const TAG_CHARS = /^[0289PYLQGRJCUV]{3,12}$/;

/**
 * Normalizes user-typed tags: trims, uppercases, strips leading '#', maps O→0.
 * Returns the canonical "#XXXX" form, or null when the tag can't be valid.
 */
export function normalizeTag(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const body = decoded
    .trim()
    .toUpperCase()
    .replace(/^#/, "")
    .replace(/O/g, "0");
  return TAG_CHARS.test(body) ? `#${body}` : null;
}

/** "#R8L9R2GVG" → "R8L9R2GVG", for use in URLs (where '#' would start a fragment). */
export function tagToSlug(tag: string): string {
  return tag.replace(/^#/, "");
}
