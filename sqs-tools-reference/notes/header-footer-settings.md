# Site-wide header/footer settings — working notes

Captured from the site-config endpoint that returns `{ header, footer }`
together. Confirms footer content is sections-based just like a page
(same `LAYOUT_ENGINE` section shape, any block type allowed) but stored
under `footer.sections[]` rather than a page's `regions[].sections[]` —
no `regionId`/`parentSectionId` on footer sections since it's not part of
the page-region system.

## Capture 1 — 2026-08-25

### `header` object

Top-level site nav/header config, separate from any page content.

- `layout`: `navRight` | `navLeft` | `navCenter` (nav position relative
  to logo — all 3 confirmed)
- `action`: CTA button — `href` (e.g. `mailto:...?subject=...`),
  `buttonText`, `newWindow`
- `showSocial` / `socialOptions`: social icons toggle +
  `socialBorderShape` (`none`), `socialBorderStyle` (`outline`),
  `socialBorderThickness` (`{unit: "px", value}`)
- `sectionTheme`: same theme vocabulary as page sections (seen `black`
  here) — header has its own theme independent of page section themes
- `menuOverlayAnimation`: `fade`
- `cartStyle`: `cart`, `cartText`: `Cart`, `showEmptyCartState`: bool
- `cartOptions`: `iconType` (`solid-7`), border shape/style/thickness
  (same pattern as socialOptions)
- `showButton` / `showCart` / `showAccountLogin`: visibility toggles
  (all `false` in this capture — studio site has none of these enabled)
- `headerStyle`: `theme` (vs presumably `solid`/`gradient` given the
  sibling `solidOptions`/`gradientOptions` blocks below)
- `languagePicker`: `enabled`, `iconEnabled`, `iconType` (`globe`),
  `flagShape` (`shiny`), `languageFlags: []`
- `iconOptions`: desktop/mobile dropdown icon config — `size`,
  `iconSpacing`, `strokeWidth` (all `{unit, value}` pairs), `endcapType`
  (`square`), `folderDropdownIcon`, `languagePickerIcon`
  (`openArrowHead`/`none`)
- `mobileOptions`: `layout` (`logoLeftNavRight`), `menuIconOptions.style`
  (`doubleLineHamburger`), `thickness`
- `solidOptions` / `gradientOptions`: alternate header background modes,
  each with `headerOpacity` (`{unit: "%", value}`), `blurBackground`
  (`enabled` + `blurRadius`), `backgroundColor`/`navigationColor` as
  color objects — see **Color object shape** below.
  `gradientOptions` additionally has `gradientType` (`faded`).
- `dropShadowOptions`: `enabled`, `blur`, `spread`, `distance` (all `px`)
- `borderOptions`: `enabled`, `position` (`allSides`), `thickness`,
  `color`
- `showPromotedElement`: bool
- `buttonVariant`: `primary`
- `blurBackground` / `headerOpacity`: top-level duplicates of the ones
  nested in `solidOptions` — likely the "currently active" values that
  mirror whichever style mode is selected

### Color object shape

Two variants seen:
```
{ type: "SITE_PALETTE_COLOR", sitePaletteColor: { colorName: "white", alphaModifier: 1.0 } }
{ type: "CUSTOM_COLOR", customColor: { hslaValue: { hue, saturation, lightness, alpha }, userFormat: "hex" } }
```
Values wrapped `{unit, value}` recur everywhere (px/em/%/vw) — treat as a
universal dimension type across header/footer/section config, not
section-styles-specific.

### `footer.sections[]`

Same `LAYOUT_ENGINE` section object as a page section (`content.layout`
with `rows[].columns[].blocks[]`, any block `definitionName` allowed —
this capture uses `spacer` and `html` blocks, e.g. click-to-call/email
links and a scaled-text "LET'S TALK" heading). Differences from page
sections:
- No `regionId` / `parentSectionId` (footer isn't part of the page
  region system)
- `customId` here follows an `f-1`, `f-2`... convention (vs `section-1`
  for pages)
- `divider` has its **full shape** even when `enabled: false`:
  ```
  divider: {
    enabled: false,
    type: "wavy",
    width: { unit: "vw", value: 100.0 },
    height: { unit: "vw", value: 6.0 },
    isFlipX: false, isFlipY: false,
    offset: { unit: "px", value: 0.0 },
    stroke: {
      style: "solid",
      color: { type: "THEME_COLOR" },
      thickness: { unit: "px", value: 6.0 },
      dashLength: { unit: "px", value: 5.0 },
      gapLength: { unit: "px", value: 15.0 },
      linecap: "square"
    }
  }
  ```
  This is new info vs [section-settings.md](section-settings.md) capture
  1, which only ever saw the collapsed `{enabled: false}` form — good
  confirmation that the full divider config persists even while toggled
  off, and `THEME_COLOR` is a third color-object `type` alongside
  `SITE_PALETTE_COLOR`/`CUSTOM_COLOR`.

### Field ranges (from Joe, not yet seen varied in a raw capture)

- Link spacing and element spacing (nav link gaps / `iconSpacing`-type
  fields): **1px–100px**
- `dropShadowOptions` / `borderOptions`: not worth capturing variants —
  ignore, standard shadow/border config
- `fixed` (sticky header): **on/off** — field not yet seen in a raw
  capture, presumably a top-level `header.fixed` boolean
- Header height: **5px–200px** — field not yet seen in a raw capture
  (top-level `header` config, not to be confused with `sectionHeight`
  which is a page-section field)
- Header width: **full or inset** — same vocabulary as page section
  `backgroundWidth` (`background-width--full-bleed` /
  `background-width--inset`), field not yet seen in a raw capture

### Still open

- Full enum for `headerStyle` (only `theme` seen; `solidOptions`/
  `gradientOptions` presence implies `solid`/`gradient` modes exist)
- `divider.type` enum beyond `wavy`
- Whether footer supports multiple regions/only one, and whether it has
  its own top-level `styles`-per-section pattern identical to page
  sections (looks identical from this capture)
- Raw capture confirming `fixed`, header height, and header width field
  names/paths in the actual JSON (currently only known from Joe's
  description, not a live capture)
</content>
