# Section creation flow (the actual editor mechanism) — working notes

Captured live from clicking "add blank section" in the page editor. Both
endpoints were already flagged as writes in [../README.md](../README.md)
despite one being a GET — confirmed here with real payloads.

## Capture 1 — 2026-08-27

### Step 1: get a server-assigned section id + rendered shell

`GET api/catalog-preview/blankLayoutEngineSection`

No params, no body. Response:
```json
{
  "websiteId": "684c160909c00f700f55472c",
  "sectionId": "6a900f2f4e3bda39a00c51d6",
  "html": "<article class=\"sections\" ...><section data-section-id=\"...\" data-current-styles=\"{...}\" data-current-context=\"{...}\">...</section></article>"
}
```
- **The section id is server-generated here**, not client-chosen — despite
  being a GET, this is a write (per README's existing gotcha #4: this
  endpoint "creates a live section"). Not scoped to any page/collection id
  in the request — likely tied to whatever page is currently open in the
  admin editor via ambient session state, not an explicit parameter.
- The returned `html` embeds the same `styles` object (as
  `data-current-styles`) and a `data-current-context` blob containing
  `video`, `backgroundImageId: null`, `backgroundMediaEffect: null`,
  `divider: null`, `typeName: null` — i.e. these fields exist in the
  *rendering* context as null placeholders, not necessarily required on
  the section object itself at creation time.

### Step 2: persist it as a real section

`POST api/content/add/layoutEngineSection?sectionId=<sectionId from step 1>`

Body: literal `null` (not an object, not omitted — the string `"null"`).

Response — the actual section object, freshly created:
```json
{
  "sectionName": "LAYOUT_ENGINE",
  "id": "6a900f2f4e3bda39a00c51d6",
  "isCloneable": false,
  "video": { "zoom": 0 },
  "styles": { "backgroundWidth": "background-width--full-bleed", "imageOverlayOpacity": 0.15, "sectionHeight": "section-height--medium", "customSectionHeight": 10, "horizontalAlignment": "horizontal-alignment--center", "verticalAlignment": "vertical-alignment--middle", "contentWidth": "content-width--wide", "customContentWidth": 50, "sectionTheme": "", "sectionAnimation": "none", "backgroundMode": "image" },
  "sourceType": "blank",
  "createdOn": 1787825968135,
  "content": {
    "raw": false,
    "layout": { "columns": 12, "rows": [{ "columns": [{ "blocks": [
      { "id": "6a900f30903174337ecda4d2", "type": 1337, "value": { "engine": "visual", "html": "<p>&nbsp;</p>", "wysiwyg": { "engine": "code", "isSource": false, "mode": "htmlmixed", "source": "" } }, "definitionName": "website.components.html" }
    ], "span": 12 }] }] }
  }
}
```

### Key structural finding — corrects an earlier wrong guess

A genuinely fresh section has **no** `regionId`, `parentSectionId`,
`backgroundMediaEffect`, or `divider` field. An earlier debugging pass on
`build-test-page.js` (see [../HANDOVER.md](../HANDOVER.md) gotcha #2/#3)
had guessed `regionId`/`parentSectionId` were required on every section
because already-*saved* page sections (captured in
[section-settings.md](section-settings.md)) always have them — turns out
those are likely backfilled by the server once a section is merged into a
page's persisted `regions[]` structure, not required on creation. Also:
`video` here is just `{ zoom: 0 }`, not the 4-field
`{ playbackSpeed, filter, filterStrength, zoom }` object seen on
already-saved/edited sections elsewhere in this repo — that fuller shape
is likely also filled in later (e.g. once a background video is actually
set), not a creation-time requirement.

### Default block on a brand-new section is NOT the same shape as block-library.js

The auto-inserted empty text block here is:
```json
{ "engine": "visual", "html": "<p>&nbsp;</p>", "wysiwyg": { "engine": "code", "isSource": false, "mode": "htmlmixed", "source": "" } }
```
— notably different from `BLOCKS.text.template` in
[../lib/blocks/block-library.js](../lib/blocks/block-library.js), which
uses `engine: 'wysiwyg'`, top-level `html`/`source` strings,
`textAttributes`, `containerStyles`, `animations`, `transforms`, etc.
Working theory: the `block-library.js` shape is what a text block looks
like **after** being edited/formatted through the rich text editor at
least once, while this simpler `engine: 'visual'` + nested `wysiwyg` shape
is the true just-created default. Both apparently coexist as valid block
values for `definitionName: "website.components.html"` — unconfirmed
whether the simpler shape still renders correctly if written back via the
bulk `pages/by-collection-id` PUT, or whether it needs converting to the
richer shape first.

### Open question

Does this per-section `content/add/layoutEngineSection` flow work when
called from a console script targeting an arbitrary page (i.e. can a
`collectionId`/page context be supplied), or is it strictly tied to
whatever page is currently open in the browser's admin editor? If the
latter, this flow can't be scripted headlessly for a page other than the
one you're actively looking at — the bulk `pages/by-collection-id/<id>`
PUT (already proven to work by `duplicate-page.js`) remains the only
scriptable path for writing arbitrary section content to an arbitrary
page, which is why `build-test-page.js` sticks with it, just now matching
this capture's confirmed-minimal section shape.
