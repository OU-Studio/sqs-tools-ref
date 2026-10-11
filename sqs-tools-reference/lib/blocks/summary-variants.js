/**
 * Squarespace 7.1 — Summary Block (type 1337, website.components.summary) variants
 *
 * A "Summary" block pulls from an existing collection (blog, gallery,
 * portfolio, products, events) and lists/grids its items. `collectionId`
 * must point at a real collection — get one from commondata/GetCollections.
 *
 * This file covers the LIST design mode first (Joe's primary use case:
 * blog collections, ~99% of real usage). Other design modes (autogrid,
 * autocolumns, grid, etc.) to be added as captured.
 */

// Confirmed: unlike Gallery, imageAspectRatio is a DECIMAL RATIO STRING
// (width/height) or the literal "Auto" — not a named preset.
// Rough mapping to Gallery's named presets, inferred from the numbers:
//   "Auto"    -> natural image ratio, no crop
//   "1"        -> square            (1:1)
//   "1.5"      -> standard          (3:2)   [CONFIRMED]
//   "0.6667"   -> standard-vertical (2:3)   [CONFIRMED]
//   "1.3333"   -> four-three        (4:3)   [inferred, not yet captured]
//   "0.75"     -> three-four-vertical (3:4) [inferred, not yet captured]
//   "1.78"     -> widescreen        (16:9)  [inferred, not yet captured]
//   "2.4"      -> anamorphic-widescreen     [CONFIRMED]
const IMAGE_ASPECT_RATIOS = {
  auto: 'Auto',
  square: '1',           // unconfirmed exact string Squarespace uses
  standard: '1.5',       // confirmed
  standardVertical: '0.6667', // confirmed
  fourThree: '1.3333',   // unconfirmed
  threeFourVertical: '0.75', // unconfirmed
  widescreen: '1.78',    // unconfirmed
  anamorphicWidescreen: '2.4', // confirmed
};

const LIST_IMAGE_ALIGNMENTS = ['left', 'right']; // 'right' unconfirmed, per Joe's description
const TEXT_SIZES = ['small', 'medium', 'large', 'extralarge']; // only 'medium' confirmed so far — key name for extralarge unverified
const TEXT_ALIGNMENTS = ['left', 'center', 'right']; // only 'left' confirmed so far
const METADATA_POSITIONS = ['above-title', 'below-title', 'below-content']; // only 'below-content' confirmed
// primaryMetadata / secondaryMetadata confirmed values: 'date', 'cats' (categories), 'tags', 'author', 'location', 'comments'
// likely also 'none' (per block-library.js default) — this now appears to be the full enum
const METADATA_OPTIONS = ['date', 'cats', 'tags', 'author', 'location', 'comments', 'none'];

// GRID design mode ranges (Joe's description, confirmed via capture):
const GRID_COLUMN_WIDTH_RANGE = { min: 50, max: 600 }; // px
const GRID_GUTTER_RANGE = { min: 0, max: 100 };         // px

// CAROUSEL design mode: slidesPerRow confirmed at 1 and 5 — likely range 1-5,
// unconfirmed upper/lower bounds beyond those two data points.
const CAROUSEL_SLIDES_PER_ROW_OBSERVED = [1, 5];


/**
 * LIST design mode — confirmed field shape.
 */
function summaryListValue({
  collectionId,               // real collection id — required
  pageSize = 30,               // 1–30 per Joe's description
  listImageSize = 80,          // 10–80 per Joe's description
  listImageAlignment = 'left', // 'left' | 'right'
  imageAspectRatio = 'Auto',   // 'Auto' or a decimal ratio string — see IMAGE_ASPECT_RATIOS
  textSize = 'medium',
  textAlignment = 'left',
  metadataPosition = 'below-content',
  primaryMetadata = 'date',
  secondaryMetadata = 'cats',
  showTitle = true,
  showThumbnail = true,
  showExcerpt = true,
  showReadMoreLink = false,
  headerText = '',
} = {}) {
  return {
    collectionId, collectionType: 1, // 1 = blog collection
    design: 'list',
    autoCrop: true,
    columnWidth: 270,
    gutter: 60,
    headerText,
    imageAspectRatio,
    lightbox: false,
    listImageAlignment,
    listImageSize,
    metadataPosition,
    mixedContent: true,
    pageSize,
    primaryMetadata,
    secondaryMetadata,
    productQuickViewEnabled: false,
    showExcerpt,
    showPastOrUpcomingEvents: 'upcoming',
    showPrice: true,
    showReadMoreLink,
    showThumbnail,
    showTitle,
    slidesPerRow: 3, // irrelevant to list mode, carried over from defaults
    textAlignment,
    textSize,
    containerStyles: {
      backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' },
      stroke: { style: 'none', color: { type: 'SITE_PALETTE_COLOR', sitePaletteColor: { colorName: 'black', alphaModifier: 1 } }, thickness: { value: 2, unit: 'px' } },
      padding: { top: { value: 6, unit: '%' }, bottom: { value: 6, unit: '%' }, left: { value: 6, unit: '%' }, right: { value: 6, unit: '%' } },
      blendMode: 'normal',
      blur: { enabled: false, filterType: 'backdrop', blurRadius: { value: 15, unit: 'px' } },
      borderRadii: { topLeft: { value: 0, unit: 'px' }, topRight: { value: 0, unit: 'px' }, bottomLeft: { value: 0, unit: 'px' }, bottomRight: { value: 0, unit: 'px' } },
    },
    filter: { tag: null, category: null },
    animations: [], breakpointOverrides: {},
    transforms: {
      rotation: { z: { value: 0, unit: 'deg' } },
      scale: { x: { value: 100, unit: '%' }, y: { value: 100, unit: '%' } },
      opacity: { value: 100, unit: '%' },
      offset: { x: { value: 0, unit: 'px' }, y: { value: 0, unit: 'px' } },
      origin: { x: { value: 50, unit: '%' }, y: { value: 50, unit: '%' } },
      skew: { x: { value: 0, unit: 'deg' }, y: { value: 0, unit: 'deg' } },
    },
    hSize: null, floatDir: null,
  };
}

