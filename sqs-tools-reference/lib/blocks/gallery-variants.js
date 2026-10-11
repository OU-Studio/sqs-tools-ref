/**
 * Squarespace 7.1 — Gallery Block (type 8) variants
 *
 * Four distinct `design` modes, each unlocking different fields. Fields not
 * relevant to a given design are usually still present in the JSON (left
 * over from defaults) but don't affect rendering — GALLERY_FIELDS below
 * groups them by what actually matters per mode.
 */

const ASPECT_RATIOS = [
  'square', 'standard', 'standard-vertical', 'four-three',
  'three-four-vertical', 'widescreen', 'anamorphic-widescreen',
];

const LIGHTBOX_THEMES = ['dark', 'light'];

const DESIGNS = ['grid', 'stacked', 'slideshow', 'slider'];

// Fields shared by every design mode:
const BASE_FIELDS = {
  'aspect-ratio': 'square',      // one of ASPECT_RATIOS — named preset
  aspectRatio: null,             // null = use aspect-ratio preset above;
                                  // a NUMBER (e.g. 50) only appears with design:"slider",
                                  // and overrides the named preset with a custom ratio
  'auto-crop': true,
  blockAnimation: 'none',
  lightbox: false,
  lightboxTheme: 'dark',         // 'dark' | 'light'
  padding: 20,
  'show-meta': true,
  'show-meta-basic': true,
  'show-meta-only-title': false,
  'show-meta-only-description': false,
  newWindow: false,
  methodOption: 'transient',
  existingGallery: null,
  vSize: null, hSize: null, floatDir: null,
  // collectionId and transientGalleryId are the SAME value — the gallery's
  // own backing collection. CAN be created client-side — see the
  // "Populating a gallery with images" section at the end of this file.
};

// grid / stacked add:
const GRID_STACKED_FIELDS = {
  'square-thumbs': true,
  'thumbnails-per-row': 4,
};

// slideshow adds (on top of BASE_FIELDS):
const SLIDESHOW_FIELDS = {
  autoplay: false,
  'autoplay-duration': 10,       // seconds between slides
  controls: true,                // show prev/next arrows
  'meta-position': 'top',        // 'top' | 'center' | 'bottom'
  'show-meta-on-hover': false,
  thumbnails: false,             // show thumbnail strip below/beside slideshow
  'thumbnail-strip-height': 200,
  'thumbnail-strip-margin': 60,
  transparentBackground: false,
};

// slider adds (on top of SLIDESHOW_FIELDS — slider is slideshow + these):
const SLIDER_FIELDS = {
  ...SLIDESHOW_FIELDS,
  'active-alignment': 'center',  // 'left' | 'center' | 'right' — position of the focused slide
  aspectRatio: 50,                // slider is the one mode that sets a real number here
};

function galleryBlockValue({
  design = 'grid',                // grid | stacked | slideshow | slider
  aspectRatioPreset = 'square',    // one of ASPECT_RATIOS
  transientGalleryId,              // server-assigned; required for a real gallery
  lightbox = false,
  lightboxTheme = 'dark',
  padding = 20,
  showMeta = true,
  newWindow = false,
  // grid/stacked-only:
  squareThumbs = true,
  thumbnailsPerRow = 4,
  // slideshow/slider-only:
  autoplay = false,
  autoplayDuration = 10,
  controls = true,
  metaPosition = 'top',
  thumbnails = false,
  // slider-only:
  activeAlignment = 'center',
  customAspectRatio = null,        // numeric; only meaningful when design === 'slider'
} = {}) {
  const base = {
    'aspect-ratio': aspectRatioPreset,
    aspectRatio: design === 'slider' ? (customAspectRatio ?? 50) : null,
    'auto-crop': true,
    blockAnimation: 'none',
    collectionId: transientGalleryId,
    design,
    lightbox,
    lightboxTheme,
    padding,
    'show-meta': showMeta,
    'show-meta-basic': showMeta,
    'show-meta-only-title': false,
    'show-meta-only-description': false,
    transientGalleryId,
    vSize: null, hSize: null, floatDir: null,
    methodOption: 'transient',
    existingGallery: null,
    newWindow,
  };

  if (design === 'grid' || design === 'stacked') {
    return { ...base, 'square-thumbs': squareThumbs, 'thumbnails-per-row': thumbnailsPerRow };
  }

  const slideshowExtras = {
    autoplay, 'autoplay-duration': autoplayDuration, controls,
    'meta-position': metaPosition, 'show-meta-on-hover': false,
    thumbnails, 'thumbnail-strip-height': 200, 'thumbnail-strip-margin': 60,
    transparentBackground: false, 'square-thumbs': squareThumbs, 'thumbnails-per-row': thumbnailsPerRow,
  };

  if (design === 'slideshow') return { ...base, ...slideshowExtras };

  // slider
  return { ...base, ...slideshowExtras, 'active-alignment': activeAlignment };
}

module.exports = {
  ASPECT_RATIOS, LIGHTBOX_THEMES, DESIGNS,
  BASE_FIELDS, GRID_STACKED_FIELDS, SLIDESHOW_FIELDS, SLIDER_FIELDS,
  galleryBlockValue,
};

/**
 * ---- Populating a gallery with images — CONFIRMED via live capture ----
 *
 * A gallery block's images live in their own real backing collection, not
 * inline in the block value. Full pipeline (mirrors scripts/build-test-page.js
 * createGalleryCollection()/addImagesToGallery()):
 *
 * 1. CREATE the backing collection (write) — same no-`id`
 *    SaveCollectionSettings create trick used for blog/page collections:
 *    POST /api/commondata/SaveCollectionSettings
 *    Content-Type: application/json
 *    Body: {
 *      "collectionData": {
 *        "navigationTitle": "Gallery Block <random>", "title": "Gallery Block <random>",
 *        "description": { "html": "", "source": "" },
 *        "enabled": true, "deleted": false, "folder": false,
 *        "itemCount": 0, "isEmpty": true,
 *        "typeName": "gallery-block", "type": 6,
 *        "itemLimit": 20, "ordering": 1, "nextDisplayIndex": 0,
 *        "regionName": "default", "urlId": "<random>",
 *        "pagePermissionType": null, "calculatedItemCount": 0
 *      },
 *      "memberAreaData": { "memberAreaIds": [] }
 *    }
 *    Response's `id` (a real 24-char ObjectId) is what goes into the
 *    gallery block's `collectionId` AND `transientGalleryId` fields —
 *    they're the same value.
 *
 * 2. ADD each image (write, once per image) — a DIFFERENT endpoint from
 *    the page-content image pipeline in image-variants.js, and it wants
 *    the RAW media library asset id, not a block-ready referenced id:
 *    POST /api/galleries/<galleryCollectionId>/images/asset-reference
 *    Content-Type: application/x-www-form-urlencoded
 *    Body: assetId=<raw media asset id>&libraryId=<websiteId>&recordType=2&collectionId=<galleryCollectionId>
 *    Response: { "media": [ { "id": "<gallery image record id>", "collectionId": ..., "systemDataId": "<original raw assetId>", "filename": ..., "assetUrl": ..., "displayIndex": 0, "workflowState": 1, ... } ] }
 *
 * 3. Set both `collectionId` and `transientGalleryId` on the gallery block
 *    value (see BASE_FIELDS above) to the collection id from step 1.
 *
 * Not yet confirmed: whether `displayIndex` needs to be set explicitly for
 * ordering beyond the first image (each add in the capture used `0` since
 * only one image was added), or whether it's just server-assigned
 * incrementally per add.
 */
