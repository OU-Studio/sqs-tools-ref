---
name: page-builder-extension
description: sqs-tools spec->page builder in Joe's chrome extension; v1.0.14 confirmed live 2026-10-11 incl. all periodic blocks, blog posts, new blogs, thumbnails
metadata:
  type: project
---

Builder lives in /mnt/project-files/sqs-builder/: `page-builder.js` (core: validate spec, build section/block JSON, 24-hex ids, region swap, preview/commit) and `squarespace-auto-script/` (Joe's real extension, "Onwards & Upwards Dev Tools", MAIN-world content script on *.squarespace.com/config/*; Build toolbar button + paste-spec popup with Check / Build / "Copy spec guide"). Latest zip: squarespace-auto-script-1.0.14.zip. Test specs: test-spec-1..8 in sqs-builder/.

**Confirmed live by Joe on onwards-upwards.squarespace.com (as of 2026-10-11, v1.0.14):**
- Blocks: heading, text (bold/italic/links, sizes, colors, highlight, lists, quote, scaled), button, spacer, code, image, gallery, Summary (source by url path, resolved via commondata/GetCollections), quote, line, accordion, scrolling, markdown, embed, video, map, newsletter, form (POSTs api/rest/forms first for formId), social links (accounts inline, fb serviceId 60, ig 64).
- Sections: width/valign/height/themes, bg image. Placeholder image = template-placeholder.jpg in media library, used for every image slot.
- `{"post":{...}}` adds a post to an existing blog (POST text-posts shell with x-autosave, then PUT). `{"blog":{title,layout:masonry|side-by-side,posts:[...]}}` creates a new blog (SaveCollectionSettings, type 1; author id borrowed from another blog). `thumbnail:true` sets post thumbnail via `POST api/commondata/SaveMedia/asset-reference` (replaceItemId=postId), systemData* carried into the PUT.

**Open:** brand-new image upload (only existing library images / placeholder); media library lookup sometimes 401s and image blocks get silently skipped (reload page and retry); the Haiku spec-writing prompt (specGuide()) exists but hasn't been tried end to end with Haiku. The OU-Studio/chrome-ex repo is the OLD extension.

Plan: cheap model (Haiku via API) writes only the spec JSON; Sonnet on Joe's subscription is for learning new blocks.

**Why:** cut Claude credit use at ~100 pages/day by making the builder deterministic.
**How to apply:** new block kinds go into BLOCK_KINDS/BUILDERS in page-builder.js (and the spec guide), then bump manifest version and rebuild the zip; see [[sqs-tools-overview]].
