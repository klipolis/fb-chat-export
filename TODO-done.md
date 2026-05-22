# TODO — Completed tasks

Moved here from `TODO-next.md` once confirmed implemented.
Won't-implement decisions are in [TODO-ignore.md](TODO-ignore.md).
Future / requires-new-samples items are in [TODO-future.md](TODO-future.md).

---

## Anonymisation

44. **Build-server name detection: two-pass** — All raw HTML files are read first; `collectAutoName` runs once globally; each file is then aliased with the pre-detected name. Explicit-map target names are excluded from auto-detection via `makeExcludeSet`, preventing the replacement alias from being re-detected on subsequent runs.

**Raw HTML write-back is opt-in** — Default build reads raw files without modifying them. `build:raw` (via `BUILD_RAW=true`) writes aliased names back; `build:raw-clean` strips Facebook utility classes and inline styles for readability without full optimisation.

**Multi-person explicit name map** — `alias-names.json` supports multiple explicit sender → pseudonym pairs (e.g. `You → Youghurt`, `Rob → Barnabas`) plus an `any` key for any auto-detected name.

---

## Summary

**N-participant summary** — Summary sections are generated for every participant in the export. The two-participant cap and `Unknown N` padding are removed; the auto-detect path uses all unique senders.

47. **Non-duration types count as text in summary** — Any message that is not a timed call (audio-call, video-call, voice-note, voice-message) and not a photo image counts toward the text total in the summary, because the recipient had to see or acknowledge it. Sticker, gif, reaction, link, and similar types all contribute to `~ N text`.

48. **Sticker and gif treated as reaction in summary** — Stickers and animated gifs are not counted as images in any summary path. They are visual messages treated the same as reactions: they count toward the text total, not the image count. The `isImage` flag in message metadata now only applies to `image` type.

---

## Message type detection

**Text messages no longer misclassified as voice-note (frontend)** — When no `[role="timer"]` element is present, the message body text is no longer passed as `timerText`. Previously, any non-empty message body caused `voiceMatch` to return true and override the type to `voice-note`.

**voice-note type aligned with filename** — The classified type was `voice-message` while the raw sample file is `voice-note.html` and the export line already displayed `voice-note`. The rule type, `timedTypes` set, all metadata branches, export-text redundancy check, export-summary `isCountedCall`, JSON preview, and all test assertions have been updated to use `voice-note` consistently. Content text changed from `"voice message"` to `"voice note"`.

**Frontend summary call duration fixed** — `callMinutes` in `collectVisible()` was derived from a raw `(\d+)\s*min` regex on DOM timer text, which returned 0 whenever the timer shows `"18:00"` without the word "min". It now calls `durationToMinutes(contentMeta.duration)` — the same logic the server path uses — so duration totals in the browser summary are accurate.

**Label-locked type classification** — When `chooseRule` finds a specific label rule match (not the text fallback), the resulting type is now locked and the heuristic override chain is skipped. This prevents re-classification of messages that were already correctly identified by the aria-label.

**Missed-call label rule broadened** — `matchLabel` for missed-call rules now matches "missed audio call" and "missed video call" in addition to "missed call". Rule order changed: missed-call entries precede audio-call to prevent ambiguous partial matches.

**Reaction emoji-image support** — The `reaction` rule's `matchFile` now covers `reaction-emoji.html` and `matchLabel` uses a Unicode property escape pattern to match any reaction where the full aria-label ends with `: [emoji]`. Reactions using an `<img alt="🥳">` element are classified as `reaction` type with `null` content.

**JSON preview schema reorganised** — `html_locale`, `title`, and `type` are now top-level fields on every preview JSON file. `data_raw` holds the values as extracted from the HTML (date, raw content, raw duration, length always null). `data_preview` holds processed display values (date, content, duration, length). The `locate` section and `raw_meta` sub-object have been removed. All four keys are always present in both sections.

**video-link type** — Messages whose body is a plain video platform URL (YouTube Shorts, Vimeo, etc.) are classified as `video-link` type. The URL is extracted as content from `resolvedLink` and shown in content-on TXT export after `/`. No duration or length. The HTML optimiser (`removeLinkContent`) now preserves plain URL text inside `<a>` tags instead of replacing it with `<a></a>`, so the message wrapper is not stripped as empty by `removeEmptyChildren`. `matchLabel` covers `youtube.com/`, `youtu.be/`, and `vimeo.com/` for the browser path.

