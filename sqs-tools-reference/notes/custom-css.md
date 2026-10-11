# Custom CSS field — working notes

## Endpoint

`GET https://<site>.squarespace.com/api/template/GetTemplateCustomCss`

Response shape:
```json
{ "css": "<entire custom CSS field content as one string>" }
```

### Write endpoint — confirmed

`POST https://<site>.squarespace.com/api/template/SetTemplateCustomCss`

- Body is `application/x-www-form-urlencoded`, single field:
  `css=<url-encoded full CSS string>` — **not JSON**, unlike the GET
  response. This breaks the `Get*`/`Save*` JSON-body convention noted in
  [../README.md](../README.md) ("Write-endpoint safety notes") — name is
  `Set*` not `Save*`, and payload is form-encoded not JSON.
- This is a **full overwrite** — the entire CSS field content goes in one
  `css` param each time, no diffing/patching. Any script writing to this
  must GET the current value first, append/modify, then POST the whole
  result back, or it'll clobber the rest of the custom CSS.
- Add `SetTemplateCustomCss` to the write-endpoint exclude list style
  (form-encoded whole-field overwrite — treat with the same
  preview/confirm-before-write caution as other write endpoints).

## Syntax confirmed

The custom CSS field is **not plain CSS** — it accepts LESS-style nested
syntax, which Squarespace compiles server-side before serving:

- **Nested selectors** — a rule can contain child selectors directly,
  compiled to the descendant-combinator equivalent:
  ```less
  footer{
    background: linear-gradient(...);
    #f-1{
      .section-border{ display: none !important; }
    }
  }
  ```
- **`&` parent-reference** for pseudo-elements/pseudo-classes:
  ```less
  .blog-more-link{
    &:after{ display: none !important; }
  }
  ```
- **`@media` blocks nested inside a rule**, not just at top level:
  ```less
  h1{
    font-size: 89.9px !important;
    @media all and (max-width: 1300px){
      font-size: 68px !important;
    }
  }
  ```
- Standard CSS custom properties (`var(--Pale-Steel-Blue, #CCDAE3)`) and
  `@font-face` also confirmed working as normal.

## Site-specific content note

The actual CSS pulled from ou.studio (fonts, header/footer layout
overrides, per-page `#home2`/`#reviews`/etc. tweaks, a zoom/room-viewer
component) is real production styling, not a generic pattern — treating
it as a live example of the LESS syntax above rather than duplicating the
whole blob here. Full text is in this session's transcript if needed
again.
