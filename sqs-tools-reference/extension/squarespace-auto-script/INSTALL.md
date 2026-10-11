# Page Builder for squarespace-auto-script

Two changes to your existing extension folder:
1. Add `page-builder.js` (new file, next to `ui-tweaks.js`).
2. In `manifest.json`: `"js": ["ui-tweaks.js", "page-builder.js"]` (and version bump to 1.0.8). `ui-tweaks.js` is unchanged.

Then reload the extension at chrome://extensions and refresh a /config page.
A "Build" button appears in the toolbar after CSS / JS / Pages (floating "+ Build page" button if the toolbar isn't on that screen).
Popup: paste spec JSON (code fences stripped) -> Check (no writes) or Build (new unlinked page). "Copy spec guide" copies the model system-prompt text.
