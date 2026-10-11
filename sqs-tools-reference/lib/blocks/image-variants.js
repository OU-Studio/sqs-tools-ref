/**
 * Squarespace 7.1 — Image Block (type 5) variants
 *
 * Captured from live examples with a real imageId populated. The base
 * shape is BLOCKS.image in block-library.js — this file documents the
 * meaningful variations layered on top of that default.
 */

// Six layout styles, each changes what fields matter:
const DESIGN_LAYOUTS = ['inline', 'poster', 'card', 'overlap', 'collage', 'stack'];

// IMPORTANT: the image's actual pixel dimensions/aspect ratio are NOT stored
// on the block — they're resolved server-side from the imageId asset itself.
// Confirmed by swapping imageId across differently-proportioned images with
// aspectRatio left at null: the block JSON is identical either way.
// aspectRatio only matters when you deliberately override the natural ratio
// (e.g. aspectRatio: 100 forces a specific crop regardless of source image).

// Caption text fields use a SIMPLER wrapper than the main Text block —
// no data-rte-preserve-empty, just a bare class attribute:
//   <p class="" style="white-space:pre-wrap;">text</p>
const captionField = (text) => ({
  engine: 'wysiwyg',
  source: '',
  html: `<p class="" style="white-space:pre-wrap;">${text}</p>`,
});

/**
 * Build a populated image block value. imageId must be a real asset id
 * already uploaded to the site (grab it from an existing image block, or
 * from an image upload response) — there's no way to synthesize a valid one.
 */
function imageBlockValue({
  imageId,
  designLayout = 'inline',       // inline | poster | card | overlap | collage | stack
  imagePosition = 'left',        // left | right — ignored by 'inline'
  title,
  subtitle,
  description,
  linkTo = '',                   // internal path e.g. "/home", or external URL
  lightbox = false,
  imageMask = 'circle',          // shape applied to caption-position layouts
  borderRadii,                   // e.g. { value: 16, unit: 'px' } for all 4 corners, default 0
  aspectRatio = null,            // null = auto/original; or a number (e.g. 100)
  stretch = false,
} = {}) {
  const radius = borderRadii || { value: 0, unit: 'px' };
  return {
    imageId,
    linkTo,
    newwindow: false,
    imageLink: linkTo ? 'page' : 'none',
    buttonText: '',
    lightbox,
    lightboxTheme: 'dark',
    combinationAnimation: 'site-default',
    individualImageAnimation: 'site-default',
    individualTextAnimation: 'site-default',
    aspectRatio,
    layout: 'caption-below',
    stretch,
    description: captionField(description || ''),
    title: captionField(title || 'Make it stand out'),
    subtitle: captionField(subtitle || 'Whatever it is, the way you tell your story online can make all the difference.'),
    designLayout,
    imagePosition,
    mapping: null,
    imageCropType: 'css_styles',
    imageMask,
    borderRadii: { topLeft: radius, topRight: radius, bottomLeft: radius, bottomRight: radius },
    imageOverlay: { enabled: false, color: { type: 'THEME_COLOR' }, blendMode: 'normal' },
    imageEffect: { type: 'none' },
    floatDir: null, hSize: null,
    containerStyles: { backgroundEnabled: false, stretchedToFill: false },
  };
}

module.exports = { DESIGN_LAYOUTS, imageBlockValue };