/**
 * GRID design mode (design: "autogrid" in the raw JSON — this is what the
 * editor UI labels "Grid"). Same field set as list, but columnWidth/gutter
 * become the meaningful sizing controls instead of listImageSize/listImageAlignment.
 */
function summaryGridValue({
  collectionId,
  pageSize = 30,
  columnWidth = 220,           // 50–600px, confirmed range
  gutter = 60,                 // 0–100px, confirmed range
  imageAspectRatio = 'Auto',
  textSize = 'medium',
  textAlignment = 'left',
  metadataPosition = 'below-content',
  primaryMetadata = 'date',
  secondaryMetadata = 'cats',
  showTitle = true,
  showThumbnail = true,
  showExcerpt = true,
  showReadMoreLink = false,
  headerText = '',
} = {}) {
  return {
    ...summaryListValue({
      collectionId, pageSize, imageAspectRatio, textSize, textAlignment,
      metadataPosition, primaryMetadata, secondaryMetadata,
      showTitle, showThumbnail, showExcerpt, showReadMoreLink, headerText,
    }),
    design: 'autogrid',
    columnWidth,
    gutter,
    // listImageSize/listImageAlignment carried over from list defaults but not meaningful in grid mode
  };
}

/**
 * CAROUSEL design mode. Same field set as grid, but slidesPerRow is the
 * defining control (how many items visible at once in the carousel).
 * headerText is confirmed functional here — shows a title above the block.
 */
function summaryCarouselValue({
  collectionId,
  pageSize = 30,
  columnWidth = 600,
  gutter = 100,
  slidesPerRow = 3,             // confirmed working at 1 and 5
  imageAspectRatio = 'Auto',
  textSize = 'medium',
  textAlignment = 'left',
  metadataPosition = 'below-content',
  primaryMetadata = 'date',
  secondaryMetadata = 'cats',
  showTitle = true,
  showThumbnail = true,
  showExcerpt = true,
  showReadMoreLink = false,
  headerText = '',
} = {}) {
  return {
    ...summaryGridValue({
      collectionId, pageSize, columnWidth, gutter, imageAspectRatio, textSize,
      textAlignment, metadataPosition, primaryMetadata, secondaryMetadata,
      showTitle, showThumbnail, showExcerpt, showReadMoreLink, headerText,
    }),
    design: 'carousel',
    slidesPerRow,
  };
}

/**
 * AUTOCOLUMNS design mode — this is what BLOCKS.summary's default in
 * block-library.js already used. Same field set as grid (columnWidth/gutter
 * are the meaningful sizing controls); confirmed distinct from 'autogrid'
 * as its own design value even though the fields overlap.
 */
function summaryAutocolumnsValue({
  collectionId,
  pageSize = 30,
  columnWidth = 270,
  gutter = 60,
  imageAspectRatio = 'Auto',
  textSize = 'medium',
  textAlignment = 'left',
  metadataPosition = 'below-content',
  primaryMetadata = 'date',
  secondaryMetadata = 'cats',
  showTitle = true,
  showThumbnail = true,
  showExcerpt = true,
  showReadMoreLink = false,
  headerText = '',
} = {}) {
  return {
    ...summaryGridValue({
      collectionId, pageSize, columnWidth, gutter, imageAspectRatio, textSize,
      textAlignment, metadataPosition, primaryMetadata, secondaryMetadata,
      showTitle, showThumbnail, showExcerpt, showReadMoreLink, headerText,
    }),
    design: 'autocolumns',
  };
}

module.exports = {
  IMAGE_ASPECT_RATIOS, LIST_IMAGE_ALIGNMENTS, TEXT_SIZES, TEXT_ALIGNMENTS, METADATA_POSITIONS, METADATA_OPTIONS,
  GRID_COLUMN_WIDTH_RANGE, GRID_GUTTER_RANGE, CAROUSEL_SLIDES_PER_ROW_OBSERVED,
  summaryListValue, summaryGridValue, summaryCarouselValue, summaryAutocolumnsValue,
};

