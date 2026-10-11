/**
 * Squarespace 7.1 — Text Block Rich-Text Formatting Reference
 *
 * Captured from a live Text block containing one instance of every RTE
 * formatting option. All patterns operate on the block's `value.html`
 * (and matching `value.source`) string — EXCEPT text highlight, which also
 * requires an entry in `value.textAttributes` (see HIGHLIGHT_ATTRIBUTE below).
 *
 * General wrapper: every paragraph-level element carries
 *   style="white-space:pre-wrap;" data-rte-preserve-empty="true"
 * — keep this on every <p> you generate, or the editor may treat it oddly.
 */

const wrap = (tag, text, extra = '') =>
  `<${tag} style="white-space:pre-wrap;" data-rte-preserve-empty="true"${extra}>${text}</${tag}>`;

const PATTERNS = {
  heading1: (text) => wrap('h1', text),
  heading2: (text) => wrap('h2', text),
  heading3: (text) => wrap('h3', text),
  heading4: (text) => wrap('h4', text),

  paragraphLarge: (text) => `<p style="white-space:pre-wrap;" class="sqsrte-large" data-rte-preserve-empty="true">${text}</p>`,
  paragraph: (text) => wrap('p', text),
  paragraphSmall: (text) => `<p style="white-space:pre-wrap;" class="sqsrte-small" data-rte-preserve-empty="true">${text}</p>`,

  codeBlock: (text) => `<pre><code>${text}</code></pre>`,

  bold: (text) => wrap('p', `<strong>${text}</strong>`),
  italic: (text) => wrap('p', `<em>${text}</em>`),
  strikethrough: (text) => wrap('p', `<span style="text-decoration: line-through;">${text}</span>`),

  // Palette-relative colors — track the site's theme palette (see website-colors capture)
  textColorLightAccent: (text) => wrap('p', `<span class="sqsrte-text-color--lightAccent">${text}</span>`),
  textColorAccent: (text) => wrap('p', `<span class="sqsrte-text-color--accent">${text}</span>`),
  textColorWhite: (text) => wrap('p', `<span class="sqsrte-text-color--white">${text}</span>`),
  textColorDarkAccent: (text) => wrap('p', `<span class="sqsrte-text-color--darkAccent">${text}</span>`),
  textColorBlack: (text) => wrap('p', `<span class="sqsrte-text-color--black">${text}</span>`),
  // Custom color — fixed hex, ignores theme palette
  textColorCustom: (text, hex = '#F01D1D') =>
    wrap('p', `<span class="sqsrte-text-color--custom" style="color: ${hex};">${text}</span>`),

  // "Scaled text" — auto-shrinks/grows to fill its container width
  scaledText: (text) =>
    `<div class="sqsrte-scaled-text-container"><span class="sqsrte-scaled-text"><p style="white-space:pre-wrap;" data-rte-preserve-empty="true">${text}</p></span></div>`,

  // Text highlight — REQUIRES a matching entry in value.textAttributes (see helper below)
  highlight: (text, attributeId) =>
    wrap('p', `<span class="sqsrte-text-highlight" data-text-attribute-id="${attributeId}">${text}</span>`),

  link: (text, href) => wrap('p', `<a href="${href}">${text}</a>`),

  alignCenter: (text) => `<p style="text-align: center; ; white-space:pre-wrap;" data-rte-preserve-empty="true">${text}</p>`,
  alignRight: (text) => `<p style="text-align: right; ; white-space:pre-wrap;" data-rte-preserve-empty="true">${text}</p>`,
  alignJustify: (text) => `<p style="text-align: justify; ; white-space:pre-wrap;" data-rte-preserve-empty="true">${text}</p>`,
  // left align is the default — no style attribute needed

  blockquote: (text) => `<blockquote>${wrap('p', text)}</blockquote>`,

  bulletList: (items) =>
    `<ul data-rte-list="default">${items.map((i) => `<li>${wrap('p', i)}</li>`).join('')}</ul>`,
  numberedList: (items) =>
    `<ol data-rte-list="default">${items.map((i) => `<li>${wrap('p', i)}</li>`).join('')}</ol>`,

  // Indent level 1 = 40px; each further level adds another 40px (unconfirmed beyond level 1)
  indent: (text, level = 1) =>
    `<p data-indent="${level}" style="margin-left: ${40 * level}px; white-space:pre-wrap;" data-rte-preserve-empty="true">${text}</p>`,

  emptyParagraph: () => `<p style="white-space:pre-wrap;" data-rte-preserve-empty="true"></p>`,
};

/**
 * Build a highlight textAttribute entry. Generate a fresh id (crypto.randomUUID()
 * works in-browser) and reference the same id in PATTERNS.highlight().
 * This whole object goes into value.textAttributes: [ ...entries ].
 */
function makeHighlightAttribute(id, { color = '#C90000', thickness = 0.25 } = {}) {
  return {
    id,
    type: 'highlight',
    shape: 'underline',
    isFront: false,
    isAnimationEnabled: true,
    animation: 'draw',
    duration: 0.5,
    direction: 'right',
    color: {
      type: 'CUSTOM_COLOR',
      customColor: { userFormat: 'rgb', hslaValue: hexToHsla(color) },
    },
    thickness: { unit: 'em', value: thickness },
    linecap: 'square',
  };
}

function hexToHsla(hex) {
  // minimal hex->hsla helper matching the captured shape; good enough for common cases
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { hue: h, saturation: s, lightness: l, alpha: 1 };
}

/**
 * Compose a full text-block HTML string (and mirrored `source`) from an
 * array of already-rendered PATTERNS.* strings.
 */
function composeTextHtml(parts) {
  const html = parts.join('');
  return { html, source: html };
}

module.exports = { PATTERNS, makeHighlightAttribute, composeTextHtml };
