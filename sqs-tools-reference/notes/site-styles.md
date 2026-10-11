# Site Styles

The Site Styles editor (`/config/site-styles/...`) is the sitewide styling
panel — Joe sees it split into **Fonts, Colors, Buttons, Forms,
Miscellaneous**. Unlike per-section `styles` (see
[section-settings.md](section-settings.md)) or the header config
([header-footer-settings.md](header-footer-settings.md)), this system
affects the whole site at once. Flagged in HANDOVER.md as expected to be
confusing — going one section at a time as captures come in.

**Colors** and **Fonts** confirmed so far. Buttons/Forms/Miscellaneous
still need their own captures (their load call and a save action each).

## Colors — CONFIRMED via live capture

Colors is its own endpoint, **separate from the generic `templateTweaks`
tweak system** seen incidentally in a `window.Static.SQUARESPACE_CONTEXT`
dump during other work. It directly edits the definitions of the 10 named
section-background themes already noted as an enum in
[section-settings.md](section-settings.md) (`white`, `white-bold`, `light`,
`light-bold`, `dark`, `dark-bold`, `black`, `black-bold`, `bright`,
`bright-inverse`) — so "Colors" in Site Styles *is* the theme editor for
those.

```
GET  /api/website-colors
PUT  /api/website-colors   (write — x-csrf-token required; GET does not send it)
```

Referrer on both: `/config/site-styles/colors/theme-editor`.

Response/PUT-body shape:

```js
{
  "palette": [
    // ~10 base swatches. "safe*" ones appear to be accessibility-derived
    // variants (e.g. guaranteed contrast against their paired color).
    { "id": "white",                 "value": { "values": { "hue": 0,   "saturation": 0,  "lightness": 98 }, "userFormat": "hex" } },
    { "id": "lightAccent",           "value": { "values": { "hue": 203, "saturation": 29, "lightness": 85 }, "userFormat": "hex" } },
    { "id": "accent",                "value": { "values": { "hue": 217, "saturation": 37, "lightness": 49 }, "userFormat": "hex" } },
    { "id": "darkAccent",            "value": { "values": { "hue": 216, "saturation": 37, "lightness": 20 }, "userFormat": "hex" } },
    { "id": "black",                 "value": { "values": { "hue": 0,   "saturation": 0,  "lightness": 11 }, "userFormat": "hex" } },
    { "id": "safeLightAccent",       "value": { ... } },
    { "id": "safeDarkAccent",        "value": { ... } },
    { "id": "safeInverseAccent",     "value": { ... } },
    { "id": "safeInverseLightAccent","value": { ... } },
    { "id": "safeInverseDarkAccent", "value": { ... } }
  ],
  "colorThemes": [
    {
      "themeName": "white",   // matches the section styles theme enum
      "mappings": [
        // one entry per CSS color variable used ANYWHERE on the site —
        // hundreds of entries (buttons, every block type's text/bg/stroke
        // colors, header, announcement bar, blog/portfolio/product
        // variants, etc.)
        {
          "variableName": "primaryButtonBackgroundColor",
          "paletteColorMapping": { "colorName": "black", "alphaModifier": 1 }
          // optional — overrides the palette reference with a literal
          // color instead (seen once, on dark-bold's siteBackgroundColor):
          // "customColor": { "values": { "hue": 300, "saturation": 86.45, "lightness": 50.78, "alpha": 1 }, "userFormat": "hex" }
        },
        { "variableName": "siteBackgroundColor", "paletteColorMapping": { "colorName": "white", "alphaModifier": 1 } },
        { "variableName": "headingLargeColor", "paletteColorMapping": { "colorName": "black", "alphaModifier": 1 } },
        // ...
      ]
    },
    { "themeName": "white-bold", "mappings": [...] },
    { "themeName": "light", "mappings": [...] },
    { "themeName": "light-bold", "mappings": [...] },
    { "themeName": "dark", "mappings": [...] },
    { "themeName": "dark-bold", "mappings": [...] },
    { "themeName": "black", "mappings": [...] },
    { "themeName": "black-bold", "mappings": [...] },
    { "themeName": "bright", "mappings": [...] },
    { "themeName": "bright-inverse", "mappings": [...] }
  ],
  "defaultTheme": "white"
}
```

