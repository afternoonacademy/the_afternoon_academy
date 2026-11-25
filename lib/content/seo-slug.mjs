/**
 * URL path for a new bilingual editorial article is derived from its English title.
 * Existing published/draft URLs never change when a title is edited.
 */
export function slugFromTitle(title) {
  return String(title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 95)
    .replace(/-+$/g, "")
}
