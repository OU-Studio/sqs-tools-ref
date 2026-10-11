/**
 * sqs-builder — turns a small page SPEC into the full Squarespace section/block
 * JSON, validates it, and (in the browser console) writes it to a new page.
 *
 * The model (Haiku/Sonnet/local) only ever writes the SPEC. This file owns the
 * parts that fail silently if wrong: 24-char hex ids, span sums, enum values,
 * block shapes, the region-id swap, and the preview-before-commit step.
 *
 *   Node (offline, no writes):   const B = require('./page-builder.js'); B.build(spec)
 *   Browser console (live site): await SQSPage.preview(spec); await SQSPage.commit();
 *
 * Block shapes below are copied from lib/blocks/block-library.js and
 * scripts/build-test-page.js (the confirmed end-to-end write).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SQSPage = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ---------- allowed values (single source of truth: validator + model guide) ----------
  const ENUMS = {
    height: { small: 'section-height--small', medium: 'section-height--medium', large: 'section-height--large' },
    width: { narrow: 'content-width--narrow', medium: 'content-width--medium', wide: 'content-width--wide' },
    background: { 'full-bleed': 'background-width--full-bleed', inset: 'background-width--inset' },
    align: { left: 'horizontal-alignment--left', center: 'horizontal-alignment--center' },
    valign: { top: 'vertical-alignment--top', middle: 'vertical-alignment--middle', bottom: 'vertical-alignment--bottom' },
    theme: { none: '', white: 'white', 'white-bold': 'white-bold', light: 'light', 'light-bold': 'light-bold',
             bright: 'bright', 'bright-inverse': 'bright-inverse', dark: 'dark', 'dark-bold': 'dark-bold',
             black: 'black', 'black-bold': 'black-bold' },
    textAlign: ['left', 'center', 'right'],
    buttonSize: ['small', 'medium', 'large'],
    imageLayout: ['inline', 'poster', 'card', 'overlap', 'collage', 'stack'],
  };

  const SOCIAL = { facebook: { serviceId: 60, name: 'Facebook', url: 'http://facebook.com', serviceName: 'facebook-unauth' }, instagram: { serviceId: 64, name: 'Instagram', url: 'http://instagram.com', serviceName: 'instagram-unauth' } };
  const BLOG_LAYOUTS = ['masonry', 'side-by-side'];
  const BLOCK_KINDS = {
    heading: { required: ['text'], optional: ['level', 'align'] },
    text:    { required: ['paragraphs'], optional: ['align'] },
    code:    { required: ['html'], optional: [] },
    button:  { required: ['text'], optional: ['link', 'align', 'size'] },
    spacer:  { required: [], optional: ['size'] },
    image:   { required: [], optional: ['imageId', 'layout', 'title', 'subtitle'] },
    gallery: { required: [], optional: ['collectionId', 'count'] },
    quote:      { required: ['quote'], optional: ['source'] },
    line:       { required: [], optional: [] },
    accordion:  { required: ['items'], optional: ['open', 'multiple'] },
    scrolling:  { required: ['items'], optional: ['speed', 'direction'] },
    markdown:   { required: ['markdown'], optional: [] },
    embed:      { required: ['url'], optional: [] },
    video:      { required: ['url'], optional: ['autoplay', 'loop', 'muted'] },
    map:        { required: ['lat', 'lng'], optional: ['zoom', 'height'] },
    form:       { required: [], optional: ['align', 'name', 'email', 'button', 'message', 'formId'] },
    newsletter: { required: [], optional: ['title', 'description', 'button', 'disclaimer'] },
    social:     { required: [], optional: ['align', 'size', 'networks', 'urls', 'accounts'] },
    summary: { required: ['source'], optional: ['design', 'ratio', 'show', 'count', 'columnWidth', 'gutter', 'header', 'align'] },
  };

  // Summary block option maps. 'ratio' strings follow summary-variants.js (decimal strings; '1' for 1:1 is the
  // one still marked unconfirmed there - the first live Summary test confirms it).
  const TEXT_COLORS = ['accent', 'lightAccent', 'darkAccent', 'white', 'black'];
  const SUMMARY = {
    design: { grid: 'autogrid', list: 'list', carousel: 'carousel', columns: 'autocolumns' },
    ratio: { auto: 'Auto', '1:1': '1', '3:2': '1.5', '2:3': '0.6667', '4:3': '1.3333', '3:4': '0.75', '16:9': '1.78', '2.4:1': '2.4' },
    show: ['title', 'thumbnail', 'excerpt', 'readMore', 'date', 'categories'],
  };

  // ---------- ids ----------
  // Real ids are 24-char lowercase hex ObjectIds. Any other shape/length = silent empty-body 400.
  function randomId() {
    const c = 'abcdef0123456789'; let s = '';
    for (let i = 0; i < 24; i++) s += c[Math.floor(Math.random() * 16)];
    return s;
  }

  // ---------- validation ----------
  function validate(spec) {
    const errs = [];
    const err = (path, msg) => errs.push(`${path}: ${msg}`);
    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    const checkKeys = (path, o, allowed) => Object.keys(o).forEach((k) => { if (!allowed.includes(k)) err(path, `unknown key "${k}" (allowed: ${allowed.join(', ')})`); });

    if (!isObj(spec)) return ['spec: must be an object'];
    if (spec.blog !== undefined) return validateBlog();
    if (spec.post !== undefined) return validatePost();
    checkKeys('spec', spec, ['title', 'sections']);
    if (typeof spec.title !== 'string' || !spec.title.trim()) err('spec.title', 'required non-empty string');
    if (!Array.isArray(spec.sections) || !spec.sections.length) { err('spec.sections', 'required non-empty array'); return errs; }

    spec.sections.forEach((sec, si) => {
      const sp = `sections[${si}]`;
      if (!isObj(sec)) return err(sp, 'must be an object');
      checkKeys(sp, sec, ['height', 'width', 'background', 'align', 'valign', 'theme', 'backgroundImage', 'backgroundImageId', 'blocks', 'rows']);
      if (sec.backgroundImage !== undefined && typeof sec.backgroundImage !== 'boolean') err(`${sp}.backgroundImage`, 'true or false (true = use the placeholder image)');
      for (const k of ['height', 'width', 'background', 'align', 'valign', 'theme']) {
        if (sec[k] !== undefined && !(sec[k] in ENUMS[k])) err(`${sp}.${k}`, `"${sec[k]}" not one of: ${Object.keys(ENUMS[k]).join(', ')}`);
      }
      if ((sec.blocks === undefined) === (sec.rows === undefined)) return err(sp, 'give exactly one of "blocks" (single full-width row) or "rows"');
      const rows = sec.rows || [[{ span: 12, blocks: sec.blocks }]];
      if (!Array.isArray(rows)) return err(`${sp}.rows`, 'must be an array of rows');
      rows.forEach((row, ri) => {
        const rp = `${sp}.rows[${ri}]`;
        if (!Array.isArray(row) || !row.length) return err(rp, 'a row is a non-empty array of columns');
        let total = 0;
        row.forEach((col, ci) => {
          const cp = `${rp}[${ci}]`;
          if (!isObj(col)) return err(cp, 'column must be an object {span, blocks}');
          checkKeys(cp, col, ['span', 'blocks']);
          if (!Number.isInteger(col.span) || col.span < 1 || col.span > 12) err(`${cp}.span`, 'integer 1-12');
          else total += col.span;
          if (!Array.isArray(col.blocks)) return err(`${cp}.blocks`, 'array required (can be empty)');
          col.blocks.forEach((b, bi) => validateBlock(`${cp}.blocks[${bi}]`, b));
        });
        if (total !== 12) err(rp, `column spans sum to ${total}, must be 12`);
      });
    });
    return errs;

    function validateBlog() {
      checkKeys('spec', spec, ['blog']);
      const bl = spec.blog;
      if (!isObj(bl)) { err('spec.blog', 'must be an object'); return errs; }
      checkKeys('blog', bl, ['title', 'layout', 'posts']);
      if (typeof bl.title !== 'string' || !bl.title.trim()) err('blog.title', 'required non-empty string');
      if (bl.layout !== undefined && !BLOG_LAYOUTS.includes(bl.layout)) err('blog.layout', 'one of: ' + BLOG_LAYOUTS.join(', '));
      if (!Array.isArray(bl.posts) || !bl.posts.length) { err('blog.posts', 'required non-empty array of posts'); return errs; }
      bl.posts.forEach((p, i) => {
        if (!isObj(p)) return err(`blog.posts[${i}]`, 'must be an object');
        validate({ post: { blog: '/x', ...p } }).forEach((e) => errs.push(e.replace(/^post/, `blog.posts[${i}]`)));
      });
      return errs;
    }

    function validatePost() {
      checkKeys('spec', spec, ['post']);
      const p = spec.post;
      if (!isObj(p)) { err('spec.post', 'must be an object'); return errs; }
      checkKeys('post', p, ['blog', 'title', 'tags', 'categories', 'excerpt', 'draft', 'thumbnail', 'blocks', 'rows']);
      if (!(typeof p.blog === 'string' && (/^\/[^\s]*$/.test(p.blog) || /^[0-9a-f]{24}$/.test(p.blog)))) err('post.blog', 'the blog url path like "/the-stack" (or a 24-char hex id)');
      if (typeof p.title !== 'string' || !p.title.trim()) err('post.title', 'required non-empty string');
      ['tags', 'categories'].forEach((k) => { if (p[k] !== undefined && !(Array.isArray(p[k]) && p[k].every((x) => typeof x === 'string' && x.trim()))) err(`post.${k}`, 'array of strings'); });
      if (p.excerpt !== undefined && typeof p.excerpt !== 'string') err('post.excerpt', 'string');
      if (p.draft !== undefined && typeof p.draft !== 'boolean') err('post.draft', 'true or false');
      if (p.thumbnail !== undefined && typeof p.thumbnail !== 'boolean') err('post.thumbnail', 'true or false (true = use the placeholder image)');
      if ((p.blocks === undefined) === (p.rows === undefined)) { err('post', 'give exactly one of "blocks" (single full-width row) or "rows"'); return errs; }
      validate({ title: 'x', sections: [p.rows ? { rows: p.rows } : { blocks: p.blocks }] }).forEach((e) => errs.push(e.replace('sections[0]', 'post')));
      return errs;
    }

    function validateParagraph(path, p) {
      if (typeof p === 'string') return;
      if (!isObj(p)) return err(path, 'a string, or an object like {"text":..} / {"bullets":[..]}');
      checkKeys(path, p, ['text', 'bullets', 'numbered', 'quote', 'size', 'color', 'align', 'indent', 'highlight', 'scaled']);
      const kinds = ['text', 'bullets', 'numbered', 'quote'].filter((k) => p[k] !== undefined);
      if (kinds.length !== 1) return err(path, 'give exactly one of text, bullets, numbered, quote');
      if (p.text !== undefined && typeof p.text !== 'string') err(`${path}.text`, 'string');
      if (p.quote !== undefined && typeof p.quote !== 'string') err(`${path}.quote`, 'string');
      ['bullets', 'numbered'].forEach((k) => { if (p[k] !== undefined && !(Array.isArray(p[k]) && p[k].every((x) => typeof x === 'string'))) err(`${path}.${k}`, 'array of strings'); });
      if (p.size !== undefined && !['large', 'small'].includes(p.size)) err(`${path}.size`, 'large or small');
      if (p.color !== undefined && !(TEXT_COLORS.includes(p.color) || /^#[0-9a-fA-F]{6}$/.test(p.color))) err(`${path}.color`, `one of ${TEXT_COLORS.join(', ')} or a #rrggbb hex`);
      if (p.align !== undefined && !['left', 'center', 'right', 'justify'].includes(p.align)) err(`${path}.align`, 'left, center, right or justify');
      if (p.indent !== undefined && !(Number.isInteger(p.indent) && p.indent >= 1 && p.indent <= 6)) err(`${path}.indent`, 'integer 1-6');
      ['highlight', 'scaled'].forEach((k) => { if (p[k] !== undefined && typeof p[k] !== 'boolean') err(`${path}.${k}`, 'true or false'); });
    }

    function validateBlock(path, b) {
      if (!isObj(b)) return err(path, 'block must be an object');
      const def = BLOCK_KINDS[b.type];
      if (!def) return err(`${path}.type`, `"${b.type}" not one of: ${Object.keys(BLOCK_KINDS).join(', ')}`);
      checkKeys(path, b, ['type', ...def.required, ...def.optional]);
      def.required.forEach((k) => { if (b[k] === undefined) err(`${path}.${k}`, 'required'); });
      if (b.level !== undefined && ![1, 2, 3, 4].includes(b.level)) err(`${path}.level`, 'one of 1,2,3,4');
      if (b.align !== undefined && !ENUMS.textAlign.includes(b.align)) err(`${path}.align`, `one of ${ENUMS.textAlign.join(', ')}`);
      if (b.size !== undefined && b.type === 'button' && !ENUMS.buttonSize.includes(b.size)) err(`${path}.size`, `one of ${ENUMS.buttonSize.join(', ')}`);
      if (b.size !== undefined && b.type === 'spacer' && !(Number.isInteger(b.size) && b.size >= 1 && b.size <= 20)) err(`${path}.size`, 'integer 1-20');
      if (b.layout !== undefined && !ENUMS.imageLayout.includes(b.layout)) err(`${path}.layout`, `one of ${ENUMS.imageLayout.join(', ')}`);
      if (b.type === 'text') {
        if (!Array.isArray(b.paragraphs)) err(`${path}.paragraphs`, 'array');
        else b.paragraphs.forEach((p, pi) => validateParagraph(`${path}.paragraphs[${pi}]`, p));
      }
      if (b.type === 'code' && typeof b.html !== 'string') err(`${path}.html`, 'string of HTML/code');
      if (b.type === 'gallery' && b.count !== undefined && !(Number.isInteger(b.count) && b.count >= 1 && b.count <= 30)) err(`${path}.count`, 'integer 1-30');
      if (b.imageId !== undefined && !/^[0-9a-f]{24}$/.test(b.imageId)) err(`${path}.imageId`, 'must be a 24-char hex id from the media library pipeline');
      if (b.collectionId !== undefined && !/^[0-9a-f]{24}$/.test(b.collectionId)) err(`${path}.collectionId`, 'must be a 24-char hex id');
      const isUrl = (u) => typeof u === 'string' && /^https?:\/\/\S+$/.test(u);
      if (b.type === 'quote') { if (typeof b.quote !== 'string') err(`${path}.quote`, 'string'); if (b.source !== undefined && typeof b.source !== 'string') err(`${path}.source`, 'string'); }
      if (b.type === 'accordion') {
        if (!(Array.isArray(b.items) && b.items.length && b.items.every((i) => isObj(i) && typeof i.title === 'string' && (i.description === undefined || typeof i.description === 'string')))) err(`${path}.items`, 'non-empty array of {"title": str, "description": str}');
        ['open', 'multiple'].forEach((k) => { if (b[k] !== undefined && typeof b[k] !== 'boolean') err(`${path}.${k}`, 'true or false'); });
      }
      if (b.type === 'scrolling') {
        if (!(Array.isArray(b.items) && b.items.length && b.items.every((i) => typeof i === 'string'))) err(`${path}.items`, 'non-empty array of strings');
        if (b.speed !== undefined && !(typeof b.speed === 'number' && b.speed >= 0.1 && b.speed <= 10)) err(`${path}.speed`, 'number 0.1-10');
        if (b.direction !== undefined && !['left', 'right'].includes(b.direction)) err(`${path}.direction`, 'left or right');
      }
      if (b.type === 'markdown' && typeof b.markdown !== 'string') err(`${path}.markdown`, 'string');
      if ((b.type === 'embed' || b.type === 'video') && !isUrl(b.url)) err(`${path}.url`, 'a full http(s) url');
      if (b.type === 'video') ['autoplay', 'loop', 'muted'].forEach((k) => { if (b[k] !== undefined && typeof b[k] !== 'boolean') err(`${path}.${k}`, 'true or false'); });
      if (b.type === 'map') {
        if (!(typeof b.lat === 'number' && b.lat >= -90 && b.lat <= 90)) err(`${path}.lat`, 'number -90..90');
        if (!(typeof b.lng === 'number' && b.lng >= -180 && b.lng <= 180)) err(`${path}.lng`, 'number -180..180');
        if (b.zoom !== undefined && !(Number.isInteger(b.zoom) && b.zoom >= 1 && b.zoom <= 20)) err(`${path}.zoom`, 'integer 1-20');
        if (b.height !== undefined && !(Number.isInteger(b.height) && b.height >= 1 && b.height <= 30)) err(`${path}.height`, 'integer 1-30');
      }
      if (b.type === 'form' && b.align !== undefined && !ENUMS.textAlign.includes(b.align)) err(`${path}.align`, 'left, center or right');
      if (b.type === 'social' && b.networks !== undefined && !(Array.isArray(b.networks) && b.networks.every((n) => SOCIAL[n]))) err(`${path}.networks`, 'array of: ' + Object.keys(SOCIAL).join(', '));
      if (b.type === 'social' && b.size !== undefined && !ENUMS.buttonSize.includes(b.size)) err(`${path}.size`, 'small, medium or large');
      if (b.type === 'newsletter') ['title', 'description', 'button', 'disclaimer'].forEach((k) => { if (b[k] !== undefined && typeof b[k] !== 'string') err(`${path}.${k}`, 'string'); });
      if (b.type === 'summary') {
        if (!(typeof b.source === 'string' && (/^\/[^\s]*$/.test(b.source) || /^[0-9a-f]{24}$/.test(b.source)))) err(`${path}.source`, 'a collection url path like "/the-stack" or a 24-char hex collection id');
        if (b.design !== undefined && !(b.design in SUMMARY.design)) err(`${path}.design`, `one of ${Object.keys(SUMMARY.design).join(', ')}`);
        if (b.ratio !== undefined && !(b.ratio in SUMMARY.ratio)) err(`${path}.ratio`, `one of ${Object.keys(SUMMARY.ratio).join(', ')}`);
        if (b.show !== undefined && !(Array.isArray(b.show) && b.show.every((x) => SUMMARY.show.includes(x)))) err(`${path}.show`, `array of: ${SUMMARY.show.join(', ')}`);
        if (b.count !== undefined && !(Number.isInteger(b.count) && b.count >= 1 && b.count <= 30)) err(`${path}.count`, 'integer 1-30');
        if (b.columnWidth !== undefined && !(Number.isInteger(b.columnWidth) && b.columnWidth >= 50 && b.columnWidth <= 600)) err(`${path}.columnWidth`, 'integer 50-600');
        if (b.gutter !== undefined && !(Number.isInteger(b.gutter) && b.gutter >= 0 && b.gutter <= 100)) err(`${path}.gutter`, 'integer 0-100');
        if (b.header !== undefined && typeof b.header !== 'string') err(`${path}.header`, 'string');
      }
    }
  }

  // ---------- block builders ----------
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const alignCss = (a) => (a === 'center' ? 'text-align: center; ' : a === 'right' ? 'text-align: right; ' : '');
  const TRANSFORMS = { offset: { x: { unit: 'px', value: 0 }, y: { unit: 'px', value: 0 } }, opacity: { unit: '%', value: 100 }, origin: { x: { unit: '%', value: 50 }, y: { unit: '%', value: 50 } }, rotation: { z: { unit: 'deg', value: 0 } }, scale: { x: { unit: '%', value: 100 }, y: { unit: '%', value: 100 } }, skew: { x: { unit: 'deg', value: 0 }, y: { unit: 'deg', value: 0 } } };
  const RADII = { topLeft: { unit: 'px', value: 0 }, topRight: { unit: 'px', value: 0 }, bottomLeft: { unit: 'px', value: 0 }, bottomRight: { unit: 'px', value: 0 } };

  // ---- rich text: tiny inline markup + paragraph objects -> Squarespace RTE html (patterns from lib/blocks/text-formatting.js) ----
  const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  function inline(str) {
    let t = esc(str);
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => `<a href="${href.replace(/"/g, '&quot;')}">${label}</a>`);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    t = t.replace(/~~([^~]+)~~/g, '<span style="text-decoration: line-through;">$1</span>');
    return t;
  }
  function hexToHsla(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, sat = 0; const l = (max + min) / 2;
    if (max !== min) { const d = max - min; sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return { hue: h, saturation: sat, lightness: l, alpha: 1 };
  }
  function richText(b) {
    const attrs = [];
    const PRE = 'style="white-space:pre-wrap;" data-rte-preserve-empty="true"';
    const html = b.paragraphs.map((p) => {
      if (typeof p === 'string') return `<p style="${alignCss(b.align)}white-space:pre-wrap;" data-rte-preserve-empty="true">${inline(p)}</p>`;
      if (p.bullets) return `<ul data-rte-list="default">${p.bullets.map((i) => `<li><p ${PRE}>${inline(i)}</p></li>`).join('')}</ul>`;
      if (p.numbered) return `<ol data-rte-list="default">${p.numbered.map((i) => `<li><p ${PRE}>${inline(i)}</p></li>`).join('')}</ol>`;
      if (p.quote !== undefined) return `<blockquote><p ${PRE}>${inline(p.quote)}</p></blockquote>`;
      let inner = inline(p.text);
      if (p.color) inner = TEXT_COLORS.includes(p.color) ? `<span class="sqsrte-text-color--${p.color}">${inner}</span>` : `<span class="sqsrte-text-color--custom" style="color: ${p.color};">${inner}</span>`;
      if (p.highlight) {
        const id = uuid();
        attrs.push({ id, type: 'highlight', shape: 'underline', isFront: false, isAnimationEnabled: true, animation: 'draw', duration: 0.5, direction: 'right',
          color: { type: 'CUSTOM_COLOR', customColor: { userFormat: 'rgb', hslaValue: hexToHsla('#C90000') } }, thickness: { unit: 'em', value: 0.25 }, linecap: 'square' });
        inner = `<span class="sqsrte-text-highlight" data-text-attribute-id="${id}">${inner}</span>`;
      }
      const al = p.align || b.align;
      const cls = p.size === 'large' ? ' class="sqsrte-large"' : p.size === 'small' ? ' class="sqsrte-small"' : '';
      const indent = p.indent ? ` data-indent="${p.indent}"` : '';
      const margin = p.indent ? `margin-left: ${40 * p.indent}px; ` : '';
      const alignStyle = al === 'justify' ? 'text-align: justify; ' : alignCss(al);
      const para = `<p${cls}${indent} style="${alignStyle}${margin}white-space:pre-wrap;" data-rte-preserve-empty="true">${inner}</p>`;
      return p.scaled ? `<div class="sqsrte-scaled-text-container"><span class="sqsrte-scaled-text">${para}</span></div>` : para;
    }).join('');
    return { html, attrs };
  }

  function textValue(html, attrs) {
    return {
      engine: 'wysiwyg', html, source: html, textAttributes: attrs || [],
      containerStyles: {
        backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: RADII,
        padding: { top: { unit: '%', value: 6 }, right: { unit: '%', value: 6 }, bottom: { unit: '%', value: 6 }, left: { unit: '%', value: 6 } },
        stretchedToFill: false,
        stroke: { style: 'none', color: { type: 'SITE_PALETTE_COLOR', sitePaletteColor: { colorName: 'black', alphaModifier: 1 } }, thickness: { unit: 'px', value: 2 } },
        blendMode: 'normal', blur: { enabled: false, filterType: 'backdrop', blurRadius: { unit: 'px', value: 15 } },
      },
      animations: [], breakpointOverrides: [], transforms: TRANSFORMS, hSize: null, floatDir: null,
    };
  }
  const caption = (t) => ({ engine: 'wysiwyg', source: '', html: t ? `<p class="" style="white-space:pre-wrap;">${esc(t)}</p>` : '' });

  const px = (v) => ({ unit: 'px', value: v });
  // containerStyles as captured on the periodic blocks (see block-library.js)
  function cStyles({ radius = 0, pad, thickness = 6, stretched } = {}) {
    const [v, h] = pad || [6, 6]; const r = px(radius);
    const o = { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' }, borderRadii: { topLeft: r, topRight: r, bottomLeft: r, bottomRight: r },
      padding: { top: { unit: '%', value: v }, right: { unit: '%', value: h }, bottom: { unit: '%', value: v }, left: { unit: '%', value: h } },
      stroke: { style: 'none', color: { type: 'THEME_COLOR' }, thickness: px(thickness) } };
    if (stretched !== undefined) o.stretchedToFill = stretched;
    return o;
  }
  // Minimal markdown -> html for the Markdown block (headings, paragraphs, lists, quotes, inline markup).
  function mdToHtml(md) {
    const out = []; let para = [], list = null;
    const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
    const flushL = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null; } };
    for (const raw of md.replace(/\r/g, '').split('\n')) {
      const l = raw.trimEnd(); let m;
      if (!l.trim()) { flushP(); flushL(); continue; }
      if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { flushP(); flushL(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
      if ((m = l.match(/^\s*[-*]\s+(.*)$/))) { flushP(); if (!list || list.t !== 'ul') { flushL(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); continue; }
      if ((m = l.match(/^\s*\d+\.\s+(.*)$/))) { flushP(); if (!list || list.t !== 'ol') { flushL(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); continue; }
      if ((m = l.match(/^>\s?(.*)$/))) { flushP(); flushL(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
      flushL(); para.push(l.trim());
    }
    flushP(); flushL(); return out.join('');
  }

  const BUILDERS = {
    heading: (b) => ({ type: 1337, definitionName: 'website.components.html',
      value: textValue(`<h${b.level || 2} style="${alignCss(b.align)}white-space:pre-wrap;" data-rte-preserve-empty="true">${esc(b.text)}</h${b.level || 2}>`) }),
    text: (b) => { const r = richText(b); return { type: 1337, definitionName: 'website.components.html', value: textValue(r.html, r.attrs) }; },
    code: (b) => ({ type: 1337, definitionName: 'website.components.code',
      value: { html: b.html, wysiwyg: { engine: 'code', isSource: false, mode: 'htmlmixed', source: b.html },
        animations: [], breakpointOverrides: [], transforms: TRANSFORMS, hSize: null, floatDir: null } }),
    button: (b) => ({ type: 1337, definitionName: 'website.components.button',
      value: { buttonText: b.text, buttonLink: b.link || null, buttonAlignment: b.align || 'center', buttonSize: b.size || 'medium',
        newWindow: false, containerStyles: { stretchedToFill: false }, animations: [], breakpointOverrides: [], transforms: TRANSFORMS, hSize: null, floatDir: null } }),
    spacer: (b) => ({ type: 1337, definitionName: 'website.components.spacer',
      value: { aspectRatio: null, vSize: b.size || 1, hSize: null, floatDir: null } }),
    image: (b) => ({ type: 5, value: {
      imageId: b.imageId || (() => { throw new Error('Image block has no imageId (the placeholder image is applied at build time in the extension).'); })(), linkTo: '', newwindow: false, imageLink: 'none', buttonText: '', lightbox: false, lightboxTheme: 'dark',
      combinationAnimation: 'site-default', individualImageAnimation: 'site-default', individualTextAnimation: 'site-default',
      aspectRatio: null, layout: 'caption-below', stretch: false,
      description: caption(''), title: caption(b.title), subtitle: caption(b.subtitle),
      designLayout: b.layout || 'inline', imagePosition: 'left', mapping: null, imageCropType: 'css_styles', imageMask: 'circle',
      borderRadii: RADII, imageOverlay: { enabled: false, color: { type: 'THEME_COLOR' }, blendMode: 'normal' }, imageEffect: { type: 'none' },
      floatDir: null, hSize: null, containerStyles: { backgroundEnabled: false, stretchedToFill: false } } }),
    quote: (b) => ({ type: 1337, definitionName: 'website.components.quote', value: { quote: b.quote, source: b.source || '', containerStyles: cStyles(), animations: [], breakpointOverrides: [], transforms: TRANSFORMS, hSize: null, floatDir: null } }),
    line: () => ({ type: 1337, definitionName: 'website.components.horizontalrule', value: { hSize: null, floatDir: null } }),
    accordion: (b) => ({ type: 1337, definitionName: 'website.components.accordion', value: {
      accordionDescriptionAlignment: 'left', accordionDescriptionFont: 'paragraph-2', accordionDescriptionPlacement: 'left',
      accordionIconPlacement: 'right', accordionIconSize: px(14), accordionIconThickness: px(1), accordionIconType: 'plus',
      accordionItemPaddingTop: px(30), accordionItemPaddingBottom: px(30), accordionItemPaddingLeft: px(0), accordionItemPaddingRight: px(0),
      accordionItems: b.items.map((i) => ({ title: i.title, description: i.description || '' })),
      accordionTitleAlignment: 'left', accordionTitleFont: 'heading-4',
      descriptionPaddingTop: px(0), descriptionPaddingBottom: px(30), descriptionPaddingLeft: px(0), descriptionPaddingRight: px(0),
      descriptionWidth: { unit: '%', value: 70 }, dividerBorderThickness: px(1), dividerOpacity: 1, isDividerEnabled: true, isFirstDividerVisible: true, isLastDividerVisible: true,
      isExpandedFirstItem: !!b.open, shouldAllowMultipleOpenItems: !!b.multiple, containerStyles: cStyles(), hSize: null, floatDir: null } }),
    scrolling: (b) => ({ type: 1337, definitionName: 'website.components.scrolling', value: {
      animationDirection: b.direction || 'left', animationSpeed: b.speed || 1, fadeEdges: false, itemSpacing: { unit: 'em', value: 0.5 }, linkTo: '', newWindow: false, pausedOnHover: false,
      marqueeItems: b.items.map((text) => ({ text })), textSize: { unit: 'rem', value: 1.5 }, textStyle: 'heading-1', waveFrequency: 4, waveIntensity: 0,
      containerStyles: cStyles({ pad: [3, 0] }), hSize: null, floatDir: null } }),
    markdown: (b) => ({ type: 44, value: { wysiwyg: { source: b.markdown, isSource: false, mode: 'markdown', engine: 'source' }, html: mdToHtml(b.markdown), hSize: null, floatDir: null } }),
    embed: (b) => ({ type: 1337, definitionName: 'website.components.embed', value: { url: b.url, customThumbEnabled: false, embedBlockType: 'link', animations: [], breakpointOverrides: [], transforms: TRANSFORMS, hSize: null, floatDir: null } }),
    video: (b) => ({ type: 1337, definitionName: 'website.components.video', value: {
      customThumb: '', description: { html: '' }, height: 0, html: '', nativeVideo: '', providerName: /youtu/.test(b.url) ? 'YouTube' : /vimeo/.test(b.url) ? 'Vimeo' : '', resolvedBy: '', thumbnailUrl: '', url: b.url, width: 0,
      settings: { autoPlay: !!b.autoplay, controls: 'full', loading: 'auto', loop: !!b.loop, muted: !!b.muted },
      animations: [], breakpointOverrides: [], transforms: TRANSFORMS, hSize: null, floatDir: null } }),
    map: (b) => ({ type: 1337, definitionName: 'website.components.map', value: { controls: false, labels: true, style: 2, terrain: false,
      location: { mapLat: b.lat, mapLng: b.lng, mapZoom: b.zoom || 12 }, animations: [], breakpointOverrides: [], transforms: TRANSFORMS, vSize: b.height || 12, hSize: null, floatDir: null } }),
    form: (b) => ({ type: 1337, definitionName: 'website.components.form', value: { buttonAlignment: b.align || 'left', buttonVariant: 'primary', firstFieldHighlightType: 'none',
      formId: b.formId || null, lightboxHandleText: '', submissionAnimation: 'none', submissionTextAlignment: 'left', submissionVerticalAlignment: 'top', useLightbox: false,
      containerStyles: cStyles({ radius: 20, thickness: 2 }), animations: [], breakpointOverrides: [], transforms: TRANSFORMS, hSize: null, floatDir: null } }),
    newsletter: (b) => { const h = (t) => ({ engine: 'wysiwyg', html: `<p>${esc(t)}</p>`, source: `<p>${esc(t)}</p>` }); return { type: 51, value: {
      alignment: 'alignCenter', captchaEnabled: true, captchaTheme: 1, captchaAlignment: 2,
      description: h(b.description || 'Sign up with your email address to receive news and updates.'), disclaimer: h(b.disclaimer || 'We respect your privacy.'),
      formId: null, layout: 'layoutFloat', submitButtonText: b.button || 'Sign Up', successRedirect: '', title: b.title || 'Subscribe', hasEnabledBackends: true,
      containerStyles: { ...cStyles({ stretched: false }) }, floatDir: null, hSize: null } }; },
    social: (b) => ({ type: 1337, definitionName: 'website.components.socialLinks', value: { accounts: b.accounts || [], iconAlignment: b.align || 'center', iconBorderThickness: px(2), iconColor: 'black',
      iconSize: b.size || 'small', iconStyle: 'icon-only', containerStyles: cStyles(), animations: [], breakpointOverrides: [], transforms: TRANSFORMS, hSize: null, floatDir: null } }),
    summary: (b, ctx) => {
      const r = /^[0-9a-f]{24}$/.test(b.source) ? { id: b.source, type: 1 } : (ctx.collections || {})[b.source];
      if (!r) throw new Error(`Summary source "${b.source}" was not resolved to a collection (run resolveSources first).`);
      const show = b.show || ['thumbnail', 'title', 'excerpt'];
      return { type: 1337, definitionName: 'website.components.summary', value: {
        collectionId: r.id, collectionType: r.type, design: SUMMARY.design[b.design || 'grid'], autoCrop: true,
        columnWidth: b.columnWidth || 270, gutter: b.gutter === undefined ? 40 : b.gutter, headerText: b.header || '',
        imageAspectRatio: SUMMARY.ratio[b.ratio || 'auto'], lightbox: false, listImageAlignment: 'left', listImageSize: 80,
        metadataPosition: 'below-content', mixedContent: true, pageSize: b.count || 6,
        primaryMetadata: show.includes('date') ? 'date' : 'none', secondaryMetadata: show.includes('categories') ? 'cats' : 'none',
        productQuickViewEnabled: false, showExcerpt: show.includes('excerpt'), showPastOrUpcomingEvents: 'upcoming', showPrice: true,
        showReadMoreLink: show.includes('readMore'), showThumbnail: show.includes('thumbnail'), showTitle: show.includes('title'),
        slidesPerRow: 3, textAlignment: b.align || 'left', textSize: 'medium',
        containerStyles: { backgroundEnabled: false, backgroundColor: { type: 'THEME_COLOR' },
          stroke: { style: 'none', color: { type: 'SITE_PALETTE_COLOR', sitePaletteColor: { colorName: 'black', alphaModifier: 1 } }, thickness: { value: 2, unit: 'px' } },
          padding: { top: { value: 6, unit: '%' }, bottom: { value: 6, unit: '%' }, left: { value: 6, unit: '%' }, right: { value: 6, unit: '%' } },
          blendMode: 'normal', blur: { enabled: false, filterType: 'backdrop', blurRadius: { value: 15, unit: 'px' } }, borderRadii: RADII },
        filter: { tag: null, category: null }, animations: [], breakpointOverrides: {}, transforms: TRANSFORMS, hSize: null, floatDir: null } };
    },
    gallery: (b) => ({ type: 8, value: {
      'aspect-ratio': 'standard', aspectRatio: null, 'auto-crop': true, blockAnimation: 'none',
      collectionId: b.collectionId || null, design: 'grid', lightbox: false, padding: 20,
      'show-meta': true, 'show-meta-basic': true, 'show-meta-only-title': false, 'show-meta-only-description': false,
      'square-thumbs': true, 'thumbnails-per-row': 4, vSize: null, hSize: null, floatDir: null,
      methodOption: 'transient', existingGallery: null, newWindow: false, transientGalleryId: b.collectionId || null } }),
  };

  // ---------- spec -> sections ----------
  function build(spec, ctx) {
    ctx = ctx || {};
    const errs = validate(spec);
    if (errs.length) { const e = new Error('Invalid page spec:\n - ' + errs.join('\n - ')); e.errors = errs; throw e; }
    const pick = (sec, k, dflt) => ENUMS[k][sec[k] !== undefined ? sec[k] : dflt];
    const buildRows = (src) => (src.rows || [[{ span: 12, blocks: src.blocks }]]).map((row) => ({
      columns: row.map((col) => ({ span: col.span, blocks: col.blocks.map((b) => ({ id: randomId(), ...BUILDERS[b.type](b, ctx) })) })),
    }));
    if (spec.blog) return spec.blog.posts.map((p) => build({ post: { ...p, blog: '0'.repeat(24) } }, ctx));
    if (spec.post) {
      const p = spec.post;
      const blog = /^[0-9a-f]{24}$/.test(p.blog) ? { id: p.blog, type: 1 } : (ctx.collections || {})[p.blog];
      if (!blog) throw new Error(`Blog "${p.blog}" was not resolved to a collection (run resolveSources first).`);
      return { blogId: blog.id, blogType: blog.type, title: p.title, tags: p.tags || [], categories: p.categories || [], excerpt: p.excerpt || '', draft: !!p.draft, thumbnail: p.thumbnail === true, rows: buildRows(p) };
    }
    return spec.sections.map((sec) => {
      const rows = buildRows(sec);
      const section = {
        sectionName: 'LAYOUT_ENGINE', id: randomId(), isCloneable: false, video: { zoom: 0 },
        styles: {
          backgroundWidth: pick(sec, 'background', 'full-bleed'), imageOverlayOpacity: sec.backgroundImageId ? 0.15 : 0.15,
          sectionHeight: pick(sec, 'height', 'medium'), customSectionHeight: 10,
          horizontalAlignment: pick(sec, 'align', 'center'), verticalAlignment: pick(sec, 'valign', 'middle'),
          contentWidth: pick(sec, 'width', 'wide'), customContentWidth: 50,
          sectionTheme: pick(sec, 'theme', 'none'), sectionAnimation: 'none', backgroundMode: 'image',
        },
        sourceType: 'blank', createdOn: Date.now(), content: { raw: false, layout: { columns: 12, rows } },
      };
      if (sec.backgroundImageId) section.backgroundImageId = sec.backgroundImageId;
      return section;
    });
  }

  // URL-path sources used by Summary blocks, e.g. ["/the-stack"].
  const containers = (spec) => (spec.blog ? spec.blog.posts : spec.post ? [spec.post] : (spec.sections || []));
  const specTitle = (spec) => spec.title || (spec.blog && spec.blog.title) || (spec.post && spec.post.title) || 'Untitled';
  function sourcesOf(spec) {
    const out = new Set();
    if (spec.post && typeof spec.post.blog === 'string' && spec.post.blog.startsWith('/')) out.add(spec.post.blog);
    containers(spec).forEach((sec) => (sec.rows || [[{ blocks: sec.blocks || [] }]]).forEach((row) => row.forEach((col) =>
      (col.blocks || []).forEach((b) => { if (b && b.type === 'summary' && typeof b.source === 'string' && b.source.startsWith('/')) out.add(b.source); }))));
    return [...out];
  }

  const PLACEHOLDER_FILE = 'template-placeholder.jpg';
  const eachBlock = (spec, fn) => containers(spec).forEach((sec) => (sec.rows || [[{ blocks: sec.blocks || [] }]]).forEach((row) => row.forEach((col) => (col.blocks || []).forEach((b) => fn(b, col, sec)))));
  // Does this spec want images it didn't supply ids for? (image blocks, galleries, section backgrounds)
  function needsImages(spec) {
    let need = containers(spec).some((c) => c.thumbnail === true) || (spec.sections || []).some((sec) => sec.backgroundImage === true && !sec.backgroundImageId);
    eachBlock(spec, (b) => { if (b && ((b.type === 'image' && !b.imageId) || (b.type === 'gallery' && !b.collectionId))) need = true; });
    return need;
  }

  // Compact human-readable outline for the preview step.
  function outline(spec) {
    if (spec.blog) {
      return `Blog "${spec.blog.title}" (${spec.blog.layout || 'masonry'}, not linked in nav) with ${spec.blog.posts.length} post(s):\n` +
        spec.blog.posts.map((p, i) => `${i + 1}. ` + outline({ post: { blog: spec.blog.title, ...p } }).replace(/\n/g, '\n   ')).join('\n');
    }
    if (spec.post) {
      const p = spec.post; const rows = p.rows || [[{ span: 12, blocks: p.blocks }]];
      const body = rows.map((r) => r.map((c) => `[${c.span}: ${c.blocks.map((b) => b.type + (b.text ? ` "${b.text}"` : '')).join(', ') || 'empty'}]`).join(' ')).join(' / ');
      return `Post "${p.title}" in ${p.blog}${p.draft ? ' (draft)' : ''}${p.tags ? ' tags: ' + p.tags.join(', ') : ''}\n${body}`;
    }
    return spec.sections.map((s, i) => {
      const rows = s.rows || [[{ span: 12, blocks: s.blocks }]];
      const body = rows.map((r) => r.map((c) => `[${c.span}: ${c.blocks.map((b) => b.type + (b.text ? ` "${b.text}"` : '') + (b.type === 'summary' ? ` ${b.source}` : '')).join(', ') || 'empty'}]`).join(' ')).join(' / ');
      return `${i + 1}. ${s.height || 'medium'}/${s.theme || 'no theme'}  ${body}`;
    }).join('\n');
  }

  // Short guide to paste into the cheap model's system prompt.
  const specGuide = () => [
    'Output ONLY a JSON page spec: {"title": str, "sections": [Section]}.',
    'Section: {height?, width?, background?, align?, valign?, theme?, backgroundImageId?} plus EITHER "blocks":[Block] (one full-width row) OR "rows":[[{"span":1-12,"blocks":[Block]}]] (spans in a row must sum to 12).',
    ...Object.keys(ENUMS).filter((k) => !Array.isArray(ENUMS[k])).map((k) => `${k}: ${Object.keys(ENUMS[k]).join(' | ')}`),
    'Blocks: ' + Object.entries(BLOCK_KINDS).map(([k, d]) => `{"type":"${k}"${[...d.required, ...d.optional.map((o) => o + '?')].map((f) => ', ' + f).join('')}}`).join('  '),
    'Summary block pulls from a blog/collection: {"type":"summary","source":"/the-stack","design":"grid|list|carousel|columns","ratio":"auto|1:1|3:2|2:3|4:3|3:4|16:9|2.4:1","show":["thumbnail","title","excerpt","readMore","date","categories"],"count":1-30,"columnWidth":50-600,"gutter":0-100,"header":"text"}. Source is the collection url path.',
    'Text paragraphs are strings (inline **bold**, *italic*, ~~strike~~, [label](url)) or objects: {"text","size":"large|small","color":"accent|lightAccent|darkAccent|white|black|#rrggbb","align":"left|center|right|justify","indent":1-6,"highlight":true,"scaled":true} or {"bullets":[..]} or {"numbered":[..]} or {"quote":".."}.',
    'Code block: {"type":"code","html":"<div>..</div>"}. Images: {"type":"image","layout":..} needs no id - the site placeholder image is used for every image block, gallery ({"type":"gallery","count":12}) and section {"backgroundImage":true}; if there is no placeholder, they are skipped.',
    'Other blocks: quote {"quote","source"}; line {}; accordion {"items":[{"title","description"}]}; scrolling {"items":["text",..]}; markdown {"markdown"}; embed {"url"}; video {"url"}; map {"lat","lng","zoom"}; form {"email"?,"button"?,"message"?}; newsletter {"title","description","button"}; social {"networks"?:["facebook","instagram"],"urls"?:{"facebook":"https://..."}}.',
    'To create a NEW blog with posts: {"blog":{"title":str,"layout"?:"masonry|side-by-side","posts":[{"title","tags"?,"categories"?,"excerpt"?,"draft"?,"thumbnail"?:true,"blocks":[Block]}]}}.',
    'To add a post to an existing blog instead of a page: {"post":{"blog":"/the-stack","title":str,"tags"?:[],"categories"?:[],"excerpt"?:str,"draft"?:bool,"thumbnail"?:true,"blocks":[Block]}} (or "rows" as in sections).',
    'Heading level 1-4. Never invent ids.',
  ].join('\n');

  // ---------- browser runner (needs a Squarespace admin tab) ----------
  const browser = {};
  if (typeof document !== 'undefined') {
    const getCookie = (n) => { const p = ('; ' + document.cookie).split('; ' + n + '='); if (p.length === 2) return p.pop().split(';').shift(); };
    async function api(path, method, body, extraHeaders) {
      const res = await fetch(`${location.protocol}//${location.host}/api/${path}`, {
        method, credentials: 'include',
        headers: { accept: 'application/json, text/plain, */*', 'x-csrf-token': getCookie('crumb'), ...(body && !extraHeaders ? { 'content-type': 'application/json' } : {}), ...(extraHeaders || {}) },
        body: body || undefined,
      });
      const raw = await res.text();
      if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${raw.slice(0, 300)}`);
      return raw ? JSON.parse(raw) : null;
    }
    async function websiteId() {
      const data = await api('commondata/GetCollections', 'GET');
      const first = data && data.collections && Object.values(data.collections)[0];
      if (!first || !first.websiteId) throw new Error('Could not resolve websiteId');
      return first.websiteId;
    }
    // Looks up collection ids for Summary sources (read-only GET). Returns {collections: {"/the-stack": {id, type}}}.
    // Read-only lookup of the placeholder image in the media library (media-api; auth has been flaky, so failures degrade to "none").
    async function findPlaceholder(wid) {
      try {
        for (let offset = 0; offset < 2000; offset += 200) {
          const res = await fetch(`https://media-api.squarespace.com/user/libraries/${wid}/folders/root/assets?order=DESC&orderBy=CREATED_AT&assetTypes=IMAGE&assetSources=UPLOAD,FLICKR,SMUGMUG,DROPBOX,FIVEHUNDREDPX,REHOST,SQUARESPACE_APP,SQUARESPACE_APP_BULK,AI,AI_GENERATED,AI_SECTION_BG&limit=200&offset=${offset}`,
            { method: 'GET', credentials: 'include', headers: { accept: 'application/json, text/plain, */*', 'x-library-id': wid } });
          if (!res.ok) return { asset: null, note: `media library lookup failed (${res.status}), so images will be skipped` };
          const data = await res.json();
          const records = (data && data.assets && data.assets.assetRecords) || [];
          const hit = records.find((a) => a.stringMetaData && a.stringMetaData.fileName === PLACEHOLDER_FILE);
          if (hit) return { asset: hit, note: `${PLACEHOLDER_FILE} found` };
          if (records.length < 200) break;
        }
        return { asset: null, note: `${PLACEHOLDER_FILE} not found in the media library, so images will be skipped` };
      } catch (e) {
        return { asset: null, note: `media library lookup failed (${e.message}), so images will be skipped` };
      }
    }
    browser.resolveSources = async function (spec) {
      const wanted = sourcesOf(spec);
      const ctx = { collections: {} };
      if (needsImages(spec)) { ctx.websiteId = await websiteId(); const f = await findPlaceholder(ctx.websiteId); ctx.asset = f.asset; ctx.imageNote = f.note; }
      if (!wanted.length) return ctx;
      const data = await api('commondata/GetCollections', 'GET');
      const all = Object.values((data && data.collections) || {});
      const norm = (u) => '/' + String(u || '').replace(/^\/+|\/+$/g, '');
      wanted.forEach((src) => {
        const hit = all.find((c) => norm(c.fullUrl) === norm(src)) || all.find((c) => norm(c.urlId) === norm(src));
        if (!hit) {
          const known = all.filter((c) => c.fullUrl).map((c) => c.fullUrl).slice(0, 40).join(', ');
          throw new Error(`No collection found at "${src}". Known paths: ${known}`);
        }
        ctx.collections[src] = { id: hit.id, type: hit.type };
      });
      return ctx;
    };
    // Writes (commit only): turn the placeholder into a block-ready imageId once, build gallery collections, and fill the spec.
    // Returns a cloned spec with ids filled in (image blocks dropped if there is no placeholder) plus a plain-text report.
    async function materialise(spec, ctx) {
      const out = JSON.parse(JSON.stringify(spec));
      const notes = [];
      let wid0 = ctx.websiteId;
      for (const sec of containers(out)) for (const col of (sec.rows ? sec.rows.flat() : [sec])) for (const b of col.blocks) {
        if (b.type === 'form' && !b.formId) {
          let email = b.email; if (!email) { try { email = self.Static.SQUARESPACE_CONTEXT.authenticatedAccount.email; } catch (e) { /* ignore */ } }
          if (!email) throw new Error('Form block needs an "email" (where submissions go).');
          const fid = () => randomId();
          const fld = (type, title, extra) => JSON.stringify({ description: '', id: `${type}-${[8, 4, 4, 4, 12].map((n) => randomId().slice(0, n)).join('-')}`, locked: false, required: true, title, type, name: title + ' 1', ...extra });
          const res = await api('rest/forms', 'POST', JSON.stringify({ form: { type: 1, name: `${specTitle(spec)} Form`,
            fields: [fld('name', 'Name'), fld('email', 'Email', { email: true, placeholder: '' }), fld('text', 'Subject', { text: true, placeholder: '' }), fld('textarea', 'Message', { textarea: true, maxLength: '', placeholder: '' })],
            submitButtonText: b.button || 'Submit', submissionMessage: JSON.stringify({ html: `<p>${esc(b.message || 'Thank you!')}</p>` }), disclaimerMessage: JSON.stringify({ html: '' }),
            submissionHTML: null, successRedirect: '', removedConnectedBackends: [], captchaEnabled: false, captchaTheme: 1, captchaAlignment: 1 },
            backendConnectionConfigs: [{ _type: 'emailConnect', backendType: 3, connectedState: 1, email }], removedBackends: [] }));
          const id = res && (res.id || (res.form && res.form.id));
          if (!id) throw new Error('Form creation returned no id: ' + JSON.stringify(res).slice(0, 200));
          b.formId = id;
        }
        if (b.type === 'social' && !b.accounts) {
          if (!wid0) wid0 = ctx.websiteId = await websiteId();
          b.accounts = (b.networks || ['facebook', 'instagram']).map((n) => ({ serviceId: SOCIAL[n].serviceId, screenname: SOCIAL[n].name, addedOn: Date.now(),
            profileUrl: (b.urls && b.urls[n]) || SOCIAL[n].url, id: randomId(), websiteId: wid0, pullEnabled: false, pushEnabled: true, autoPushEnabled: false,
            iconEnabled: true, defaultPushMessage: '%t %u', serviceName: SOCIAL[n].serviceName, pushAvailable: true }));
        }
      }
      if (!needsImages(out)) return { spec: out, report: '' };
      const wid = ctx.websiteId;
      let dropped = 0, filled = 0, galleries = 0, backgrounds = 0, imageId = null;
      if (ctx.asset) {
        const form = new URLSearchParams({ assetId: ctx.asset.id, libraryId: wid, recordType: '2' }).toString();
        const ref = await api('uploads/images/asset-reference', 'POST', form, { 'content-type': 'application/x-www-form-urlencoded' });
        imageId = ref && ref.media && ref.media[0] && ref.media[0].id;
        if (!imageId) throw new Error('asset-reference did not return a usable imageId.');
      }
      for (const sec of containers(out)) {
        if (sec.backgroundImage === true && !sec.backgroundImageId && imageId) { sec.backgroundImageId = imageId; backgrounds++; }
        const cols = sec.rows ? sec.rows.flat() : [sec];   // a "blocks" section acts as its own single column
        for (const col of cols) {
          const keep = [];
          for (const b of col.blocks) {
            if (b.type === 'image' && !b.imageId) { if (!imageId) { dropped++; continue; } b.imageId = imageId; filled++; }
            if (b.type === 'gallery' && !b.collectionId && imageId) {
              const title = `${specTitle(spec)} Gallery ${randomId().slice(0, 6)}`;
              const created = await api('commondata/SaveCollectionSettings', 'POST', JSON.stringify({ collectionData: {
                navigationTitle: title, description: { html: '', source: '' }, enabled: true, deleted: false, folder: false, itemCount: 0, isEmpty: true,
                typeName: 'gallery-block', type: 6, itemLimit: 20, ordering: 1, nextDisplayIndex: 0, regionName: 'default', title,
                urlId: randomId().slice(0, 20), pagePermissionType: null, calculatedItemCount: 0, websiteId: wid }, memberAreaData: { memberAreaIds: [] } }));
              if (!created || !created.id) throw new Error('Gallery collection creation returned no id');
              for (let i = 0; i < (b.count || 12); i++) {
                const f = new URLSearchParams({ assetId: ctx.asset.id, libraryId: wid, recordType: '2', collectionId: created.id }).toString();
                await api(`galleries/${created.id}/images/asset-reference`, 'POST', f, { 'content-type': 'application/x-www-form-urlencoded' });
              }
              b.collectionId = created.id; galleries++;
            }
            keep.push(b);
          }
          col.blocks = keep;
        }
      }
      const report = imageId
        ? `${PLACEHOLDER_FILE} used for ${filled} image block(s), ${backgrounds} section background(s), ${galleries} gallery(ies).`
        : `${ctx.imageNote}. Skipped: ${dropped} image block(s)` + ' (galleries left empty, section backgrounds left off).';
      return { spec: out, report };
    }
    // Adds ONE post to an existing blog (type 1 collection). Creates a shell, then saves the full post over it.
    async function commitPost(made, ctx) {
      const post = build(made.spec, ctx);
      if (post.blogType !== 1) throw new Error(`"${made.spec.post.blog}" is not a blog (collection type ${post.blogType}).`);
      const wid = ctx.websiteId || await websiteId();
      let authorId = null;
      try {
        const list = await api(`content-collections/${post.blogId}/content-items?limit=1`, 'GET');
        authorId = list && list.results && list.results[0] && list.results[0].authorId;
      } catch (e) { /* fall through to the account id */ }
      if (!authorId) {                                  // new/empty blog: borrow the author from any other blog's post
        try {
          const all = Object.values(((await api('commondata/GetCollections', 'GET')) || {}).collections || {}).filter((c) => c.type === 1 && c.id !== post.blogId);
          for (const c of all) { const l = await api(`content-collections/${c.id}/content-items?limit=1`, 'GET'); authorId = l && l.results && l.results[0] && l.results[0].authorId; if (authorId) break; }
        } catch (e) { /* ignore */ }
      }
      if (!authorId) { try { authorId = self.Static.SQUARESPACE_CONTEXT.authenticatedAccount.id; } catch (e) { /* ignore */ } }
      if (!authorId) throw new Error('Could not work out an author id: the blog has no existing post to copy it from. Add one post by hand first.');
      const now = Date.now();
      const base = {
        websiteId: wid, mediaFocalPoint: { x: 0.5, y: 0.5 }, likeCount: 0, dislikeCount: 0, commentCount: 0, publicCommentCount: 0,
        displayIndex: 0, starred: false, passthrough: false, customContent: null, authorId, commentState: 2, recordType: 1, collectionId: post.blogId,
        location: { mapZoom: 12, mapLat: 40.7207559, mapLng: -73.9919024, markerLat: 40.7207559, markerLng: -73.9919024 },
      };
      const shell = await api(`content/blogs/${post.blogId}/text-posts`, 'POST', JSON.stringify({
        ...base, addedOn: now, publishOn: now, workflowState: 4, urlId: null, title: null, tags: [], categories: [],
        body: { raw: false, layout: { columns: 12, rows: [] } }, excerpt: { html: '', raw: false } }),
        { 'content-type': 'application/json', 'x-autosave': 'true' });
      if (!shell || !shell.id) throw new Error('Post creation returned no id');
      let media = {}; let thumbNote = '';
      if (post.thumbnail) {
        if (!ctx.asset) thumbNote = ' (thumbnail skipped: placeholder image not available)';
        else {
          const f = new URLSearchParams({ assetId: ctx.asset.id, libraryId: wid, recordType: '2', collectionId: post.blogId, replaceItemId: shell.id }).toString();
          const res = await api('commondata/SaveMedia/asset-reference', 'POST', f, { 'content-type': 'application/x-www-form-urlencoded' });
          const item = (res && (res.item || (res.media && res.media[0]) || (res.items && res.items[0]))) || res || {};
          ['systemDataId', 'systemDataVariants', 'systemDataOrigin', 'fileName', 'dataSize', 'sourceUrl', 'mediaProcessingState', 'colorData', 'mediaFocalPoint'].forEach((k) => { if (item[k] !== undefined && item[k] !== null) media[k] = item[k]; });
          if (!media.systemDataId) thumbNote = ' (thumbnail call returned no systemDataId; keys: ' + Object.keys(item).slice(0, 12).join(',') + ')';
        }
      }
      const saved = await api(`content/blogs/${post.blogId}/text-posts/${shell.id}`, 'PUT', JSON.stringify({
        ...base, id: shell.id, title: post.title, urlId: shell.urlId, addedOn: shell.addedOn || now, updatedOn: shell.updatedOn || now, publishOn: now,
        workflowState: post.draft ? 4 : 1, unsaved: true, contentType: 'text/html', shareStates: [],
        tags: post.tags, categories: post.categories, excerpt: { html: post.excerpt ? `<p>${post.excerpt.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p>` : '', raw: false },
        mediaFocalPoint: { x: 0.5, y: 0.5, source: 3 }, ...media,
        body: { layout: { columns: 12, rows: post.rows, legacyPromotedLayout: true, promotedBlockId: null, collectionId: null, parentItemId: shell.id, span: 12 } } }));
      pending = null;
      const url = (saved && saved.fullUrl) || shell.fullUrl;
      console.log(`Done: post "${post.title}" at ${url} (id ${shell.id}).`);
      return { postId: shell.id, fullUrl: url, urlId: saved && saved.urlId, report: (made.report || '') + thumbNote };
    }
    let pending = null;
    browser.preview = async function (spec) {      // validates + prints outline; writes NOTHING
      const sections = build(spec, await browser.resolveSources(spec));   // throws with every error listed
      pending = { spec, sections };
      if (spec.blog) { console.log(`Will create blog "${spec.blog.title}" (not linked in nav) with ${spec.blog.posts.length} post(s):\n` + outline(spec)); return []; }
      if (spec.post) { console.log(`Will add ${spec.post.draft ? 'a draft ' : 'a published '}post to ${spec.post.blog}:\n` + outline(spec)); console.log('Looks right? await SQSPage.commit()'); return sections; }
      console.log(`Will create page "${spec.title}" (not linked in nav) with ${sections.length} sections:\n` + outline(spec));
      console.log('Looks right? await SQSPage.commit()');
      return sections;
    };
    browser.commit = async function (specArg) {     // the only function that writes
      if (!specArg && !pending) throw new Error('Run SQSPage.preview(spec) first, or pass the spec: SQSPage.commit(spec).');
      const spec = specArg || pending.spec;
      const ctx = await browser.resolveSources(spec);
      const made = await materialise(spec, ctx);
      if (spec.blog) {
        const wid = ctx.websiteId || await websiteId();
        const bl = made.spec.blog;
        const created = await api('commondata/SaveCollectionSettings', 'POST', JSON.stringify({ collectionData: {
          description: { html: '', raw: false }, enabled: true, deleted: false, folder: false, regionName: 'default', dirty: false, body: null,
          collectionType: 1, supported: true, supportsVideoBackgrounds: false, title: bl.title, pageSize: 20, relatedItems: false, hasProductQuickView: false,
          hasSystemBlogCollectionSettings: false, forcePageSize: false, eventView: 1, forceEventView: false, newTitle: 'New Blog', addText: 'Add Post',
          acceptTypes: ['text'], itemLayoutTypes: [], view: 'list', icon: 'blog', layout: 'default', index: false, variation: false, fullData: false,
          systemPartials: [], ordering: 2, typeName: 'blog-' + (bl.layout || 'masonry'), navigationTitle: bl.title, type: 1, websiteId: wid },
          memberAreaData: { memberAreaIds: [] } }));
        if (!created || !created.id) throw new Error('Blog creation returned no id');
        const urls = [];
        for (const p of bl.posts) { const r = await commitPost({ spec: { post: { ...p, blog: created.id } }, report: '' }, { ...ctx, websiteId: wid }); urls.push(r.fullUrl); }
        pending = null;
        console.log(`Done: blog /${created.urlId} with ${urls.length} post(s). Find it under "Not Linked" in the Pages panel.`);
        return { blogId: created.id, urlId: created.urlId, fullUrl: '/' + created.urlId, posts: urls, report: made.report };
      }
      if (spec.post) return commitPost(made, ctx);
      const sections = build(made.spec, ctx);       // fresh ids at commit time
      const wid = ctx.websiteId || await websiteId();
      const created = await api('commondata/SaveCollectionSettings', 'POST', JSON.stringify({
        collectionData: {
          description: { html: '', raw: false }, enabled: true, deleted: false, folder: false, regionName: 'default', dirty: false, body: null,
          collectionType: 10, supported: true, supportsVideoBackgrounds: false, typeName: 'page',
          title: spec.title, newTitle: spec.title, ordering: 3, icon: 'page', addText: 'Add Block',
          navigationTitle: spec.title, type: 10, websiteId: wid },
        memberAreaData: { memberAreaIds: [] } }));
      if (!created || !created.id) throw new Error('Page creation returned no id');
      const page = await api(`pages/by-collection-id/${created.id}`, 'GET');
      const region = page.regions[0];               // the NEW page's own region id (gotcha #2)
      sections.forEach((s) => { s.regionId = region.id; });
      region.sections = sections; region.ownerId = created.id;
      await api(`pages/by-collection-id/${created.id}`, 'PUT', JSON.stringify({ regions: [region] }));
      pending = null;
      console.log(`Done: /${created.urlId} (id ${created.id}). Find it under "Not Linked" in the Pages panel.`);
      return { pageId: created.id, urlId: created.urlId, report: made.report };
    };
  }

  return { validate, build, outline, sourcesOf, needsImages, specGuide, ENUMS, BLOCK_KINDS, randomId, ...browser };
});

