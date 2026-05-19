# TODO — Completed tasks

Moved here from `TODO-next.md` once confirmed implemented.
Won't-implement decisions are also recorded here for reference.

---

## Won't implement (by design)

41. **Like / reaction counts in summary** — The `reaction` type is excluded from `~ N text;` via `noLengthTypes`. A separate summary counter adds complexity for emoji reactions; they are intentionally omitted from the summary body.

43. **Emoji content length** — The `reaction` type is in `noLengthTypes` so no char count is shown. Unicode code-point reporting for other emoji in text messages is an edge case not worth the added complexity.

40. **Subresource Integrity (SRI) for the userscript** — The userscript has no external `@require` dependencies, so there is nothing to pin with SRI. Deliberate ignore.

50. **`@updateURL` / `@downloadURL` header fields** — Auto-update links are deliberately omitted. Users install from a known URL; silent auto-update without explicit user review is undesirable for a script with DOM access. Deliberate ignore.




## Frontend — UX / behaviour

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

**`anonymizeChatNames` name-map support** — function accepts an optional `nameMap` parameter; `demo/anonymize-names.json` defines default replacements (`You` → `Youghurt`, detected name → `Alpha`). Build-server loads the file automatically. Tests added for name-map behaviour.

**`anonymizeChatNames` already-target guard** — replacement is skipped when the detected name already equals the target (prevents double-anonymization on re-runs). Same guard applied to explicit map entries where source and target are identical.

**Anonymize panel: other-person name field** — the Anonymize panel option now includes a second text input for the other person’s replacement name (default `Alpha`). Both sender types are anonymized in the export output.

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