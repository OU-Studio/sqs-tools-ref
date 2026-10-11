# Notes for Claude

This repo is Joe's (Onwards & Upwards) reference for the Squarespace 7.1 private admin API
and the spec → page builder built on it.

Read first, in order:
1. `HANDOVER-CURRENT.md` — status, decisions, gotchas, how-tos.
2. `docs/SPEC-FORMAT.md` — the spec the builder accepts.
3. `docs/API-ENDPOINTS.md` — every endpoint learned.

Rules:
- Never guess API shapes. Ask Joe for a DevTools capture of the action done by hand.
- Never commit CSRF tokens, cookies or other session values from captures; scripts read
  the `crumb` cookie at runtime.
- Ids are 24-char lowercase hex. Use the target page's own region id.
- Treat any `Save*`/`Set*`/`Create*`/`catalog-preview`/`content/add` endpoint as a live write.
- `builder/page-builder.js` is the core; `extension/squarespace-auto-script/page-builder.js`
  is the same core plus the popup UI appended. Change both, bump the manifest version, rezip.
