# Blogs and blog posts — working notes

Tracked from [../HANDOVER.md](../HANDOVER.md) "Next session" — whole area
was previously uncaptured. This first capture is the **collection
creation flow**, which turns out to be generic (works for adding any
collection type, page or blog) rather than blog-specific — logging it
here since blog creation is what triggered the capture, but it applies
to page creation too.

## Capture 1 — 2026-08-27: create + rename + add-to-nav flow

Four calls in sequence when adding a new collection (page or blog) via
the admin UI:

### 1. Create from catalog preset

`POST api/content/copy/collection/from-catalog-entity?catalogId=<catalogId>&catalogEntityId=<catalogEntityId>`

Body: `{}` (empty). Response is the new collection object:
```json
{
  "id": "<new collection id>",
  "websiteId": "...",
  "type": 10,
  "title": "General 1",
  "navigationTitle": "Home",
  "urlId": "general-1",
  "itemCount": 0,
  ...
}
```
- This is a **catalog-preset copy**, not a blank-collection create — the
  new collection starts pre-populated from whatever `catalogEntityId`
  points to (a starter template). `type: 10` here = plain page; a blog
  collection would have a different `type` (Reviews in this site's nav is
  `collectionType: 1`, `typeName: "blog-side-by-side"| — need a capture
  of the actual blog-creation catalog call to confirm its `catalogId`/
  `catalogEntityId` and resulting `type`).
- **This is exactly where the "always ships with default posts" problem
  lives, for blogs** — the catalog entity being copied presumably
  includes seed content items. `itemCount: 0` in this page capture is a
  coincidence of it being a plain page, not proof blogs can be created
  empty. **Still needs**: capture the actual "add blog" catalog call to
  see if `catalogEntityId` alone determines the seed content, or if
  there's a param to request zero starter items.

### 2. Generate a clean URL slug for the real title

`POST api/content-collections/<collectionId>/generate-url`

Body: `{"title": "<desired title>", "urlId": "<desired urlId>"}`
Response echoes back a slugified `urlId` plus a mostly-empty collection
shell — this looks like a **slug-availability/normalization check**, not
itself a write to the collection (the real rename happens in step 3).

### 3. Rename/reconfigure via SaveCollectionSettings

`POST api/commondata/SaveCollectionSettings` (already flagged as a write
in [../README.md](../README.md))

Body: `{"collectionData": {...full collection object, with title/
navigationTitle/urlId/fullUrl updated to the new values...}, "memberAreaData": {}}`
— confirms this is the general-purpose "update any collection's
settings" endpoint (used earlier for page rename too, per the README's
existing write-endpoint notes), not blog-specific.

### 4. Add to nav

`POST api/widget/UpdateNavigation` (already flagged as a write)

Body: `{"fieldName": "_hidden", "templateId": "<template id>", "navigation": {"items": [...full nav items array, new page prepended...]}}`
- Confirms (again) this is a **full nav-tree overwrite** — the entire
  `items` array must be resent, not just the new entry. `fieldName` seen
  as `"_hidden"` here — meaning this add landed in a hidden/unlinked nav
  area rather than a visible menu (matches: page was created via
  `/config/pages`, not dragged into a menu).

## Capture 2 — 2026-08-27: blog created with ZERO seed posts

**This solves the default-posts problem.** Captured on a different site
(`whale-horse-l4hf`, not ou.studio) — Joe hit a Squarespace bug on
ou.studio and made the test blog elsewhere instead.

Key finding: **`SaveCollectionSettings` can *create* a new collection
directly** (not just update an existing one) by POSTing a full
`collectionData` object with **no `id` field**. This is a completely
different path from Capture 1's `copy/collection/from-catalog-entity`
(which copies a seed/starter catalog entity and is presumably where the
default posts come from). Skip the catalog-copy step entirely and this
one gives you an empty blog:

`POST api/commondata/SaveCollectionSettings`

Body (no `id`, no `collectionId` — this is what makes it a create, not
an update):
```json
{
  "collectionData": {
    "description": {"html": "", "raw": false},
    "enabled": true,
    "deleted": false,
    "folder": false,
    "regionName": "default",
    "dirty": false,
    "body": null,
    "collectionType": 1,
    "supported": true,
    "supportsVideoBackgrounds": false,
    "title": "dave",
    "pageSize": 20,
    "relatedItems": false,
    "hasProductQuickView": false,
    "hasSystemBlogCollectionSettings": false,
    "forcePageSize": false,
    "eventView": 1,
    "forceEventView": false,
    "newTitle": "New Blog",
    "addText": "Add Post",
    "acceptTypes": ["text"],
    "itemLayoutTypes": [],
    "view": "list",
    "icon": "blog",
    "layout": "default",
    "index": false,
    "variation": false,
    "fullData": false,
    "systemPartials": [],
    "ordering": 2,
    "typeName": "blog-masonry",
    "navigationTitle": "dave",
    "type": 1,
    "websiteId": "<websiteId>"
  },
  "memberAreaData": { "memberAreaIds": [] }
}
```

Response — **`itemCount: 0`**, confirming no seed posts:
```json
{
  "id": "<new collection id — assigned by this call>",
  "websiteId": "...",
  "type": 1,
  "typeName": "blog-masonry",
  "title": "dave",
  "navigationTitle": "dave",
  "urlId": "dave",
  "itemCount": 0,
  "pageSize": 20,
  "eventView": 1,
  ...
}
```
Confirmed via a follow-up `GET commondata/GetCollectionSettings?collectionId=<id>`
returning the identical object, `itemCount: 0` still.

### What this means for the recipe

- **`type: 1` + `collectionType: 1` + `typeName: "blog-masonry"`** is the
  blog collection type/typeName pair (vs `type: 10` for a plain page in
  Capture 1). Other blog layout typeNames presumably exist (this site's
  ou.studio "Reviews" blog uses `blog-side-by-side` — so `typeName`
  is the blog *layout* choice, not "is it a blog" — worth capturing the
  full typeName enum later: masonry, side-by-side, classic, etc. likely).
- Skip Capture 1's steps 1–2 (catalog-copy + generate-url) entirely for a
  blog — just POST straight to `SaveCollectionSettings` with no `id`.
  `urlId` here just came out equal to `title` lowercased ("dave") without
  an explicit `generate-url` call, so slug generation might be
  client-side-only for simple titles, or the endpoint auto-slugifies
  when `urlId` is omitted (this capture's body has no `urlId` field at
  all — worth confirming which).
- Step 4 (add to nav via `UpdateNavigation`) presumably still needed
  separately to make it appear anywhere — this capture stops before that.
- **Not yet confirmed**: whether this same no-`id` `SaveCollectionSettings`
  trick also creates a seedless plain **page** (Capture 1's `type: 10`
  case), or whether that path still needs the catalog-copy step for
  pages specifically. Worth testing next time a plain page is needed.

## Capture 3 — 2026-08-27: tags, categories, post list, post shape

Three read endpoints, all scoped by `collectionId` (the blog itself):

`GET api/commondata/GetCollectionTags?collectionId=<id>`
```json
[{"name":"tag1","count":1,"modifiedOn":1787823202976}, ...]
```

`GET api/commondata/GetCollectionCategories?collectionId=<id>`
```json
[{"name":"cat1","count":1,"modifiedOn":1787823202995}, ...]
```
Same shape as tags — presumably `count` is live post count per tag/
category, `modifiedOn` is last time a post using it was saved. No create/
delete endpoint captured yet — tags/categories are likely just freeform
strings set directly on a post (see below) and these two endpoints are
read-only aggregates derived from posts, not managed as their own
entities. Worth confirming by checking whether they persist after their
one post is deleted, or vanish (aggregate) vs stick around (managed list).

`GET api/content-collections/<collectionId>/content-items?limit=20`
```json
{
  "results": [ {...post object, see below...} ],
  "hasPreviousPage": false,
  "hasNextPage": false
}
```
Standard paginated list — `limit` param confirmed, presumably `offset`/
cursor param too (unconfirmed, only one page of one item seen).

### Blog post object shape

```json
{
  "id": "<post id>",
  "websiteId": "...",
  "collectionId": "<blog id>",
  "cloned": false,
  "ghost": false,
  "recordType": 1,
  "version": 1,
  "addedOn": 1787823182774,
  "updatedOn": 1787823202964,
  "starred": false,
  "passthrough": false,
  "tags": ["tag1", "tag2"],
  "categories": ["cat2", "cat1"],
  "workflowState": 1,
  "publishOn": 1787823182774,
  "authorId": "<member account id>",
  "mediaFocalPoint": {"x": 0.5, "y": 0.5, "source": 3},
  "urlId": "title",
  "title": "title",
  "body": {
    "raw": false,
    "layout": { "columns": 12, "rows": [ /* same rows/columns/blocks shape as a page section's content.layout */ ] }
  },
  "excerpt": {"html": "", "raw": false},
  "location": {"mapZoom": 12.0, "mapLat": ..., "mapLng": ..., "markerLat": ..., "markerLng": ...},
  "customContent": null,
  "likeCount": 0, "commentCount": 0, "publicCommentCount": 0, "commentState": 2,
  "unsaved": false,
  "author": {"id": "...", "displayName": "Joe Cory", "firstName": "Joe", "lastName": "Cory", "avatarUrl": "...", "websiteUrl": "https://ou.studio", "bio": "", "avatarAssetUrl": "..."},
  "fullUrl": "/dave/title",
  "assetUrl": "https://static1.squarespace.com/static/<websiteId>/<collectionId>/<postId>/<updatedOn>/",
  "resolved": true, "dataIsResolved": false,
  "contentType": "text/html",
  "items": [],
  "pushedServices": {}, "pendingPushedServices": {}, "shareStates": [],
  "attachment": false,
  "recordTypeLabel": "text",
  "hasFileData": false
}
```

**Key confirmation from Joe: `body.layout` uses the exact same
rows/columns/blocks structure as a page section's `content.layout`** —
any block type from `lib/blocks/block-library.js` works in a post body
the same way it works in a page. This means the whole block-library
reference already built for pages applies directly to blog post content
with no translation needed — a post is really just "a page-shaped content
blob with blog metadata wrapped around it" (tags, categories, author,
publishOn, workflowState, etc.).

- `workflowState: 1` — presumably 1=published, other values for draft/
  scheduled (unconfirmed, only seen a live/published post).
- `location`/`mediaFocalPoint` fields present even though this post has
  no map or image — likely always-present defaults on the post schema,
  not evidence of a map/image feature being used.
- No create/update-post endpoint captured yet — this was all reads
  against a post created via the UI. Next capture: the actual POST/PUT
  that creates or edits a post (likely something under
  `content-collections/<id>/content-items` or similar, mirroring the
  `pages/by-collection-id/<id>` PUT pattern already known for pages).

## Capture 4 — 2026-08-27: create-post endpoint + MAIN_CONTENT section

### Create a post

`POST api/content/blogs/<collectionId>/text-posts`

Header of note: **`x-autosave: true`** — this call fires as an autosave
the moment a new post is opened in the editor (title still empty), not
on an explicit "Save"/"Publish" click. Treat this as "create a draft
shell", with further autosave POSTs (or a different PUT/update endpoint,
not yet captured) filling in title/body/tags as the user types.

Body — essentially the post object from Capture 3 but with everything
unset to `null`/empty defaults and **no `id`**:
```json
{
  "addedOn": 1787823326254,
  "publishOn": 1787823326254,
  "websiteId": "<websiteId>",
  "mediaFocalPoint": {"x": 0.5, "y": 0.5},
  "likeCount": 0, "dislikeCount": 0, "commentCount": 0, "publicCommentCount": 0,
  "workflowState": 4,
  "urlId": null,
  "proxyForId": null, "childType": null, "updatedOn": null, "unsaved": null, "title": null,
  "body": {"raw": false, "layout": {"columns": 12, "rows": []}},
  "excerpt": {"html": "", "raw": false},
  "displayIndex": 0,
  "starred": false, "passthrough": false,
  "tags": [], "categories": [],
  "systemDataId": null, "systemDataVariants": null, "systemDataOrigin": null,
  "contentType": null, "fileName": null, "dataSize": null, "sourceUrl": null,
  "mediaProcessingState": null, "colorData": null, "clickThroughUrl": null,
  "customContent": null,
  "authorId": "<member id>",
  "category": null,
  "commentState": 2,
  "recordType": 1,
  "collectionId": "<blog id>",
  "location": {"mapLat": ..., "mapLng": ..., "mapZoom": 12, "markerLat": ..., "markerLng": ...}
}
```

Response — server fills in the real values:
```json
{
  "recordType": 1,
  "id": "<new post id>",
  "collectionId": "<blog id>",
  "assetUrl": "https://static1.squarespace.com/static/<websiteId>/<collectionId>/<postId>/<updatedOn>/",
  "fullUrl": "/dave/9fq5cxyc432g0g0d69ia95g0n73z6q",
  "title": "",
  "body": {"raw": false, "layout": {"columns": 12, "rows": []}},
  "addedOn": 1787823326404, "updatedOn": 1787823326404,
  "publishOn": 1787823326254,
  "workflowState": 4,
  "urlId": "9fq5cxyc432g0g0d69ia95g0n73z6q",
  "unsaved": true,
  ...
}
```
- **`workflowState: 4`** on a brand-new, untitled, unpublished post —
  revises the Capture-3 guess (`1` was seen on an already-published post,
  guessed as "published"). So `4` is likely "draft/new" and `1` is
  "published"; still need the other states (scheduled? unlisted?) to
  fill out the enum.
- **`urlId` is server-auto-generated** (`9fq5cxyc432g0g0d69ia95g0n73z6q`
  — a random slug) when not supplied — real title-based slugs presumably
  get set later via an update call once the user types a title, mirroring
  how `generate-url` worked for collections in Capture 1.
- `unsaved: true` in the response is notable — even though this POST just
  wrote the post, the server still flags it unsaved, consistent with this
  being an autosave/draft-shell create rather than a real "save" action.
- Endpoint path (`content/blogs/<id>/text-posts`) is post-type-specific —
  "text-posts" implies sibling endpoints per post type exist, e.g.
  `image-posts`/`video-posts`/`quote-posts`/`link-posts` (standard
  Squarespace blog post types) — unconfirmed, worth capturing one of each
  if that becomes relevant.

### MAIN_CONTENT section (the post's own "page")

`GET api/page-sections/<pageSectionsId>`

Note: `<pageSectionsId>` here (`...8144`) is a **different id** from the
`collectionId` (`...8142`) — one more than the collection id numerically
in this capture, but treat that as coincidence, not a derivation rule,
until confirmed with a second example.

```json
{
  "id": "<pageSectionsId>",
  "websiteId": "...",
  "collectionId": "<blog id>",
  "sections": [
    {
      "sectionName": "MAIN_CONTENT",
      "id": "<section id>",
      "isCloneable": false,
      "styles": {
        "backgroundWidth": "background-width--full-bleed",
        "imageOverlayOpacity": 0.15,
        "sectionHeight": "section-height--medium",
        "customSectionHeight": 10,
        "horizontalAlignment": "horizontal-alignment--center",
        "verticalAlignment": "vertical-alignment--middle",
        "contentWidth": "content-width--wide",
        "customContentWidth": 50,
        "sectionTheme": "",
        "sectionAnimation": "none",
        "backgroundMode": "image"
      },
      "sourceType": "unknown"
    }
  ],
  "updatedOn": 1787823182904
}
```
- Confirms blog posts have their **own section wrapper**
  (`sectionName: "MAIN_CONTENT"`, not `LAYOUT_ENGINE`) using the exact
  same `styles` vocabulary already documented in
  [section-settings.md](section-settings.md) — so section-level styling
  (height/width/alignment/theme/background) is a shared system across
  pages, footer, and blog posts, just under different `sectionName`
  values depending on context (`LAYOUT_ENGINE` for page/footer sections,
  `MAIN_CONTENT` for a post's own content area).
- This appears to be a per-collection singleton (one `MAIN_CONTENT`
  section config governing how every post in this blog displays its
  body), separate from the actual post content (`body.layout` on the
  post object itself, which holds the blocks). i.e. this endpoint
  controls the *container* styling around a post's content, not the
  content.
- `sourceType: "unknown"` here vs `"blank"` seen on page sections —
  possibly because this was never explicitly created/edited by a user
  (system default), unconfirmed.

## Capture 5 — 2026-08-27: update/publish a post (the missing piece)

`PUT api/content/blogs/<collectionId>/text-posts/<postId>`

This is the call fired when editing title/body and saving — completes
the create→edit round trip from Capture 4. Confirms the endpoint family
is `content/blogs/<collectionId>/text-posts[/<postId>]`: **POST** (no id
in path) to create, **PUT** (id in path) to update.

Request body — same post object, now with real content:
```json
{
  "recordType": 1,
  "id": "<post id>",
  "collectionId": "<blog id>",
  "title": "gfg",
  "body": {
    "layout": {
      "columns": 12,
      "rows": [{"columns": [{"span": 12, "blocks": [
        {"type": 1337, "id": "<block id>", "value": {"html": "...", "source": "..."}, "definitionName": "website.components.html"}
      ]}]}],
      "legacyPromotedLayout": true,
      "promotedBlockId": null,
      "collectionId": null,
      "parentItemId": "<post id>",
      "span": 12
    }
  },
  "excerpt": {"html": "", "raw": false},
  "addedOn": 1787823326404, "updatedOn": 1787823326404,
  "publishOn": 1787823496590,
  "starred": false, "passthrough": false,
  "workflowState": 1,
  "location": {...same map defaults...},
  "urlId": "9fq5cxyc432g0g0d69ia95g0n73z6q",
  "customContent": null,
  "authorId": "<member id>",
  "unsaved": true,
  "tags": [], "categories": [],
  "contentType": "text/html",
  "shareStates": [],
  "commentState": 2, "commentCount": 0,
  "mediaFocalPoint": {"x": 0.5, "y": 0.5, "source": 3}
}
```

Response — server normalizes and confirms the save:
```json
{
  "recordType": 1,
  "id": "<post id>",
  "collectionId": "<blog id>",
  "assetUrl": "...",
  "fullUrl": "/dave/gfg",
  "title": "gfg",
  "body": {"raw": false, "layout": {"columns": 12, "rows": [...]}},
  "addedOn": 1787823496590, "updatedOn": 1787823496760,
  "publishOn": 1787823496590,
  "workflowState": 1,
  "urlId": "gfg",
  "unsaved": false,
  ...
}
```

Key findings:
- **`workflowState` went from `4` (Capture 4, empty draft shell) to
  `1` on this save** — confirms the Capture-3 guess: `1` = published/
  saved, `4` = new/unsaved draft. Still don't have a "scheduled" or
  explicit "draft, not yet published" state captured (this PUT appears to
  auto-publish on save rather than there being a separate publish step —
  worth confirming whether there's a way to save-as-draft, i.e. keep
  `workflowState: 4` through an edit, or if that's UI-gated by
  `publishOn` being in the future instead).
- **`urlId` regenerated from the title on save** (`9fq5cxyc...` random
  slug → `gfg`, slugified from `title: "gfg"`) — confirms the earlier
  guess in Capture 4 that the real slug gets set once a title exists,
  same auto-slugify behavior seen for collections in Capture 1's
  `generate-url` step, but here it happens for free as a side effect of
  the PUT rather than a separate call.
- **`body.layout` carries three extra sibling keys** beyond
  `columns`/`rows` in the *request* — `legacyPromotedLayout: true`,
  `promotedBlockId: null`, `collectionId: null` (redundant/always-null
  here, distinct from the post's own top-level `collectionId`),
  `parentItemId: "<post id>"` (self-referential), `span: 12`. **The
  response strips all of these back out**, returning only
  `{raw, layout: {columns, rows}}` — so on future writes it's safe to
  omit them and just send `{layout: {columns, rows}}`, though keeping
  them (as captured) is known-safe since that's what actually happened
  here. Worth a follow-up test sending a PUT *without* these fields to
  confirm they're truly optional vs silently required.
- addedOn/updatedOn/publishOn all got reset to the PUT's timestamp
  (1787823496590/760) rather than keeping the original addedOn from
  Capture 4 (1787823326404) — so **`addedOn` is not immutable across
  saves** at least while the post is still in its unsaved/draft state;
  unconfirmed whether editing an already-published post also bumps
  `addedOn`, or only does this for the first real save out of the draft
  shell.

## Open questions for next capture

- The actual blog-creation `catalogId`/`catalogEntityId` pair (this
  capture's `catalogId=69a5bd761c2fd50fbfc10655` may or may not be the
  page-catalog vs blog-catalog — need to watch the network tab specifically
  clicking "Blog" in the add-page picker).
- Whether the seed blog posts are separate content items created by the
  catalog-copy call (in which case: capture their content item ids from
  the response or a follow-up `GetCollection`/items-list call, then a
  delete-content-item call could clear them programmatically) or baked
  into collection config some other way.
- Confirm there's no "create empty" flag/param on the catalog-copy call
  before assuming a delete-after-create workaround is the only path.
</content>
