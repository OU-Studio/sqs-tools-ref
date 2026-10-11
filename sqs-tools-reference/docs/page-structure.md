# Page structure logic

How the client-approved Williams About page is built, which block goes where, and why.
Use this when writing a spec (by hand or by a model) so the page structure and the CSS stay in step.

**Sources:** the page's saved layout (a captured `PUT pages/by-collection-id` body, token stripped, not stored
in the repo) and the stylesheet written for it (`builder/examples/about-legacy-v3.css` is its About-page part).

**Tags used below**

- **Observed**: visible in the capture or the stylesheet.
- **Inferred**: the likely reason; nothing states it. Confirm or correct these (see section 8).

---

## 1. The one rule behind everything

Structure exists so that CSS can find things and keep working. Content lives in blocks; look and layout live in CSS.

Squarespace can't add a class to a section when it is created, and section/block ids are random, so every
section gets a readable id and all CSS hangs off it.

- **Observed:** every section has a `customId` such as `a-1`, and the CSS is written `#a-1 { ... }`.
- **Observed:** one id prefix per page. The stylesheet uses `h-` home, `a-` about, `e-` expertise, `s1-` a service page,
  `c-` contact; the O&U site uses `f-` for footer sections.
- **Inferred:** ids are used instead of `data-section-id` because those change whenever a page is rebuilt.
- **Rule:** section id = `<page-prefix>-<n>` in page order. Numbers needn't be contiguous; a letter is fine for a
  special band (`a-f`, `a-l`).

---

## 2. Page map (About)

| id | Band | Theme | Height / width | Layout |
|---|---|---|---|---|
| `a-1` | Hero | none | medium / wide, **background image** | 1 column, 1 block |
| (no id) | Intro statement | none | small / medium | 1 column, one h3 |
| `a-2` | Our Story + Our Foundation | none | small / wide | **nested**: [6 text . 6 photo], spacer, [6 photo . 6 text], spacer |
| `a-3` | Our Commitment | light | small / wide | **nested**: [4 title . 8 text] |
| `a-4` | Safety + Giving Back | none | small / wide | **nested**: spacer, [6 photo . 6 text], spacer, [6 text . 6 photo] |
| `a-5` | Team intro | light | small / wide | 1 column: h2 + large paragraph |
| `a-6` | Principals | light | small / wide | 1 column: h3, code, summary |
| `a-7` | Leadership | light | small / wide | 1 column: h3, code, summary |
| `a-f` | Featured team | none | small / wide | 1 column: h3, summary |
| `a-8` `a-9` `a-12` ... | Department groups | none | small / wide | 1 column: h3, summary |
| `a-l` | Call to action | light | custom / medium | **nested**: [3 logo . 9 text + button] |

The capture and the design screenshot differ slightly: the screenshot has Multifamily and Development groups
(`a-10`, `a-11`) and no intro statement or `a-f`; the capture has the reverse. Build from the screenshot, add or drop
bands as the client decides.

---

## 3. Decision rules

### 3.1 New section or new row?

- **New section** when the band needs its own background/theme/height, its own CSS scope, or it is one repeatable group
  (each team group is its own section).
- **Rows inside one section** when several bands share a background and spacing and read as one continuous piece.
  **Observed:** Story + Foundation share `a-2`; Safety + Giving Back share `a-4`.

### 3.2 Nested rows

**Observed:** inside those sections the layout is one span-12 column that contains the rows
(`layout.rows[0].columns[0].rows[...]`), not top-level rows. The CSS depends on it: `#a-2 .span-12 > .row`, and
`:nth-of-type(1)` / `(2)` to treat the two rows differently.

- **Inferred:** the pair is styled as one band (same flex rules and gap, one id) with per-row tweaks by position.
- **Observed:** a spacer block (`vSize` 1) sits in its own row above/below the content rows. **Inferred:** consistent
  breathing room without per-section padding rules.
- **House convention:** `.row` needs an explicit `display: flex` in CSS.

### 3.3 Column spans

| Spans | Use |
|---|---|
| 6 . 6 | media beside text |
| 4 . 8 | short title beside a longer statement (Commitment) |
| 3 . 9 | logo beside a message (CTA) |
| 12 | centred or full-width content: hero, intro, team labels and grids |

### 3.4 Left/right rhythm

**Observed order:** text . photo, photo . text, (4 . 8, no photo), photo . text, text . photo.
**Inferred:** photos alternate sides so the page zig-zags, and the photo-less Commitment band breaks the pattern
halfway. When adding a band, flip the side of the previous photo.

### 3.5 Section settings

**Observed:** all bands are `small` height and `wide` content width, except the hero (`medium`, with background
image), the intro statement (`medium` width) and the CTA (custom height, `medium` width). `light` theme is used on
Commitment, Team intro, Principals, Leadership and the CTA; the rest inherit the site theme.

---

## 4. Block recipes

Every text block is a Squarespace HTML text block. Headings are `<h1>`/`<h2>`/`<h3>` inside it, not a separate block type.

| Recipe | Blocks, in order | Notes |
|---|---|---|
| **Content column** (Story, Foundation, Safety, Giving Back) | h2, line, text | The h2 starts with an accent word ("Our Story"). The line is the divider. |
| **Statement column** (Commitment) | left: h2 only. Right: large accent lead sentence, line, large paragraph | **Observed:** `sqsrte-large` paragraphs, not headings. **Inferred:** keeps the heading levels clean. |
| **Photo** | gallery: 1 image, 1 per row, square, padding 0 | See 4.1 |
| **Hero** | one h1 block: "BUILDING A LEGACY" + italic accent span "Since 1954"; section background image | See 4.2 |
| **Team label + grid** | h3, [code], summary | See section 5 |
| **CTA** | nested [3 image . 9 (h3 in two tones, paragraph, button)] | Image is the logo. Button links to `/contact`. |

