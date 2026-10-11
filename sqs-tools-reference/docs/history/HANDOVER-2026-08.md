# Handover — sqs-tools

## What this is

A reverse-engineered reference for Squarespace 7.1's admin content API,
built entirely from live network captures on **ou.studio** (Onwards &
Upwards, Joe's own Squarespace/Shopify studio). The end goal: be able to
hand Claude a plain-English description of a page and have it generate a
working script that builds that page on the live site.

Everything in this repo comes from real captured request/response pairs
Joe grabbed from DevTools while working in the Squarespace editor — not
guessed or inferred from docs (Squarespace doesn't publish this API).

## Current state

**Done:**
- Full site-config endpoint map (see README.md "scripts/" section) — can
  pull any page's layout, site-wide header/footer, theme tweaks, custom
  CSS, color system, font system, and full navigation structure.
- Working page-duplication script (`scripts/duplicate-page.js`) — clones
  any page's content into a new unlinked page, with a preview/commit split
  so nothing writes until reviewed.
- Complete block-type library (`lib/blocks/block-library.js`) — all 38
  block types, their real `type` numbers, `definitionName`s, and default
  JSON shapes, tagged by real-world usage frequency (`often` / `periodic`
  / `rare` / `legacy`) based on how the studio actually works.
- Deep variant coverage for the 7 "often"-used block types:
  - **Text** — every RTE formatting pattern (headings, colors, alignment,
    lists, highlight, scaled text, strikethrough, indent) as composable
    builders. Note: highlight needs a paired `textAttributes` entry, not
    just HTML.
  - **Image** — all 6 `designLayout` variants (inline/poster/card/overlap/
    collage/stack), confirmed the block doesn't store image dimensions
    (resolved server-side from `imageId`), and mapped the full pipeline
    for sourcing a real `imageId` from the media library (3-step: list →
    reference → use).
  - **Button** — alignment/size/stretch/link, confirmed `buttonLink` can
    be `null` or `""` interchangeably for "no link".
  - **Gallery** — all 4 `design` modes (grid/stacked/slideshow/slider),
    each unlocking different fields; full 7-value aspect-ratio preset list.
  - **Summary** — all 4 `design` modes (list/autogrid/carousel/
    autocolumns), full 7-value metadata option list, and confirmed this
    block's `imageAspectRatio` is a **decimal ratio string** ("1.5",
    "0.6667", "2.4") — NOT the same named-preset system Gallery uses.
  - **Spacer, Code** — trivial, fully covered by block-library.js defaults.
- **link-targets.js** — the 3 link kinds shared across every block with a
  link field: internal page (`/slug`), external URL, uploaded file (`/s/
  filename`, sourced via `recordType=19` content-items list).
- Layout/nesting rules confirmed: row column `span` values must sum to 12
  (any split works: 6+6, 4+4+4, 1+10+1); a column holds either `blocks` OR
  nested `rows`, never both.

**Not started — the "periodic" tier (11 block types):**
Video, Form, Accordion, Scrolling/Marquee, Line, Newsletter, Quote, Map,
Markdown, Embed, Social Links. Each has a default captured in
block-library.js already — what's missing is populated real-content
variants like we did for the "often" tier.

**Deliberately not touched:**
"Rare" (Product, Instagram) and "legacy" (18 types — Pricing Plan,
Donation, Scheduling, Audio, Calendar, Menu, Chart, Search Field, Page
Link, Tag Cloud, RSS, Archive, Flickr, Tock, SoundCloud, OpenTable, Zola,
Bandsintown) — Joe hasn't used most of these in 2+ years. Capture fresh
if one is ever actually needed rather than front-loading examples that'll
sit unused.

## Critical gotchas learned the hard way

1. **`pages/by-collection-id/<id>` accepts PUT**, not just GET — this is
   the core "write a page's content" primitive everything is built on.
   The PUT body is `{ regions: [...] }`.

2. **Region ID mismatch is a silent trap.** A brand-new page gets its OWN
   default region with its own region `id` — you cannot reuse the source
   page's region id when writing cloned content to a different page. The
   fix: GET the new page first, take ITS region's `id`/`displayName`/
   `type`/etc., and only swap in the `sections` array. This caused a real
   400 error (`"does not match any existing region"`) before being fixed.

3. **Section and block IDs must be regenerated** when cloning content
   across pages — reusing the source page's IDs will collide.
   `duplicate-page.js` does this with a recursive `regenerateIds()` walk
   over the whole layout tree.

   **ID format matters, not just uniqueness — and length matters too.**
   Every real captured id (section or block, anywhere in this repo) is
   plain lowercase hex, no prefix, and **exactly 24 characters** — a
   MongoDB ObjectId (e.g. `6a90153cfabcda2cbfcf192b`). Confirmed two ways
   the hard way, both causing an **empty-body 400** on the
   `pages/by-collection-id/<id>` PUT with zero diagnostic info in the
   response (body or headers):
     1. A hand-built id like `blk_1a2b3c...` (prefixed, non-hex).
     2. A correctly-formatted but wrong-length hex id (20 chars instead
        of 24) — this one is easy to miss since it *looks* like a normal
        hex id and passes casual inspection.
   `duplicate-page.js` never hit either bug because its `regenerateIds()`
   derives each replacement id's length from the real id it's replacing
   (`node.id...length || 20`) — cloned ids are always real 24-char
   ObjectIds, so the regenerated ones are too, by construction. Any
   *new* script generating ids from scratch must hard-code 24, not
   assume a shorter length is fine just because it's valid hex.

   **CONFIRMED FIXED** — `scripts/build-test-page.js`'s
   `commitNoImages()` successfully created a real page with 4 sections
   (text/gallery blocks, split rows, inset+medium section styles) once
   ids were switched to 24 chars. The bulk `pages/by-collection-id` PUT
   *can* create brand-new sections from scratch — the earlier
   "bulk PUT can't create, only edit" theory was wrong; it was the id
   length the whole time.

8. **media-api.squarespace.com auth is unreliable to reproduce from a
   plain script.** `GET user/libraries/<websiteId>/folders/root/assets`
   401s ("Authentication information missing") both from `/config/pages`
   *and* from a plain live page load — it apparently needs some
   editor-session state established by actually opening the media
   picker UI at least once, not just being logged in with valid cookies.
   Unresolved. Workaround: skip it — either hardcode an already-known
   imageId (`build-test-page.js`'s `commitWithImage()`) or drop the
   image dependency entirely (`commitNoImages()`, which is what actually
   got a full end-to-end page write confirmed working).

4. **Write endpoints are NOT obvious from their names/methods alone.**
   Several innocuous-looking GET-adjacent calls turned out to be live
   mutations that actually modified the site during testing (a stray
   blank section, a stray page called "dave", nav getting polluted). Full
   exclude list is in README.md. Rule of thumb: anything under
   `commondata/Save*` or `commondata/Create*` (vs `Get*`) is a write.
   `catalog-preview/*` and `content/add/*` are also writes despite sounding
   like previews.

5. **`imageId` ≠ media library asset id.** The media library's own asset
   ID (from `media-api.squarespace.com/.../assets`) is NOT block-ready.
   It must be POSTed to `/api/uploads/images/asset-reference` first, which
   returns a NEW id — that's the one that goes in a block's `imageId`
   field. This POST is a write (creates a content record) — don't re-call
   it for an asset already referenced.

6. **A form/newsletter block's `formId` is server-assigned.** Can't be
   synthesized; either omit and let Squarespace backfill on save, or reuse
   an existing formId from a real block.

7. **On admin shell screens (`/config/pages` etc.), the live site — and
   `window.Static.SQUARESPACE_CONTEXT` with it — lives in a same-origin
   iframe, not the top frame the browser console runs in by default.**
   Any script reading that global directly off `window` gets `null`/
   undefined and silently fails to detect `websiteId`/`collectionId`. Fix:
   check the top frame first, then scan `document.querySelectorAll('iframe')`
   for the same global on `iframe.contentWindow` (same-origin, so this
   works without CORS issues). All three scripts in `scripts/` now do this
   (`findSquarespaceContext()` helper) — copy that pattern into any new
   console script rather than reading `window.Static` directly.

## Next session

- **Blogs and blog posts** — not yet captured at all (collection type,
  post CRUD, post-specific fields like tags/categories/author, blog
  layout/list settings). Whole area open.
- **Site styles** — the sitewide style editor (color palette, fonts,
  spacing scales, etc., as distinct from per-section `styles` already in
  [notes/section-settings.md](notes/section-settings.md) and the header
  config in [notes/header-footer-settings.md](notes/header-footer-settings.md)).
  Flagged by Joe as notoriously confusing/tangled — expect this one to
  take longer and probably need several passes to untangle which knobs
  affect what.

## Suggested next steps

1. Decide whether to keep filling out the "periodic" tier the same way
   (capture → build variants file), or jump straight to building a first
   "describe a page → generate a script" prototype using what's already
   solid (the 7 "often" blocks cover the vast majority of real page
   content per Joe).
2. If building the generator: it needs (a) a way to take a plain-English
   section description and pick appropriate block kinds + content, (b)
   assemble a valid row/column layout respecting the span-sums-to-12 rule,
   (c) wire the output into the same PUT-to-page-collection-id mechanism
   `duplicate-page.js` already proves works, including the region-id
   fix from gotcha #2.
3. Missing capability worth flagging to Joe if it comes up: no captured
   endpoint for uploading a **brand-new** image/file (only referencing
   ones already in the library) — would need multipart form handling not
   seen yet in any capture.

## Working style notes

- Everything gets captured via Joe copy-pasting real `fetch(...)` calls +
  responses from DevTools — Claude never guesses at undocumented API shape.
- Every write-capable script gets a preview/dry-run step before any commit
  action, given how easily a stray write has landed on the live site
  during this process (see gotcha #4).
- Test changes go on the live ou.studio site directly (no staging), so
  caution and confirmation before any write action matters more than usual.
