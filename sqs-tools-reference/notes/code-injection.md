# Code injection (header/footer scripts) — working notes

## Endpoints

`GET https://<site>.squarespace.com/api/config/GetInjectionSettings`

Response shape:
```json
{
  "header": "<raw HTML/script string injected before </head>>",
  "footer": "<raw HTML/script string injected before </body>>",
  "isOrderStatusMigrationNeeded": false,
  "lockPage": "",
  "postItem": ""
}
```

`POST https://<site>.squarespace.com/api/config/SaveInjectionSettings`

- Body is `application/x-www-form-urlencoded`, all fields sent every
  time (unlike GET's response, no `isOrderStatusMigrationNeeded`):
  `header=<encoded>&footer=<encoded>&lockPage=<encoded>&postItem=<encoded>&orderConfirmationPage=<encoded>&orderStatusPage=<encoded>&ssoScreen=<encoded>`
- **Full overwrite per field** — same pattern as
  [custom-css.md](custom-css.md)'s `SetTemplateCustomCss`: GET current
  values first, modify only the field you care about, resend all fields
  (empty string for any unused ones) or you'll wipe them.
- Unlike `SetTemplateCustomCss`, this one is named `Save*` (matches the
  README's existing `Save*`-is-a-write convention) even though it's also
  form-encoded rather than JSON — so naming convention (`Get*`/`Save*`)
  predicts write-vs-read correctly here, just not the body format.
- Response on success echoes back `{header, footer}` (at least) confirming
  the write.

## Fields beyond header/footer

Seen empty in this capture, meaning unconfirmed content, but the six
fields Squarespace round-trips are: `header`, `footer`, `lockPage`,
`postItem`, `orderConfirmationPage`, `orderStatusPage`, `ssoScreen`.
Likely: `lockPage` = password-protected page injection, `postItem` =
per-blog-post injection, `orderConfirmationPage`/`orderStatusPage` =
commerce checkout flow injection, `ssoScreen` = member-area SSO screen
injection. Unconfirmed — capture if one is ever populated.

## Real example (ou.studio header injection)

Confirms typical real-world use: loading external libraries (Typekit
font CSS, jQuery, slick-carousel JS/CSS, GSAP) via `<link>`/`<script>`
tags, plus a custom inline `<script>` — an `OULoad` page-reveal utility
(fades in `<html>` after DOM ready or a hard 1s timeout, exposes small
`ou()`/`not()`/`delay()` helpers for "run this once an element exists" /
"run this if an element is missing" / "run this after N ms" patterns)
used here to inject a mobile menu footer and init a slick carousel on
`#reviews2`. Real content, not a generic pattern — logged for the
endpoint shape, not meant to be reused as-is.