**Hierarchy (house convention):** h1 hero only; h2 section titles; h3 labels, intro statement and CTA title.
Typography is global CSS and is never overridden at section level.

**Accent:** gold words are `<span class="sqsrte-text-color--darkAccent">`. The palette slot must be gold, or CSS must
set it (the test-site CSS does). Builder syntax: `{{darkAccent:Our}} Story`.

**Divider:** the `line` block is a horizontal rule; the gold comes from a global `hr` rule.

### 4.1 Why galleries for photos

**Observed:** the photos are gallery blocks (`thumbnails-per-row: 1`, `aspect-ratio: square`, `padding: 0`,
`auto-crop`), and the stylesheet has gallery rules for these sections.
**Inferred:** a one-up gallery gives an edge-to-edge photo with no caption or gap, and the crop is easy to override
in CSS (`.image-wrapper` padding-bottom and `object-fit`). An image block is used only for the CTA logo.

### 4.2 Why the hero is one block

**Observed:** a single h1 with an italic accent span, not an h1 plus an h2.
**Inferred:** it stays on one line and is one thing to style; `#a-1 .content-wrapper` then becomes the dark
translucent panel on the right.

---

## 5. Team logic

A team member is a **blog post** in a Team collection, so the client updates the page by publishing posts.

| Part of the person | Where it lives |
|---|---|
| Photo | post thumbnail |
| Name | post title |
| Role / title line | post **tags** (summary shows tags as primary metadata) |
| Bio | post excerpt (shown only in Principals) |
| Group | post **category** |

Each group is its own section: an h3 label, then a summary block filtered by one category.

**Observed summary settings:** autogrid, image ratio 0.75 (3:4), column width 270, gutter 60, page size 30, thumbnail
and title on, read-more off; text centred for Principals and Leadership, left for the other groups.

**Inferred:** a new person is a new post; a new group is a copy of a section with a new category; one CSS rule covers
every department group; the CSS, not the block, sets how many columns show.

**Interaction scaffold (Principals and Leadership only):** a `code` block between the label and the summary containing
empty `<div class="subMenu">` children. **Not in the capture:** the script that fills them and sets `data-index` on
the section. The CSS uses `data-index` for the highlighted card and the diamond marker position.

---

## 6. Mapping to an sqs-tools spec (builder 1.0.15)

| Intent | Spec |
|---|---|
| Section id for CSS | `"id": "a-2"` |
| Rows inside one span-12 column | `"nested": true` with `"rows"` |
| Accent word | `{{darkAccent:Our}} Story` in a heading or text |
| Divider | `{"type": "line"}` |
| Spacer row | `[{"span": 12, "blocks": [{"type": "spacer", "size": 1}]}]` |
| Photo | `{"type": "gallery", "count": 1, "perRow": 1, "aspect": "square", "padding": 0}` |
| Lead sentence | `{"text": "...", "size": "large"}` |
| Team members | blog spec: posts with `categories`, `tags`, `excerpt`, `thumbnail: true` |
| Team group | `{"type": "summary", "source": "/team", "category": "principals", "ratio": "3:4", "show": ["thumbnail","title","excerpt","tags"], "count": 30, "columnWidth": 270, "gutter": 60, "align": "center", "metaPosition": "below-title"}` |
| subMenu scaffold | `{"type": "code", "html": "<div class=\"subMenu\">...</div>"}` |

Zig-zag band, nested:

```json
{ "id": "a-2", "nested": true, "height": "small", "width": "wide",
  "rows": [
    [ { "span": 6, "blocks": [
        { "type": "heading", "level": 2, "text": "{{darkAccent:Our}} Story" },
        { "type": "line" },
        { "type": "text", "paragraphs": ["..."] } ] },
      { "span": 6, "blocks": [ { "type": "gallery", "count": 1, "perRow": 1, "aspect": "square", "padding": 0 } ] } ],
    [ { "span": 12, "blocks": [ { "type": "spacer", "size": 1 } ] } ],
    [ { "span": 6, "blocks": [ { "type": "gallery", "count": 1, "perRow": 1, "aspect": "square", "padding": 0 } ] },
      { "span": 6, "blocks": [
        { "type": "heading", "level": 2, "text": "{{darkAccent:Our}} Foundation" },
        { "type": "line" },
        { "type": "text", "paragraphs": ["..."] } ] } ]
  ] }
```

**Builder limits that affect this page:** it only creates new pages; every image is the placeholder; section height
`custom` isn't supported (use `small`); the Team blog must exist before the page that summarises it.

---

## 7. Checklist for a new page

1. Pick the id prefix.
2. List the bands from the design. One band = one section, unless two bands share a background and read as one piece
   (then one nested section).
3. Give each section an `id`, in page order.
4. Choose spans per row (6.6, 4.8, 3.9, 12) and alternate photo sides.
5. Fill each column from the recipes in section 4; don't invent new block combinations without a reason.
6. Anything repeating (people, projects, posts) is a collection plus a filtered summary, not hand-built blocks.
7. Build the collection first, then the page.
8. Write CSS against `#<id>` only; keep typography global.

---

## 8. Unconfirmed

- Builder 1.0.15 is written from the capture and has not been run on a live site.
- Every **Inferred** line above is the likely reason, not a stated one.
- The design screenshot shows 5 across in the department groups; the client stylesheet has 4. The test CSS overrides it
  to 5.
- The subMenu script is not in the repo.
- `a-f` and the intro statement are in the capture but not the screenshot; Multifamily and Development are in the
  screenshot but not the capture.