Key points:
- Every `variableName` maps to a `paletteColorMapping` (a reference to one
  of the 10 `palette` swatches by `id`, plus an `alphaModifier` 0–1) OR,
  when the user has manually picked a custom color for that one variable
  in that one theme, an additional `customColor` field (a literal HSL
  value) that overrides the palette reference.
- The `palette` array is what the "5 swatches on the left" of the Colors
  UI edits — change `lightAccent`'s hue/sat/light and every theme's
  mappings that reference `lightAccent` update at once, which is the
  point of the indirection.
- `variableName`s are literally the site's live CSS custom-property names
  — no translation layer, they can be cross-referenced directly against
  rendered page CSS.
- PUT resends the **entire object** (palette + all colorThemes + default)
  — full-field overwrite like Custom CSS / injection settings, not a
  per-field patch. GET first, mutate, PUT the whole thing back.
- `defaultTheme` is presumably which theme new sections/pages start on.
- Every `variableName` in `colorThemes[].mappings` has a human label and
  UI category grouping — see
  [color-variable-labels.md](color-variable-labels.md) for the full
  confirmed ~313-variable/62-category taxonomy, captured from the live
  per-theme editor DOM.

## Fonts — CONFIRMED via live capture

Fonts is also its own dedicated endpoint, separate from `templateTweaks`
and separate from Colors:

```
GET  /api/website-fonts    (load — captured referrer/headers only, body not
                             grabbed yet; shape is presumably identical to
                             the PUT body below, same as Colors)
PUT  /api/website-fonts    (write — x-csrf-token required)
GET  /api/web-fonts        (captured alongside — no request body, referrer
                             is also .../config/site-styles/fonts; this is
                             almost certainly the picker's list of
                             available font families to choose from, not
                             the site's current font settings — response
                             body not yet captured to confirm)
```

Referrer on all three: `/config/site-styles/fonts`.

PUT-body shape:

```js
{
  "name": "system-sans",   // font-system preset id (site was on this preset)
  "baseFontSize": 17,
  "masterFonts": [
    // the 3 root font definitions everything else maps to
    {
      "name": "heading-font",
      "fontValue": {
        "fontFamily": "Montserrat",
        "fontStyle": "normal",
        "fontWeight": 100,
        "textTransform": "none",
        "letterSpacing": { "value": 0.03, "unit": "em" },
        "lineHeight": { "value": 2.3, "unit": "em" }
      }
    },
    { "name": "body-font", "fontValue": { "fontFamily": "Montserrat", "fontWeight": 400, ... } },
    { "name": "meta-font", "fontValue": { "fontFamily": "Montserrat", "fontWeight": 400, ... } }
  ],
  "masterSizes": [
    // the base type-scale steps, referenced by name from fontMappings
    { "name": "heading-1-size",  "value": { "value": 3.55556, "unit": "rem" } },
    { "name": "heading-2-size",  "value": { "value": 2.8,     "unit": "rem" } },
    { "name": "heading-3-size",  "value": { "value": 2.4,     "unit": "rem" } },
    { "name": "heading-4-size",  "value": { "value": 2,       "unit": "rem" } },
    { "name": "large-text-size", "value": { "value": 1.4,     "unit": "rem" } },
    { "name": "normal-text-size","value": { "value": 1,       "unit": "rem" } },
    { "name": "small-text-size", "value": { "value": 0.8,     "unit": "rem" } },
    { "name": "normal-meta-size","value": { "value": 0.9,     "unit": "rem" } }
  ],
  "fontMappings": [
    // one entry per named UI text role, site-wide (~140 entries) — buttons,
    // nav, every block type's text roles, blog/product/course/video/portfolio
    // variants, etc. Same indirection pattern as Colors' colorThemes.
    {
      "name": "site-navigation-font",
      "fontMapping": "heading-font",     // which masterFonts entry to use
      "sizeMapping": "normal-text-size"  // which masterSizes entry to use
      // optional overrides, seen on ~1/3 of entries:
      // "customFontValue": { fontFamily, fontStyle, fontWeight, textTransform, letterSpacing, lineHeight }
      // "customSizeValue": { "value": 2, "unit": "rem" }
    },
    // ...
  ]
}
```

