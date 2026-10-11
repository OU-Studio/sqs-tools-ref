/**
 * Squarespace 7.1 — Button Block (type 1337, website.components.button) variants
 *
 * Base shape is BLOCKS.button in block-library.js. This documents the full
 * field range captured from four buttons covering every option.
 */

const BUTTON_ALIGNMENTS = ['left', 'center', 'right']; // no 'justify' seen — likely not a valid option for buttons
const BUTTON_SIZES = ['small', 'medium', 'large'];

// buttonLink was observed as BOTH null and "" across different "no link"
// buttons — treat these as equivalent unset states, not distinct meanings.
// A real link uses the three forms documented in link-targets.js:
//   "/about-us"        (internal page)
//   "https://..."       (external)
//   "/s/lbt.svg"        (uploaded file)

function buttonBlockValue({
  buttonText = 'Learn more',
  buttonLink = null,           // null | "" | a link string — see link-targets.js
  buttonAlignment = 'center',  // left | center | right
  buttonSize = 'medium',       // small | medium | large
  newWindow = false,           // true when linking externally or to a file, typically
  stretchedToFill = false,     // true = button fills full column width
} = {}) {
  return {
    buttonText, buttonLink, buttonAlignment, buttonSize, newWindow,
    containerStyles: { stretchedToFill },
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

module.exports = { BUTTON_ALIGNMENTS, BUTTON_SIZES, buttonBlockValue };
