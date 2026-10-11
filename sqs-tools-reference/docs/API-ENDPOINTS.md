# Squarespace 7.1 admin API: endpoints learned

All captured from DevTools on `onwards-upwards.squarespace.com` while logged in to the admin.
Paths are relative to `https://<site>.squarespace.com/api/` unless a full host is given.
Status as of 2026-10-11.

## Auth and request basics

- Same-origin `fetch` with `credentials: 'include'` (the admin session cookies).
- Writes need header `x-csrf-token: <value of the "crumb" cookie>`. Read it at runtime:
  `document.cookie` → `crumb`. **Never hard-code or commit a captured token.**
- JSON bodies use `content-type: application/json`. Several endpoints are
  **form-urlencoded** instead (marked below).
- Captures also carry `sqsp-component-definitions-release-id/-map` and `traceparent`
  headers. The builder doesn't send them and every write still works.
- `media-api.squarespace.com` is a different host: no csrf header, needs
  `x-library-id: <websiteId>`, and its auth is flaky (see gotchas).
- On `/config/*` screens the live site and `window.Static.SQUARESPACE_CONTEXT` live in a
  same-origin iframe; scan `iframe.contentWindow` if the top frame has no context.

Legend: **R** read-only, **W** writes to the live site.

## Collections (pages, blogs, galleries)

| | Method + path | Use |
|---|---|---|
| R | `GET commondata/GetCollections` | Every collection: `id`, `type`, `fullUrl`, `urlId`, `websiteId`. The builder uses it for websiteId and to resolve `/paths` (Summary source, post target blog). |
| R | `GET commondata/GetCollection?collectionId=<id>` | One collection's metadata. |
| R | `GET commondata/GetCollectionSettings?collectionId=<id>` | Settings incl. `itemCount`. |
| R | `GET commondata/GetCollectionTags` / `GetCollectionCategories` | Blog tags/categories. |
| W | `POST commondata/SaveCollectionSettings` | Creates (no id) or edits a collection. Body `{collectionData:{...}, memberAreaData:{memberAreaIds:[]}}`. `type: 10` / `collectionType: 10` / `typeName: 'page'` = page. `type: 1`, `collectionType: 1`, `typeName: 'blog-masonry' or 'blog-side-by-side'` = blog with **zero seed posts**. `type: 6`, `typeName: 'gallery-block'` = backing collection for a gallery block. Response has `id`, `urlId`. New collections land under **Not Linked**. |
| W | `POST content/copy/collection/from-catalog-entity?catalogId=..&catalogEntityId=..` | What the UI's "add page/blog" does: copies a starter, **with seed posts**. Avoid; use SaveCollectionSettings. |
| W | `POST content-collections/<id>/generate-url` | Slug generation step in the UI flow. Not needed with SaveCollectionSettings. |
| W | `POST widget/UpdateNavigation` | Edits live navigation. Not used by the builder. |

## Page content

| | Method + path | Use |
|---|---|---|
| R | `GET pages/by-collection-id/<collectionId>` | Full layout tree: `regions[].sections[].content.layout.rows[].columns[].blocks[]`. |
| W | `PUT pages/by-collection-id/<collectionId>` | **The core write.** Body `{regions:[region]}`. Take the region from the page's own GET (its `id`), replace `sections`, set each section's `regionId`. Can create brand-new sections. |
| W | `GET/POST catalog-preview/blankLayoutEngineSection` | Despite the name, creates a live section. Avoid. |
| W | `POST content/add/layoutEngineSection` | Saves a section onto a page. Not needed (the PUT above does it). |
| R | `GET page-sections/<pageSectionsId>` | Seen in the blog capture. |

## Blog posts

| | Method + path | Use |
|---|---|---|
| R | `GET content-collections/<blogId>/content-items?limit=1` | Existing posts; the builder copies `authorId` from the first. For a new empty blog it borrows from another blog's post, then falls back to `Static.SQUARESPACE_CONTEXT.authenticatedAccount.id`. |
| W | `POST content/blogs/<blogId>/text-posts` (header `x-autosave: true`) | Creates an empty post shell (`workflowState: 4`, `title: null`, empty layout). Returns `id`, `urlId`. |
| W | `PUT content/blogs/<blogId>/text-posts/<postId>` | Saves the full post: `title`, `tags`, `categories`, `excerpt:{html}`, `workflowState` (1 = published, 4 = draft), `authorId`, `body.layout` (`{columns:12, rows, legacyPromotedLayout:true, parentItemId:postId, span:12}`), plus thumbnail fields. |
| W | `POST commondata/SaveMedia/asset-reference` (**form-urlencoded**) | Sets a post thumbnail: `assetId=<media asset>&libraryId=<websiteId>&recordType=2&collectionId=<blogId>&replaceItemId=<postId>`. Copy the returned `systemDataId`, `systemDataVariants`, `systemDataOrigin`, `fileName`, etc. into the PUT above, or the next save wipes it. |