---

## Output formatting

**Duration format** — `normalizeDuration` now outputs `MM:SS` / `HH:MM:SS` clock format (e.g. `18:00`, `00:20`) without a trailing "mins" suffix. `durationToMinutes` updated to match. All golden snapshots, JSON demo outputs, and test assertions updated.

**Video-link compact URL** — `formatUrlCompact` strips the scheme, replaces domain dots with underscores, and truncates the path at 10 characters with `...` (e.g. `youtube_com/shorts/IK...`). Applied to video-link `data_preview.content` in TXT export. JSON `data_raw.content` stores the full URL without query string; `data_preview.content` stores the compact form.

**Frontend date parsing (no-"At" prefix)** — `parseAriaLabel` lazy-regex replaced with an iterative comma-split loop; messages with full calendar-date aria-labels (e.g. `"May 7, 2026, 7:09 AM, You: text"`) are now correctly parsed into separate date, sender, and content fields.

---

## Anonymisation

45. **Time-only date edge case** — A test assertion verifies that a time-only aria-label (e.g. `"11:16 AM"`) resolves to today's date via `normalizeDateToSimple`.

---

## Export format

49. **Export filename includes date range** — `formatExportFileName` now accepts optional `fromDate` and `toDate` parameters and produces filenames like `fb-export-2026-05-01–2026-05-19-content-on.txt`. Falls back to the previous fixed names when no dates are provided. The frontend passes the user-selected date range automatically.

---

## Test coverage

51. **`chooseRule` unit tests** — Table-driven test covering every `matchFile` entry (all raw file name patterns) and common `matchLabel` cases. Verifies that file-name matching takes priority and that all label heuristics resolve to the expected type.

52. **`formatExportHeader` all type combos** — Test with all 16 recognised message types verifies that every type appears in the header, that the `Method:` line is correct, and that the `---` separator is present.

---

1. **Date input: accept slash-separated format** — `parseLocalDate` now accepts `YYYY/MM/DD`, `DD.MM.YYYY`, `DD/MM/YYYY`, `DD-MM-YYYY` in addition to `YYYY-MM-DD`.

2. **Show elapsed time on completion** — the "Done" / "Stopped" notice includes the elapsed scan duration.

3. **Persist last-used date range** — last submitted `from`/`to` values are stored in `sessionStorage` and restored on load.

4. **Scan progress: show scroll position as %** — the scanning notice displays `~N% back` derived from `scrollTop / scrollHeight`.

5. **Cancellation feedback** — when Stop is clicked, the notice uses "Stopped" instead of "Done".

7. **Keyboard shortcut to start scan** — pressing Enter on either date field triggers the scan.

8. **Panel: remember open/closed state** — panel open/closed toggle state is persisted in `localStorage`.

---

## Frontend — correctness / edge cases

9. **`getConversationName` / `getDisplayPersonName` may return empty on non-English locales** — added `<h1>` fallback when the Messenger title strip does not match.

12. **`fromDate` / `toDate` timezone mismatch** — date-only ISO strings (`YYYY-MM-DD`) from `<time datetime>` are now parsed as local midnight to match `parseLocalDate`.

13. **FileReader fallback for CSP is asynchronous but treated synchronously** — export flow now runs inside `reader.onload`, so the blob URL is always available before download setup.

14. **`el.innerText` for call minutes may match message text** — call duration extraction is now scoped to the timer element only.

---

## Frontend — accessibility

15. **`<details>/<summary>` open state not communicated to all screen readers** — `aria-expanded` on the summary mirrors `panel.open` and is updated on toggle.

17. **Error notices are not focused** — after a date validation error the offending input receives focus.

18. **Download button disabled state is not announced** — the button uses `aria-disabled` + click-guard instead of `disabled`, so it remains announced by screen readers.

---

## Shared logic / server

19. **`normalizeDuration` returns `null` for unrecognised strings** — added a guard that returns `null` when the input looks like a wall-clock time (e.g. `1:23 PM`).

22. **`sanitizeFileNamePart` truncates to 20 chars** — limit increased to 40 characters.

