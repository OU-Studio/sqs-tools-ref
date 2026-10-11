# sqs-tools

Reverse-engineered reference and tooling for the **Squarespace 7.1 private admin API**,
built from live DevTools captures on Onwards & Upwards' own site
(`onwards-upwards.squarespace.com` / ou.studio). Squarespace doesn't publish this API;
everything here comes from real captured request/response pairs.

**Goal:** plain-English page description in, finished page on the live site out, cheaply.
A cheap model (Haiku) writes a small JSON *spec*; deterministic code (the page builder)
turns the spec into real Squarespace JSON and writes it.

> Status snapshot: **2026-10-11, extension v1.0.14.** For the full story, decisions
> and gotchas read [HANDOVER-CURRENT.md](HANDOVER-CURRENT.md).

## Start here

| You want to... | Read |
|---|---|
| Know what works and what's open | [HANDOVER-CURRENT.md](HANDOVER-CURRENT.md) |
| Write a page / blog / post spec | [docs/SPEC-FORMAT.md](docs/SPEC-FORMAT.md) |
| Prompt a model to write specs | [docs/SPEC-GUIDE-PROMPT.txt](docs/SPEC-GUIDE-PROMPT.txt) + [docs/spec-guide-gaps.md](docs/spec-guide-gaps.md) |
| Know which endpoint does what | [docs/API-ENDPOINTS.md](docs/API-ENDPOINTS.md) |
| Add a new block type | HANDOVER-CURRENT.md, "Adding a new block" |
| See raw block JSON shapes | [lib/blocks/](lib/blocks/) |
| Site styles, CSS, injection, header, sections, blogs | [notes/](notes/) |

## What works today (confirmed live)

- **Pages** with any number of sections; rows of columns (spans sum to 12).
- **Section settings:** height, content width, background width, horizontal and vertical
  alignment, all 10 themes, background image.
- **19 block kinds:** heading, text (full formatting), button, spacer, code, image, gallery,
  summary, quote, line, accordion, scrolling (marquee), markdown, embed, video, map,
  newsletter, form, social links.
- **Blogs:** add a post to an existing blog; create a new blog (masonry or side-by-side)
  with posts in one spec; post tags, categories, excerpt, draft, thumbnail.
- **Images:** every image slot uses `template-placeholder.jpg` from the media library.

Open: uploading brand-new images, the flaky media-library 401, editing existing pages,
and running Haiku itself end to end. Details in the handover.

## How to build a page (day to day)

1. Install the extension from [extension/squarespace-auto-script-1.0.14.zip](extension/)
   (Chrome, load unpacked or via the Web Store listing). It runs on
   `*.squarespace.com/config/*`.
2. Get a spec: give a model the text from **Copy spec guide** (same as
   `docs/SPEC-GUIDE-PROMPT.txt`) plus the page description. It returns JSON only.
3. In the Squarespace admin click **Build** in the toolbar (after CSS / JS / Pages),
   paste the JSON (code fences are stripped), press **Check** (validates, resolves
   `/paths`, finds the placeholder image, writes nothing), then **Build**.
4. The page (or blog) appears under **Not Linked** in the Pages panel.

Console route without the extension: paste `builder/page-builder.js` into the console
on a `/config` page, then `await SQSPage.preview(spec)` and `await SQSPage.commit()`.
Offline in Node: `require('./builder/page-builder.js').build(spec)` (validation and JSON
only, no writes).

## Repo layout

```
HANDOVER-CURRENT.md      current state, decisions, gotchas, next steps
CLAUDE.md                orientation for future Claude chats
docs/
  SPEC-FORMAT.md         every spec key and block option, with examples
  API-ENDPOINTS.md       every endpoint learned (reads and writes), auth, payload notes
  SPEC-GUIDE-PROMPT.txt  the model system prompt (output of specGuide())
  spec-guide-gaps.md     known gaps in that prompt, with fixes
  claude-memory/         the Claude project memory as of 2026-10-11
  history/               the original Aug 2026 README and HANDOVER
builder/
  page-builder.js        core builder (UMD: Node or browser), same core as the extension
  example-spec.json      first live-built page (/studio-home)
  test-specs/            test-spec-1..8, each confirmed live ("unverified" in name 1 is historical)
  examples/              specs written from the guide (bakery, photographer, venue,
                         "Building Legacy" about page + design PNG + draft CSS)
extension/
  squarespace-auto-script/      source of the Chrome extension (MV3, MAIN world)
  squarespace-auto-script-1.0.14.zip   Web Store upload
scripts/                 original console scripts (get page data, duplicate page, ...)
lib/blocks/              block JSON reference (38 types) and variant files
notes/                   working notes per API area
```

No CSRF tokens, cookies or session values are stored anywhere in this repo. Scripts read
the `crumb` cookie at runtime.
