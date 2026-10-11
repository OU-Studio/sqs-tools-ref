# Spec guide gaps (found writing 3 Haiku specs, 2026-10-11)

Checked against `specGuide()` in `sqs-builder/page-builder.js` and the extension copy. All three specs pass `validate()`.

1. **Array enums are missing from the guide.** `specGuide()` loops over `ENUMS` but skips array-valued keys, so `textAlign`, `buttonSize` and `imageLayout` never reach the model. Fix: include `Object.entries(ENUMS)` arrays as well, e.g. `layout: inline | poster | card | overlap | collage | stack`.
2. **Image `layout` values are not listed.** The guide says `{"type":"image","layout":..}` with no values. A model has to guess among six. (Resolved by fix 1.)
3. **Button `size` and block `align` values are not listed.** The guide never says buttons take `small | medium | large`, or that headings and text blocks take `align: left | center | right`. (Resolved by fix 1.)
4. **Map `height` is a grid size, not pixels.** It must be an integer 1-30, default 12. A model that writes `"height": 400` fails validation. The guide mentions `map {"lat","lng","zoom"}` and omits `height` altogether.
5. **Spacer `size` is an integer 1-20.** The guide lists `spacer {}` with no mention of `size`.
6. **Section background image.** The guide documents `backgroundImageId`, but the placeholder option is `backgroundImage: true`. The example sits in the images line, so it is easy to miss. Consider listing it under Section keys.
7. **Video needs a real URL.** The guide does not say that a placeholder URL will validate but not play. Joe needs to replace it before a build.

Nothing else was guessed: the rest of the block shapes and enums matched the validator.
