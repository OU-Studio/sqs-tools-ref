/**
 * Squarespace 7.1 — Link Target Reference
 *
 * Shared across every block with a link field (Button.buttonLink,
 * Image.linkTo, ContentLink.linkTarget, etc.). A link value is one of
 * three kinds:
 *
 * 1. INTERNAL PAGE — a site-relative path to an existing page/collection item
 *      "/about-us"
 *      "/portfolio/studio-ore"
 *    Get valid paths from commondata/GetCollections (fullUrl field) or
 *    commondata/GetSiteLayout for pages currently in navigation.
 *
 * 2. EXTERNAL URL — full URL to an outside site
 *      "https://example.com"
 *    No lookup needed, just use as given. Consider newWindow: true for these.
 *
 * 3. UPLOADED FILE — a file (not an image block asset) uploaded directly to
 *    the site's file storage, served from /s/<filename>. Covers SVGs, JS,
 *    JSON, PDFs, and any other raw file attachment.
 *      "/s/lbt.svg"
 *      "/s/some-brochure.pdf"
 *
 *    List existing uploaded files (read-only):
 *      GET /api/content-items/?orderBy=addedOn&orderDirection=2&recordType=19&start=&limit=50
 *    Each result has:
 *      - filename        e.g. "lbt.svg"
 *      - assetUrl         e.g. "https://www.ou.studio/s/lbt.svg" (full, ready-to-use link)
 *      - contentType       e.g. "image/svg+xml", "text/javascript", "application/json"
 *      - dataSize          bytes
 *    Use the `assetUrl` directly, or reconstruct as `/s/<filename>` for a
 *    site-relative link.
 *
 *    NOTE: this only lists files already uploaded. There's no captured
 *    endpoint yet for uploading a brand-new file (would need multipart
 *    form handling, same gap as fresh image uploads).
 */

function resolveLinkTarget(link) {
  if (/^https?:\/\//i.test(link)) return 'external';
  if (link.startsWith('/s/')) return 'file';
  if (link.startsWith('/')) return 'internal';
  return 'unknown';
}

module.exports = { resolveLinkTarget };