## Images and media

| | Method + path | Use |
|---|---|---|
| R | `GET https://media-api.squarespace.com/user/libraries/<websiteId>/folders/root/assets?order=DESC&orderBy=CREATED_AT&assetTypes=IMAGE&assetSources=UPLOAD,...&limit=200&offset=N` (header `x-library-id`) | Lists library assets; match `stringMetaData.fileName`. **Sometimes 401s.** |
| W | `POST uploads/images/asset-reference` (**form-urlencoded** `assetId, libraryId, recordType=2`) | Turns a library asset into a block-ready `imageId` (`response.media[0].id`). Call once per build and reuse the id. |
| W | `POST galleries/<galleryCollectionId>/images/asset-reference` (**form-urlencoded**, + `collectionId`) | Adds one image to a gallery's backing collection. Call once per image. |
| — | (none) | **No upload endpoint for brand-new files captured yet.** |
| R | `GET content-items/?orderBy=addedOn&orderDirection=2&recordType=19&limit=50` | Uploaded files (`/s/filename`) for file links. See `lib/blocks/link-targets.js`. |

## Forms

| | Method + path | Use |
|---|---|---|
| W | `POST rest/forms` | Must run **before** saving a page with a form block. Body `{form:{type:1, name, fields:[JSON strings], submitButtonText, submissionMessage, ...}, backendConnectionConfigs:[{_type:'emailConnect', backendType:3, connectedState:1, email}], removedBackends:[]}`. Each field is a JSON *string* with an id like `name-<uuid>`. Response `id` goes in the block's `formId`. Newsletter blocks work with `formId: null`. |

## Site-wide settings (captured, not used by the builder)

| | Method + path | Use | Notes |
|---|---|---|---|
| R/W | `GET` / `PUT website-colors` | Palette (10 swatches) + per-theme variable mappings. | Full overwrite; GET, modify, PUT whole object. `notes/site-styles.md` |
| R/W | `GET` / `PUT website-fonts`, `GET web-fonts` | 3 master fonts + ~140 role mappings. | `notes/site-styles.md` |
| R/W | `GET template/GetTemplateTweakSettings?version=3` / `POST template/SetTemplateTweakSettings` | Buttons, Forms, Misc tweaks (flat `tweakValues` map). | **Form-encoded**, resends the whole map. |
| R/W | `GET template/GetTemplateCustomCss` / `POST template/SetTemplateCustomCss` | Custom CSS (LESS-style nesting). | **Form-encoded**, full overwrite. `notes/custom-css.md` |
| R/W | `GET config/GetInjectionSettings` / `POST config/SaveInjectionSettings` | Header/footer code injection etc. | **Form-encoded**, full overwrite of all fields. `notes/code-injection.md` |
| R | `GET commondata/GetSiteLayout` | Pages currently in navigation. | `lib/blocks/link-targets.js` |

## Block type numbers (as written by the builder)

`type: 1337` + `definitionName` for most modern blocks: `website.components.html` (heading/text),
`.code`, `.button`, `.spacer`, `.quote`, `.horizontalrule` (line), `.accordion`, `.scrolling`,
`.embed`, `.video`, `.map`, `.form`, `.socialLinks`, `.summary`.
Legacy numeric types: image `5`, gallery `8`, markdown `44`, newsletter `51`.
All 38 types with defaults: `lib/blocks/block-library.js`.

## Write-safety rules

- Anything `Save*`, `Create*`, `Set*`, `catalog-preview/*`, `content/add/*` is a write,
  whatever it sounds like. Stray test writes have created a blank section, a page called
  "dave" and nav changes on the live site.
- Full-overwrite endpoints (colors, fonts, tweaks, custom CSS, injection): always GET first
  and resend the whole thing.
- There is no staging site; tests run on the live site. Keep a preview/check step before
  any write.
