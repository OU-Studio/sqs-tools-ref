# Section-level settings — working notes

Raw captures of the `styles` object on a `LAYOUT_ENGINE` section (i.e.
section-level display settings, as distinct from block content). Logging
captures here as they come in; once coverage feels complete this should
become a proper `lib/sections/section-styles.js` reference file mirroring
`lib/blocks/block-library.js`.

## Capture 1 — 2026-08-25

Source: a `pages/by-collection-id` GET response containing 22 test
sections under one region, each isolating one style dimension (plus a
first section that's just a spacer with defaults).

### Section object shape (LAYOUT_ENGINE)

```
{
  sectionName: "LAYOUT_ENGINE",
  id: <section id>,
  isCloneable: false,
  backgroundImageId: <optional, when backgroundMode: "image" with a real image>,
  video: {
    assetContentItemId: <optional, when backgroundMode: "video">,
    playbackSpeed: 1, filter: 1, filterStrength: 0, zoom: 0
  },
  styles: { ...see below },
  customId: <optional, e.g. "section-1">,
  sourceType: "blank",
  regionId: <region id>,
  parentSectionId: <id — legacy PageSections-era parent ref, distinct from `id`>,
  content: { raw: false, layout: { columns: 12, rows: [...] } },
  backgroundMediaEffect: { type: "none" },
  divider: { enabled: false }
}
```

### `styles` fields and confirmed values

- **`sectionHeight`**: `section-height--small` | `section-height--medium` |
  `section-height--large` | `section-height--custom`
  - `customSectionHeight`: number — only meaningful when `sectionHeight`
    is `--custom`; seen `10` (ignored, default carry-over) and `100`
    (actual custom value in vh or %, TBD which unit).
- **`contentWidth`**: `content-width--narrow` | `content-width--medium` |
  `content-width--wide` | `content-width--custom`
  - `customContentWidth`: number, percent — seen `50`, `30`, `100`.
- **`backgroundWidth`**: `background-width--full-bleed` |
  `background-width--inset`
- **`horizontalAlignment`**: `horizontal-alignment--left` |
  `horizontal-alignment--center` (right not yet captured, presumably
  `horizontal-alignment--right`)
- **`verticalAlignment`**: `vertical-alignment--top` |
  `vertical-alignment--middle` | `vertical-alignment--bottom`
- **`backgroundMode`**: `image` | `video`
- **`imageOverlayOpacity`**: number 0–1 — seen `0.15` (default-ish), `0.0`
  (no overlay, used with a real `backgroundImageId`), `0.9` (heavy
  overlay, used with `background-width--inset` + real image/video)
- **`sectionTheme`**: `""` (none/inherit) | `white` | `white-bold` |
  `light` | `light-bold` | `bright-inverse` | `bright` | `dark` |
  `dark-bold` | `black` | `black-bold`
  — 10 named themes total, each with a plain and `-bold` variant except
  `bright-inverse` which has no bold pair captured.
- **`sectionAnimation`**: `none` (only value seen so far)

### Other observations

- Every test section in this capture has empty/placeholder content — either
  a bare `website.components.spacer` block or an `website.components.html`
  block with `html: "<p>&nbsp;</p>"`. Confirms section styling is fully
  independent of block content.
- `divider: { enabled: false }` present on every section — divider-enabled
  variant not yet captured.
- `backgroundImageId` and `video.assetContentItemId` are sibling fields on
  the section object itself (not inside `styles`) — set only when
  `backgroundMode` matches.
- Sections mixing `backgroundWidth--inset` with `imageOverlayOpacity: 0.9`
  suggest that's a common "framed, dimmed background" combo in the
  studio's practice.

### Still open

- Which unit `customSectionHeight` / `customContentWidth` are in when
  actually driving layout (vh vs px vs %) — need a section where the
  custom value differs meaningfully and visually confirm.
- `horizontal-alignment--right` unconfirmed.
- Divider-enabled example.
- Whether `sectionTheme: ""` truly means "inherit site theme" or is its
  own distinct "none" state.
</content>
</invoke>
