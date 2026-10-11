# Spec format (page builder v1.0.14)

A spec is a small JSON object a model (or a person) writes. The builder validates it,
lists **every** error at once (paths like `sections[1].rows[0]: column spans sum to 11,
must be 12`), and generates all ids and Squarespace JSON itself. A spec never contains ids
except the optional explicit ones noted below. Source of truth: `validate()` and
`BLOCK_KINDS` in `builder/page-builder.js`.

There are three top-level shapes:

```json
{ "title": "About", "sections": [ ... ] }            // new page (unlinked)
{ "post": { "blog": "/the-stack", "title": "...", "blocks": [ ... ] } }   // post in existing blog
{ "blog": { "title": "Journal", "layout": "masonry", "posts": [ ... ] } }  // new blog + posts
```

## Page

`{"title": str, "sections": [Section, ...]}` — both required. Unknown keys are errors.

### Section

| Key | Values | Default |
|---|---|---|
| `height` | `small` `medium` `large` | medium |
| `width` (content width) | `narrow` `medium` `wide` | wide |
| `background` (background width) | `full-bleed` `inset` | full-bleed |
| `align` (horizontal) | `left` `center` (no `right` at section level; use block `align`) | center |
| `valign` | `top` `middle` `bottom` | middle |
| `theme` | `none` `white` `white-bold` `light` `light-bold` `bright` `bright-inverse` `dark` `dark-bold` `black` `black-bold` | none |
| `backgroundImage` | `true` = use the placeholder image | — |
| `backgroundImageId` | explicit 24-hex image id | — |

Plus **exactly one** of:
- `"blocks": [Block, ...]` — one full-width row (span 12).
- `"rows": [[Column, ...], ...]` — each row is an array of `{"span": 1-12, "blocks": [...]}`;
  spans in a row **must sum to 12** (6+6, 4+8, 4+4+4, 1+10+1 all fine). `blocks` may be empty.

## Blocks

Every block is `{"type": "<kind>", ...}`. `?` = optional.

| type | Keys | Notes |
|---|---|---|
| `heading` | `text`, `level?` 1-4 (default 2), `align?` left/center/right | |
| `text` | `paragraphs` (array), `align?` | see Paragraphs below |
| `button` | `text`, `link?`, `align?`, `size?` small/medium/large | link: `/page`, `https://...`, or `/s/file.pdf`; omit for no link |
| `spacer` | `size?` integer 1-20 | |
| `code` | `html` | any HTML/JS |
| `image` | `layout?` inline/poster/card/overlap/collage/stack, `title?`, `subtitle?`, `imageId?` | no id → placeholder image; dropped if no placeholder |
| `gallery` | `count?` 1-30 (default 12), `collectionId?` | builds its own collection filled with the placeholder; grid, 4 per row (no layout options in spec yet) |
| `summary` | `source` (url path like `/the-stack`, or 24-hex id), `design?` grid/list/carousel/columns, `ratio?` auto/1:1/3:2/2:3/4:3/3:4/16:9/2.4:1, `show?` [thumbnail,title,excerpt,readMore,date,categories], `count?` 1-30, `columnWidth?` 50-600, `gutter?` 0-100, `header?`, `align?` | default show = thumbnail,title,excerpt; count 6 |
| `quote` | `quote`, `source?` | |
| `line` | — | horizontal rule |
| `accordion` | `items` [{title, description}], `open?` (first expanded), `multiple?` | |
| `scrolling` | `items` [strings], `speed?` 0.1-10, `direction?` left/right | marquee |
| `markdown` | `markdown` | |
| `embed` | `url` (http/https) | |
| `video` | `url`, `autoplay?`, `loop?`, `muted?` | YouTube/Vimeo; a placeholder URL validates but won't play |
| `map` | `lat`, `lng`, `zoom?` 1-20 (12), `height?` **grid rows 1-30, not px** (12) | no address geocoding |
| `form` | `email?`, `button?`, `message?`, `align?`, `name?`, `formId?` | creates a Name/Email/Subject/Message form via `rest/forms` first; `email` = where submissions go (defaults to account email) |
| `newsletter` | `title?`, `description?`, `button?`, `disclaimer?` | |
| `social` | `networks?` [facebook, instagram], `urls?` {facebook: "https://..."}, `align?`, `size?` | only Facebook (serviceId 60) and Instagram (64) known |

### Paragraphs (text block)

Each item in `paragraphs` is either a string or an object.

- String: inline `**bold**`, `*italic*`, `~~strike~~`, `[label](url)`.
- `{"text": "...", "size": "large|small", "color": "accent|lightAccent|darkAccent|white|black|#rrggbb", "align": "left|center|right|justify", "indent": 1-6, "highlight": true, "scaled": true}`
- `{"bullets": ["a", "b"]}`, `{"numbered": ["a", "b"]}`, `{"quote": "..."}`

Exactly one of `text` / `bullets` / `numbered` / `quote` per object.

## Post in an existing blog

```json
{"post": {"blog": "/the-stack", "title": "Hello", "tags": ["news"], "categories": ["Studio"],
          "excerpt": "Short summary", "draft": false, "thumbnail": true,
          "blocks": [{"type": "text", "paragraphs": ["Body copy."]}]}}
```

`blog` is the url path (or 24-hex id) and must be a type-1 collection. Use `rows` instead of
`blocks` for columns. `thumbnail: true` uses the placeholder image.

## New blog with posts

```json
{"blog": {"title": "Journal", "layout": "masonry",
          "posts": [{"title": "First", "excerpt": "...", "thumbnail": true, "blocks": [ ... ]}]}}
```

`layout`: `masonry` (default) or `side-by-side`. Posts take the same keys as above minus
`blog`. The blog is created with no seed posts and lands under Not Linked.

## Placeholder image rule

Any image block without `imageId`, gallery without `collectionId`, section with
`backgroundImage: true`, or post with `thumbnail: true` uses the media-library file
**`template-placeholder.jpg`**. Check reports whether it was found. If not found (or the
media library 401s) image blocks are dropped, galleries stay empty and backgrounds/thumbnails
are skipped; Build's result lists what was skipped.

## Examples

- `builder/example-spec.json` — first live page (/studio-home).
- `builder/test-specs/test-spec-1..8` — one per feature area, all confirmed live.
- `builder/examples/` — specs written from the guide for made-up briefs, plus
  `4-about-legacy.json`, an 8-section page from Joe's plain-English brief (built live at
  /about-1).

## Known spec limits

- Gallery: no `design`, per-row or aspect-ratio options yet (always grid, 4 per row, square).
- Section `align` has no `right`.
- Builder only creates new pages/posts/blogs; it can't edit an existing page.
- Block ids are random and not returned; to find a block later, fetch the page and match by content.