/**
 * ---- Sourcing a real imageId for an Image block ----
 *
 * The `imageId` a block needs is NOT the same as the media library asset id.
 * Confirmed pipeline for using an image that's already in the site's media
 * library (does not cover fresh file uploads, which need multipart form
 * handling not captured here):
 *
 * 1. LIST library assets (read-only) — CONFIRMED via live capture:
 *    GET https://media-api.squarespace.com/user/libraries/<websiteId>/folders/root/assets
 *        ?order=DESC&orderBy=CREATED_AT&assetTypes=IMAGE
 *        &assetSources=UPLOAD,FLICKR,SMUGMUG,DROPBOX,FIVEHUNDREDPX,REHOST,SQUARESPACE_APP,SQUARESPACE_APP_BULK,AI,AI_GENERATED,AI_SECTION_BG
 *        &limit=72&offset=0
 *    Header: x-library-id: <websiteId>  — NO x-csrf-token: media-api.squarespace.com
 *    is a different origin from the site, and its CORS preflight rejects that
 *    header (a 401 "Authentication information missing" also happens if you're
 *    on an admin shell screen like /config/pages where the site's own
 *    window.Static.SQUARESPACE_CONTEXT isn't reachable — run this from an
 *    actual live page instead, same as duplicate-page.js's usage note).
 *
 *    Response shape (corrected from an earlier unverified guess):
 *      {
 *        folders: { folderRecords: [...] },
 *        assets: {
 *          previous: "<url or "">", next: "<url or "">", total: <number>, searchId: "<uuid>",
 *          assetRecords: [
 *            {
 *              id: "a3facf97-d32e-4534-bbfe-9294093d78ef",   // NOT block-ready yet
 *              assetType: "IMAGE", assetSource: "UPLOAD",     // or AI, FLICKR, etc.
 *              assetUrl: "https://images.squarespace-cdn.com/content/<websiteId>/<id>/<filename>?content-type=...",
 *              stringMetaData: { fileName: "photo.png", originalMime: "image/png", ... },
 *              numericMetadata: { originalWidth, originalHeight, originalFileSize, colorCenter, ... },
 *              createdAt: "Thu, 27 Aug 2026 09:26:15 GMT", lastModified: "...",
 *              protectionLevel: "PRIVATE" | "PUBLIC",
 *              usages: [ { product: "WEBSITE", usageType: "FAVICON" | "COVER_PAGE_BACKGROUND" | ..., ... } ], // only on assets actively used somewhere
 *            }, ...
 *          ]
 *        }
 *      }
 *    Note: assets is an OBJECT with pagination fields, not directly an array —
 *    the real list is assets.assetRecords. filename is under stringMetaData.fileName,
 *    not a top-level field.
 *
 * 2. REFERENCE the asset into the site's content system (WRITE — creates a
 *    content-item record; do not call repeatedly for the same asset, it
 *    likely creates duplicates each time):
 *    POST /api/uploads/images/asset-reference
 *    Content-Type: application/x-www-form-urlencoded
 *    Body: assetId=<id from step 1>&libraryId=<websiteId>&recordType=2
 *    Returns { media: [ { id: "<NEW block-ready imageId>", assetUrl, ... } ] }
 *    THIS returned id is what goes into an Image block's value.imageId.
 *
 * 3. Use the id from step 2's response as imageBlockValue({ imageId: ... }).
 *
 * Optional: GET https://media-api.squarespace.com/user/libraries/<websiteId>/assets/<assetId>
 *   (header x-library-id) — fetches a single asset's metadata; same data
 *   shape as one entry from step 1's list, useful for a targeted lookup
 *   instead of paging through the whole library.
 *
 * CAUTION: step 2 is a write. Before calling it, check whether the image has
 * already been referenced (e.g. by searching existing page content for a
 * block whose imageId maps back to this asset) to avoid creating duplicate
 * media records for the same underlying file.
 *
 * PICKING AN ASSET RELIABLY: the list endpoint (step 1) has no server-side
 * name-search param — only order/orderBy/assetTypes/assetSources/limit/
 * offset. "Pick the most recent" is fragile (drifts as new assets get
 * uploaded). The stable pattern (used by scripts/build-test-page.js):
 * upload one placeholder image ONCE with a fixed known filename (e.g.
 * "template-placeholder.jpg"), then always filter the fetched
 * assetRecords client-side for stringMetaData.fileName === that name,
 * regardless of upload recency.
 */