28. **No `engines.pnpm` constraint in `package.json`** — `engines.pnpm` set to `>=11.1.2`.

---

## Build / CI

24. **`pnpm run test` does not include `test-ui.js` when run via `test:unit`** — `test:unit` script updated to run both `run-tests.js` and `test-ui.js`.

25. **No `pnpm run lint` step in the `test` script** — `pnpm run lint` is included at the start of the `test` script.

26. **`validate-dist.js` rebuilds the bundle as a side-effect** — rebuild extracted; `validate-dist.js` no longer triggers a build automatically.

---

## Testing

30. **No test for `formatLine` with all option combinations** — tests cover `includeContent: false`, `includeLength: false`, missing `duration`, and missing `content`.

31. **No test for `buildSummary` edge cases** — tests cover empty entries, single participant, all-missed-calls, sub-1-minute calls.

32. **No test for `parseLocalDate` / `resolveRelativeDate`** — tests added using a subprocess to avoid ESM cycle issues with tap.

33. **`test-ui.js` uses `global.document =` mutation** — `loadUi()` now accepts `document` as a parameter; no global mutation.

39. **`downloadBtn.onclick` is reassigned on each scan** — handler lifecycle now uses `removeEventListener` + `addEventListener` with a named `downloadHandler` variable.

11. **Duplicate message deduplication key** � dedup key changed from aria-label + DOM index to aria-label + <time datetime> value; this is stable across DOM reorders during scroll.

21. **`formatLine` option `includeContent` defaults to `false`** � callers must now pass `{ includeContent: true }` to include message content in the export line.
---

## Shared logic / parser

**Aria-label parser: trailing conversation name causes wrong sender** — fixed `parseAriaLabel` to detect inline `sender:` format in middle comma-parts and skip treating the last part as a sender.

**`isValidSender` max-two-words constraint** — sender strings with more than two whitespace-separated words are rejected, preventing long conversation names from being misidentified as senders.

**Parser helper functions exported for testing** — `isValidSender` and `findValidDatePrefix` are now module-level exports; `normalizeDateToSimple` was already exported.

---

## Testing

**`aliasChatNames` name-map support** — function accepts an optional `nameMap` parameter; `demo/alias-names.json` defines default replacements (`You` → `Youghurt`, detected name → `Alpha`). Build-server loads the file automatically. Tests added for name-map behaviour.

**`aliasChatNames` already-target guard** — replacement is skipped when the detected name already equals the target (prevents double-aliasing on re-runs). Same guard applied to explicit map entries where source and target are identical.

**Alias panel: other-person name field** — the Alias panel option now includes a second text input for the other person’s replacement name (default `Alpha`). Both sender types are aliased in the export output.

**Download panel: "Save again" link** — a secondary link appears after the first download so the file can be re-saved without re-running the scan.

**`messageRules` coverage for sticker / GIF / poll** — three new rule entries added for `sticker.html`, `(animated-)gif.html`, and `poll.html`; `getContentMeta` sets content text and omits length for sticker and GIF; both are treated as image-type for summary counts.

**`docs/README.md` export format** — added "Export format" section documenting the header, summary block, and message-line structure matched against actual `formatLine` / `buildSummary` output.

**Integration test: scan-to-export pipeline** — `scanToExportIntegration` test covers mock DOM nodes → `buildEntriesFromDocument` → `buildSummary` → `formatExportHeader` → assembled full export text.

---

## Build / CI

27. **Golden snapshot files not covered by lint or format** — `tests/validate-golden.js` checks UTF-8 encoding, LF line endings, and no trailing whitespace; added to `pnpm run test` and `build:ci`.

29. **`build:ci` does not run `pnpm run test` directly** — `build` script no longer embeds `test`; `build:ci` explicitly chains `build` then `test`.

38. **`normalizeFacebookRedirect` output verified not in DOM** — `resolvedLink` is used only in plain-text export content, never inserted via `innerHTML` or similar.

37. **`fb - script- export message.js` at workspace root** — file not present in current workspace; no action needed.

**Tests for `isValidSender`, `findValidDatePrefix`, and extended `normalizeDateToSimple` cases** — unit tests cover single-word, two-word, three-word rejection, digit rejection, day-of-week+time, time-only, yesterday, and full month-name date normalization.