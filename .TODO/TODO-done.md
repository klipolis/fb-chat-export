# TODO — Completed tasks

Moved here from `TODO-next.md` once confirmed implemented.
Won't-implement decisions are in [TODO-ignore.md](TODO-ignore.md).
Future / requires-new-samples items are in [TODO-future.md](TODO-future.md).

## Links

- [TODO-next.md](TODO-next.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

## Anonymisation

- T44. Build-server name detection: two-pass — raw HTML files are read first, `collectAutoName` runs once globally, and each file is aliased with the pre-detected name.
- T45. Raw HTML write-back is opt-in — `build:raw` writes aliased raw HTML files while the default build preserves original raw input.
- T46. Multi-person explicit name map — `data-config/alias-names.json` supports explicit sender → pseudonym pairs and an `any` fallback.

## Summary

- T47. Generate N-participant summary sections for every participant without a two-person cap.
- T48. Non-duration types count as text — stickers, GIFs, reactions, and link messages contribute to the text total.
- T49. Sticker and gif treated as reaction — image-like stickers and GIFs are excluded from the image summary count.

## Message type detection

- T50. Classify text messages correctly instead of voice-note in the browser scan.
- T51. Align `voice-note` type with filename and export content.
- T52. Fix frontend summary call duration extraction for timers in `HH:MM` format.
- T53. Label-locked type classification — once a label rule matches, heuristic overrides are skipped.
- T54. Broaden missed-call rule to match missed audio/video calls.
- T55. Reaction emoji-image support — `reaction` covers emoji image reactions and preserves null content.
- T56. Reorganise JSON preview schema with top-level fields and separate raw/preview sections.
- T57. Add `video-link` type for plain video platform URLs.

## Output formatting

- T58. Normalise duration format to `MM:SS` / `HH:MM:SS` without a `mins` suffix.
- T59. Add a compact video-link URL form for TXT exports.
- T60. Parse full calendar date aria-labels without requiring the `At` prefix.

## Anonymisation

- T61. Time-only date edge case support — `normalizeDateToSimple` resolves time-only labels to the current day.

## Export format

- T62. TXT header formatting updated with `Options used:`, `Other ones:`, and blank-line separation.
- T63. Alias config centralised as runtime alias source.
- T64. Platform userscript header template moved to `data-config/userscript/header.txt`.
- T65. Export filename includes the selected date range.

## Test coverage

- T66. `chooseRule` unit tests added for file-name and label-rule priority.
- T67. `formatExportHeader` coverage added for all recognized message types.

## Browser frontend improvements

- T68. `parseLocalDate` accepts slash-separated date formats.
- T69. Scan completion displays elapsed time.
- T70. Browser panel persists the last-used date range.
- T71. Scan progress shows scroll position as a percentage.
- T72. Stop feedback uses `Stopped` instead of `Done`.
- T73. Keyboard Enter starts scan from date fields.
- T74. Panel open/closed state is persisted.

## Frontend correctness / edge cases

- T75. `getConversationName` falls back to `<h1>` on non-English locales.
- T76. `fromDate` / `toDate` timezone mismatch is handled consistently.
- T77. FileReader CSP fallback runs asynchronously in `reader.onload`.
- T78. Call duration extraction is scoped to the timer element only.

## Frontend accessibility

- T79. `<details>/<summary>` open state mirrors `aria-expanded`.
- T80. Validation errors focus the invalid input.
- T81. Download button uses `aria-disabled` for screen reader compatibility.

## Shared logic / server

- T82. `normalizeDuration` returns `null` for unrecognised strings like wall-clock times.
- T83. `sanitizeFileNamePart` truncates to 40 characters.
- T84. `engines.pnpm` is constrained to `>=11.1.2`.

## Build / CI

- T85. `pnpm run test` includes lint and both unit suites.
- T86. Prevent `validate-dist` from rebuilding the bundle as a side effect.

## Testing

- T87. `formatLine` option combinations are covered.
- T88. `buildSummary` edge cases are covered.
- T89. `parseLocalDate` / `resolveRelativeDate` tests are added.
- T90. Prevent `test-ui.js` from mutating the global document.
- T91. Keep download handler lifecycle from reassigning `onclick` unsafely.
- T92. Stabilise the duplicate message dedupe key.
- T93. `formatLine` explicit `includeContent` semantics are clarified.

## Shared parser

- T94. `parseAriaLabel` fixes trailing conversation name sender detection.
- T95. `isValidSender` rejects names with more than two words.
- T96. Parser helper functions are exported for testing.

## Alias support

- T97. `aliasChatNames` accepts an optional `nameMap`.
- T98. Alias replacement skips already-target names.
- T99. Alias panel supports an other-person alias field.
- T100. Download UI includes a "Save again" link after the first export.
- T101. Sticker/GIF/poll rules were extended for `getContentMeta` and summary logic.
- T102. `README.md` export format docs were added.
- T103. Scan-to-export integration coverage was added.

## Build / CI extras

- T104. Golden snapshot validation for encoding, line endings, and whitespace was added.
- T105. `build:ci` explicitly runs build then test.
- T106. `normalizeFacebookRedirect` output is verified not to be inserted into DOM.