/* ======================================================================
 * Page Builder UI (MAIN world content script, top frame of /config only)
 * - adds a "Build" button to the admin toolbar next to CSS / JS / Pages
 * - falls back to a floating button if the toolbar never shows up
 * - click -> popup -> paste spec JSON -> Check (no writes) / Build (new unlinked page)
 * ====================================================================== */
(function () {
  if (window.top !== window.self) return;
  if (!location.pathname.startsWith('/config')) return;
  if (window.__OU_PAGEBUILDER_UI__) return;
  window.__OU_PAGEBUILDER_UI__ = true;

  const B = window.SQSPage;
  const log = (...a) => console.log('[OU Page Builder]', ...a);

  // ---- popup (shadow DOM so the admin's CSS can't touch it) ----
  const host = document.createElement('div');
  host.id = 'ou-pagebuilder-host';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      * { box-sizing: border-box; font-family: -apple-system, system-ui, sans-serif; }
      .fab { position: fixed; right: 20px; bottom: 20px; z-index: 2147483000; background: #111; color: #fff; display: none;
             border: 0; border-radius: 999px; padding: 10px 16px; font-size: 13px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,.3); }
      .fab.show { display: block; }
      .backdrop { position: fixed; inset: 0; z-index: 2147483001; background: rgba(0,0,0,.45); display: none; align-items: center; justify-content: center; }
      .backdrop.open { display: flex; }
      .modal { background: #fff; color: #111; width: min(720px, 92vw); max-height: 88vh; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
      h2 { margin: 0; font-size: 16px; }
      textarea { width: 100%; height: 280px; font: 12px/1.4 ui-monospace, Menlo, monospace; padding: 8px; border: 1px solid #ccc; border-radius: 6px; resize: vertical; }
      .row { display: flex; gap: 8px; align-items: center; }
      .spacer { flex: 1; }
      button.b { border: 1px solid #111; background: #fff; color: #111; border-radius: 6px; padding: 7px 14px; font-size: 13px; cursor: pointer; }
      button.b.primary { background: #111; color: #fff; }
      button.b:disabled { opacity: .5; cursor: default; }
      pre.log { margin: 0; background: #f5f5f5; border-radius: 6px; padding: 8px; font: 12px/1.4 ui-monospace, Menlo, monospace; white-space: pre-wrap; max-height: 160px; overflow: auto; display: none; }
      pre.log.show { display: block; }
      pre.log.err { background: #fdecea; color: #7a1c14; }
      pre.log.ok { background: #e8f5e9; color: #1b5e20; }
    </style>
    <button class="fab" title="Build a page from a spec">+ Build page</button>
    <div class="backdrop">
      <div class="modal" role="dialog" aria-label="Build page from spec">
        <h2>Build page from spec</h2>
        <textarea spellcheck="false" placeholder='Paste page spec JSON here, e.g. {"title":"New page","sections":[...]}'></textarea>
        <pre class="log"></pre>
        <div class="row">
          <button class="b" data-act="guide" title="Copy the spec guide to paste into the model's system prompt">Copy spec guide</button>
          <span class="spacer"></span>
          <button class="b" data-act="close">Close</button>
          <button class="b" data-act="check">Check</button>
          <button class="b primary" data-act="build">Build</button>
        </div>
      </div>
    </div>`;
  const ui = {
    fab: root.querySelector('.fab'),
    backdrop: root.querySelector('.backdrop'),
    text: root.querySelector('textarea'),
    log: root.querySelector('.log'),
    buttons: [...root.querySelectorAll('button.b')],
  };

  function open() { ui.backdrop.classList.add('open'); ui.text.focus(); }
  function close() { ui.backdrop.classList.remove('open'); }
  function show(msg, kind) { ui.log.textContent = msg; ui.log.className = 'log show' + (kind ? ' ' + kind : ''); }
  function busy(on) { ui.buttons.forEach((b) => { if (b.dataset.act !== 'close') b.disabled = on; }); }

  // Accept bare JSON or JSON pasted inside a ```json fence (models love fences).
  function parseSpec(text) {
    return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
  }

  async function onAction(act) {
    if (act === 'close') return close();
    busy(true);
    try {
      if (act === 'guide') {
        await navigator.clipboard.writeText(B.specGuide());
        return show("Spec guide copied. Paste it into the model's system prompt.", 'ok');
      }
      let spec;
      try { spec = parseSpec(ui.text.value); }
      catch (e) { return show('That is not valid JSON: ' + e.message, 'err'); }
      const errs = B.validate(spec);
      if (errs.length) return show('Fix these first:\n - ' + errs.join('\n - '), 'err');
      if (act === 'check') {
        const ctx = await B.resolveSources(spec); // read-only lookup of Summary sources
        const found = Object.entries(ctx.collections).map(([u, c]) => `${u} -> collection ${c.id}`).join('\n');
        return show((spec.blog ? `Valid. Would create blog "${spec.blog.title}" with ${spec.blog.posts.length} post(s) (not linked in nav):\n` : spec.post ? `Valid. Would add ${spec.post.draft ? 'a draft ' : 'a published '}post "${spec.post.title}" to ${spec.post.blog}:\n` : `Valid. Would create "${spec.title}" (not linked in nav):\n`) + B.outline(spec) + (found ? '\n\nSummary sources found:\n' + found : '') + (ctx.imageNote ? '\n\nPlaceholder image: ' + ctx.imageNote : ''), 'ok');
      }
      show(`${spec.blog ? 'Creating blog' : spec.post ? 'Adding post' : 'Building'} "${spec.title || (spec.blog || spec.post).title}"...\n` + B.outline(spec));
      const r = await B.commit(spec);
      show((spec.blog ? `Blog created: ${r.fullUrl}\nFind it under "Not Linked" in the Pages panel.\n` : spec.post ? `Posted: ${r.fullUrl}\n` : `Built: /${r.urlId}\nFind it under "Not Linked" in the Pages panel.\n`) + (r.report ? '\n' + r.report + '\n' : '') + '\n' + B.outline(spec), 'ok');
    } catch (e) {
      console.error('[OU Page Builder]', e);
      show('Failed: ' + e.message, 'err');
    } finally {
      busy(false);
    }
  }

  ui.fab.addEventListener('click', open);
  ui.backdrop.addEventListener('mousedown', (e) => { if (e.target === ui.backdrop) close(); });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  root.querySelectorAll('button.b').forEach((b) => b.addEventListener('click', () => onAction(b.dataset.act)));
  document.body.appendChild(host);

  // ---- placement: toolbar button after CSS / JS / Pages, else floating fallback ----
  // NB: deliberately NOT given the "ou-toolbar-btn" class, which ui-tweaks.js treats as a router link.
  const started = Date.now();
  function ensure() {
    const editBtn = document.querySelector('[data-test="frameToolbarEdit"]');
    const bar = document.getElementById('ou-toolbar-buttons'); // set by ui-tweaks.js once its buttons exist
    if (editBtn && bar) {
      if (!bar.querySelector('#ou-build-btn')) {
        const btn = document.createElement('button');
        btn.id = 'ou-build-btn';
        btn.className = editBtn.className;
        btn.textContent = 'Build';
        btn.setAttribute('aria-label', 'Build page from spec');
        btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); open(); });
        bar.appendChild(btn);
        log('Toolbar button added');
      }
      ui.fab.classList.remove('show');
    } else if (Date.now() - started > 12000) {
      ui.fab.classList.add('show'); // toolbar not available on this screen -> always-available fallback
    }
  }
  setInterval(ensure, 1500);
  ensure();
})();
