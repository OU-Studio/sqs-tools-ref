# Handover: sqs-tools (current as of 2026-10-11)

Owner: Joe, Onwards & Upwards (GitHub `OU-Studio`). Test site:
`onwards-upwards.squarespace.com` (live, no staging). The earlier Aug 2026 handover is
kept in `docs/history/` for detail on how the original reference was captured.

## 1. What this project is

1. **Reference** (`lib/`, `notes/`, `scripts/`, `docs/API-ENDPOINTS.md`): the Squarespace 7.1
   private admin API, learned from DevTools captures Joe pasted in. Nothing is guessed.
2. **Page builder** (`builder/page-builder.js`): turns a small JSON spec into exact
   Squarespace section/block JSON and writes it. It owns everything that fails silently:
   24-char ids, span sums, enums, block shapes, region swap, preview before commit.
3. **Chrome extension** (`extension/squarespace-auto-script`, "Onwards & Upwards —
   Squarespace Dev Tools"): Joe's own extension. `page-builder.js` was added next to the
   existing `ui-tweaks.js`; it adds a **Build** toolbar button with a paste-spec popup
   (Check / Build / Copy spec guide).

**Why a spec + builder:** Joe wants ~100 pages/day, 5 days/week. Rough API estimates
(Oct 2026, unmeasured): model writes full page JSON ≈ $350/mo on Sonnet; model writes a
short spec and the builder does the rest ≈ $90/mo Sonnet, ≈ $5/mo Haiku. Batch API halves
that. Decision: **Haiku via API writes specs; Sonnet on Joe's subscription is for learning
new blocks/endpoints.** A local model was considered and judged not worth it. Before
committing to Haiku, run ~20 real requests and check first-try validity (move to Sonnet
if below ~90%).

## 2. Status

### Confirmed live (Joe tested each on the live site)

| Area | Version confirmed | Test spec |
|---|---|---|
| Page create + heading, text, button, gallery (empty), section styles | 1.0.8 | `example-spec.json` → /studio-home |
| Spacer, button sizes/aligns/link types, all section height/width/valign/themes, heading L4 | 1.0.8 | test-spec-1 |
| Image block (inline, card), section background image (explicit id) | 1.0.8 | test-spec-2 |
| Summary from `/the-stack`, grid, 1:1 (`"1"` confirmed) | 1.0.9 | test-spec-3 |
| Full text formatting + code block | 1.0.10 | test-spec-4 |
| Placeholder image for image blocks, filled galleries, backgrounds | 1.0.10 | test-spec-5 |
| Quote, line, accordion, scrolling, markdown, embed, video, map, newsletter | 1.0.11 | test-spec-6 |
| Form (creates form via `rest/forms` first) and social links (accounts inline) | 1.0.12 | test-spec-6 |
| Add post to existing blog | 1.0.11 | test-spec-7 |
| New blog with posts | 1.0.13 | test-spec-8 |
| Post thumbnails via `SaveMedia/asset-reference` | 1.0.14 | test-spec-8 |
| 8-section page from a plain-English brief, spec written from the guide | 1.0.14 | `builder/examples/4-about-legacy.json` → /about-1 |

### Open

- **Brand-new image upload.** No upload endpoint captured. Only existing library images;
  in practice every image is `template-placeholder.jpg`. Needs a capture of an upload
  (likely multipart) to add.
- **Flaky media-library 401.** `media-api.squarespace.com` sometimes 401s
  ("Authentication information missing"); then image blocks are silently dropped and
  thumbnails skipped. Workaround: reload the admin page (opening the media picker once
  seems to help) and rebuild. Check says "Placeholder image: … found" when it's OK.
- **Haiku end to end.** The guide (`docs/SPEC-GUIDE-PROMPT.txt`) has produced valid specs
  (written by Claude from the guide, all built fine), but nobody has yet called Haiku via
  the API with it. Fix the guide gaps first (`docs/spec-guide-gaps.md`: array enums
  missing from `specGuide()`, map height is grid units, spacer size range,
  `backgroundImage: true` placement, video URL must be real).
- **Gallery options** (design, per-row, aspect) aren't in the spec yet; always a square grid.
- **Editing existing pages.** Builder only creates. Overwriting would use the same
  `PUT pages/by-collection-id/<id>`; not built yet. Restyling a built page is currently done
  with CSS (draft: `builder/examples/about-legacy.css`, colours estimated from
  `about-legacy-design.jpg`, needs tuning against the live page).
- **Social links:** only Facebook (60) and Instagram (64) service ids known.
- Legacy/rare blocks (product, instagram, calendar, etc.) intentionally skipped.

## 3. How to...

### Build a page
Extension: Build button → paste spec → Check → Build. Console: paste
`builder/page-builder.js`, `await SQSPage.preview(spec)`, `await SQSPage.commit()`.
What commit does: `GetCollections` (websiteId) → optional media lookup + asset-reference →
create gallery collections / forms → `SaveCollectionSettings` (type 10 page) →
`GET pages/by-collection-id/<new>` → swap in sections with **that** region id → `PUT`.

### Build a blog post / a blog
Spec `{"post":{...}}` or `{"blog":{...}}` (see `docs/SPEC-FORMAT.md`). Post flow:
resolve blog → find authorId → `POST text-posts` shell (`x-autosave: true`) → optional
thumbnail `SaveMedia/asset-reference` with `replaceItemId=<postId>` → `PUT` full post with
the returned systemData* fields. Blog flow: `SaveCollectionSettings` with `type: 1`,
`typeName: blog-masonry|blog-side-by-side` (no seed posts), then each post.

### Write a spec from plain English
Give the model `docs/SPEC-GUIDE-PROMPT.txt` as the system prompt plus the description;
it must output JSON only. Paste validator errors back for one retry. Where the brief is
silent, defaults: placeholder copy for body text, placeholder image for images.
Interpreting Joe's shorthand (from the /about-1 brief): "tall" = height large, "short" =
small, "wide" = width wide, "span 6" = column span 6, "right aligned text" = block
`align: right` (sections can't align right).

### Add a new block type
1. Joe adds the block by hand in the editor, saves, and pastes the
   `PUT pages/by-collection-id` body (and any call made before it, like `rest/forms`).
   **Strip `x-csrf-token` and other headers before saving anything to the repo.**
2. Add the kind to `BLOCK_KINDS` (required/optional keys), validation in `validateBlock`,
   a builder in `BUILDERS`, any pre-save calls in `materialise()`, and a line in
   `specGuide()`.
3. Copy the core into `extension/squarespace-auto-script/page-builder.js` (the extension
   file = core + UI block appended at the end), bump `manifest.json` version, zip with
   `manifest.json` at the zip root (no `__MACOSX`/.DS_Store), test spec, Joe tests live.

### Ship the extension
Zip the contents of `extension/squarespace-auto-script/` (not the folder) minus INSTALL.md,
bump version, upload to the Chrome Web Store. Permissions stay `*.squarespace.com/config/*`.
Note: the GitHub repo `OU-Studio/chrome-ex` is an **older, different** extension; the real
one is `squarespace-auto-script`.

## 4. Gotchas (learned the hard way)

1. **Ids are 24-char lowercase hex (MongoDB ObjectIds).** Any prefix, other chars, or
   other length (even 20 hex) → empty-body 400 with no detail.
2. **Use the target page's own region id.** GET the new page, take its `regions[0]`, swap
   in `sections`. Reusing another page's region id → 400 "does not match any existing region".
3. **Regenerate all section/block ids** when cloning.
4. **"Preview"-sounding endpoints write live.** `catalog-preview/blankLayoutEngineSection`,
   `content/add/*`, any `Save*`/`Create*`/`Set*`. Past accidents: blank section, a page
   called "dave", polluted nav.
5. **Media asset id ≠ imageId.** POST the asset to `uploads/images/asset-reference` to get
   a block-ready id. It's a write; do it once per build and reuse.
6. **Gallery images live in their own collection** (type 6 `gallery-block`), filled one
   image per `galleries/<id>/images/asset-reference` call.
7. **Form blocks need a server formId:** POST `rest/forms` first. Newsletter is fine with `formId: null`.
8. **Social link accounts** go inline in the block (`accounts[]` with serviceId); ids can be fresh random ones.
9. **Post thumbnail** is not an image block; it's `SaveMedia/asset-reference` with
   `replaceItemId`, and the returned `systemData*` fields must be carried into the post PUT.
10. **New blogs:** create via `SaveCollectionSettings` (no seed posts) rather than the UI's
    catalog copy (adds seed posts). An empty blog has no author to copy; borrow from another blog.
11. **media-api 401** (see Open). Degrade gracefully, never crash a build on it.
12. **Admin iframe:** on `/config` screens `Static.SQUARESPACE_CONTEXT` is in a
    same-origin iframe, not the top window.
13. **Summary `imageAspectRatio` is a decimal string** (`"1"`, `"1.5"`, `"0.6667"`), not
    Gallery's named presets. Summary `design` `grid` = `autogrid`, `columns` = `autocolumns`.
14. **Text highlight** needs a paired `textAttributes` entry, not just HTML.
15. **Full-overwrite endpoints** (colors, fonts, tweaks, custom CSS, injection): GET, edit,
    resend everything. Several are form-encoded, not JSON.
16. **Block ids aren't returned** by the server; the builder makes them and doesn't keep
    them. Find blocks later by fetching the page and matching content.
17. Map `height` is grid rows (vSize 1-30), not pixels.

## 5. Working style Joe uses

- Joe captures with DevTools and pastes `fetch(...)` calls; Claude never invents API shape.
- Every write path has a no-write check/preview step first.
- Test on the live site; new things land under Not Linked.
- Ship as a new extension zip each change; Joe confirms live, then it's "confirmed".
- Keep replies short; Joe prefers to get the file and test.

## 6. Suggested next steps

1. Fix the spec-guide gaps, then run Haiku (API) on ~20 real briefs; measure first-try validity.
2. Capture a brand-new image upload and add it (would replace the placeholder approach).
3. Add gallery layout options (design, per-row, aspect ratio) to the spec.
4. Decide on editing existing pages (overwrite via PUT) vs CSS-only restyling.
5. Make the builder retry/flag the media 401 instead of silently dropping images.