Key points:
- Same two-layer indirection as Colors: a small set of named roots
  (`masterFonts` × `masterSizes`, analogous to Colors' `palette`) that
  every UI text role (`fontMappings`, analogous to `colorThemes.mappings`)
  references by name — change a masterFont/masterSize and every mapping
  pointing at it updates at once.
- Only 3 `masterFonts` roles exist (`heading-font`, `body-font`,
  `meta-font`) vs Colors' 10 palette swatches — a much smaller root set.
- `fontMapping`/`sizeMapping` are the reference; `customFontValue`/
  `customSizeValue` are literal overrides for one specific UI role,
  exactly mirroring Colors' `paletteColorMapping` vs `customColor`.
- The 3 button-font roles (`primary-button-font`, `secondary-button-font`,
  `tertiary-button-font`) all carry an identical `customFontValue`
  (uppercase, 600 weight, 0.15em tracking) distinct from body-font's
  defaults — buttons get their own typographic treatment even on a preset
  where every masterFont is nominally the same family.
- `baseFontSize` (17 here) is presumably the rem root driving the `rem`
  units used throughout `masterSizes`.
- `name: "system-sans"` at the top level looks like the font-system
  preset identifier — unconfirmed whether Squarespace exposes a fixed
  list of these presets or it's freeform once customized.
- PUT resends the **entire object**, same full-overwrite pattern as
  Colors/Custom CSS — GET first, mutate, PUT the whole thing back.
- **CONFIRMED**: `/api/website-fonts` GET response matches the PUT body
  shape exactly (same object back). `/api/web-fonts` response body still
  not captured — presumed to be the picker's available-font-family list.

## Buttons, Forms, Miscellaneous — CONFIRMED as `templateTweaks` system

Unlike Colors and Fonts, **Buttons, Forms, and Miscellaneous are not
dedicated endpoints** — they're all just views onto the generic
template-tweak system (see the Aside below, which had already flagged
this as the likely mechanism from an incidental context dump). Now
confirmed with a clean isolated load + save capture:

```
GET  /api/template/GetTemplateTweakSettings?version=3
POST /api/template/SetTemplateTweakSettings   (write — NOT a PUT, see below)
```

Referrer varies by panel (`/config/site-styles/buttons/primary`,
`/config/site-styles/forms`, etc.) — same two endpoints service all of
Buttons/Forms/Miscellaneous regardless of which panel is open; the panel
only determines which `variableName`s the UI surfaces.

**GET response shape:**

```js
{
  "tweakDefinitions": [
    // read-only schema — NOT sent back on save. One entry per control,
    // site-wide (hundreds), e.g.:
    {
      "type": 5,                 // control type: 5=range/slider, 8=dropdown/segmented,
                                  // 9=boolean, 1=color picker (numeric enum, meaning inferred)
      "category": "Site",        // groups controls into a Site Styles panel section;
                                  // absent entries are Forms (grouped by name prefix instead)
      "title": "maxPageWidth",
      "label": "Page Width (Max)",
      "variableName": "maxPageWidth",   // the key used in templateTweaks/tweakValues
      "defaultValue": "1500px",
      "min": 800.0, "max": 3000.0, "step": 1.0,
      "options": [...], "optionsLabels": [...],  // for dropdown/segmented types
      "target": ".some-selector",        // CSS target the tweak applies to, when scoped
      "showOnlyWhenPresent": ".some-selector",  // UI-visibility gate, not data-relevant
      "tweakFilter": "site-spacing",     // internal grouping tag, distinct from category
      "variableType": "css" | "less",    // which stylesheet layer the variable feeds
      "isMobileTweak": false,
      "isBlogMetadataTweak": false
    },
    // ...
  ],
  "presets": [
    // read-only — factory/theme starting points, NOT sent back on save
    { "title": "Default", "templateTweaks": { /* variableName -> value, same flat map shape as tweakValues */ } }
  ],
  "tweakValues": {
    // THE part that round-trips: flat variableName -> current value map,
    // one entry per tweak the site has ever touched (not necessarily
    // every tweakDefinitions entry — untouched ones just use defaultValue)
    "maxPageWidth": "1200px",
    "form-field-style": "Outline",
    "primary-button-shape": "Square",
    "tweak-global-animations-enabled": "true",
    // includes a stray "undefined": "{}" entry, seen consistently —
    // looks like a UI artifact baked into the value map, harmless to
    // round-trip as-is but don't hand-author it from scratch
    // ...
  },
  "siteThemeSettings": { "formPackId": 3 }  // small sibling object, also round-tripped
}
```

**POST body** (`SetTemplateTweakSettings`) — note this is a POST with
`application/x-www-form-urlencoded` body, NOT a PUT with a JSON body like
every other Site Styles endpoint:

```
tweakJson=<URL-encoded JSON string of the entire tweakValues map>
&siteThemeSettings=<URL-encoded JSON string of the siteThemeSettings object>
```

Response: `{"success": true}` — no echoed state back.

Key points:
- **Full-map overwrite, not a partial patch** — `tweakJson` on save was
  the complete `tweakValues` map from the GET (all ~300+ keys), not just
  the one tweak that was actually changed in the UI. Same full-overwrite
  discipline as Colors/Fonts: GET first, mutate the one key you want,
  re-encode and POST the whole map back.
- `tweakDefinitions` and `presets` are schema/reference only — read from
  GET, never sent back. Only `tweakValues` and `siteThemeSettings` round-trip.
- This is a **different transport** from Colors/Fonts (form-urlencoded
  POST with JSON-stringified params, vs. a plain JSON-body PUT) — don't
  assume the same request-building helper works for both without
  adjusting method/content-type/encoding.
- Confirms the Aside's hypothesis exactly: `category: "Site"` ungrouped
  entries (`maxPageWidth`, `pagePadding`) are Miscellaneous; `category:
  "Buttons"` entries are Buttons; entries with no `category` at all,
  named with a `form-field-*`/`form-*` prefix, are Forms.
- The GET and POST captured here weren't a matched before/after pair
  (just two calls grabbed at different points during general poking
  around) — so the large diff between their `tweakValues` snapshots
  (extra Buttons/Portfolio/animation values changed beyond the one Forms
  setting visibly edited) is just other edits made in between, not
  save-time normalization by Squarespace. Not a real mystery, just an
  artifact of how the capture was taken. Still worth a clean single-
  control before/after diff at some point to be certain nothing gets
  silently rewritten on save (e.g. unit conversions), but this isn't
  urgent.

## Aside: `templateTweaks` / `tweakDefinitions` schema (CONFIRMED relevant)

A `window.Static.SQUARESPACE_CONTEXT` dump captured incidentally during
`build-test-page.js` work contains `templateInstallation.templateTweaks`
(flat `variableName → current value` map) and `template.tweakDefinitions`
(a parallel array of full control definitions — type, category, label,
variableName, defaultValue, min/max/step, options, target selector,
tweakFilter, isMobileTweak, variableType `css`/`less`) covering dozens of
per-component controls grouped by `category` (`Site`, `Header`, `Buttons`,
`Blog: List`, `Portfolio Grid: *`, `Image Block: *`, `Global Animations`,
etc.). **Confirmed** this is the schema behind Buttons/Forms/Miscellaneous
via `GetTemplateTweakSettings`/`SetTemplateTweakSettings` above — Forms
has no explicit category tag, grouped by `form-field-*` name prefix
instead; Miscellaneous is the ungrouped `category: "Site"` entries like
`maxPageWidth`, `pagePadding`. Still only seen via the incidental full
context dump, not a clean isolated GET/PUT capture of the tweak-settings
endpoints themselves — see the note above about what's still open there.
