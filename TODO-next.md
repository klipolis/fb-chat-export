# TODO — Next tasks

Tasks grouped by area. Each is self-contained and can be instructed individually.

---

## Frontend — UX / behaviour

1. **Date input: accept slash-separated format** — `parseLocalDate` only accepts `YYYY-MM-DD`. Entering `2026/05/18` or `18.05.2026` fails silently with a red border. Support common locale variants.

2. **Show elapsed time on completion** — the "Done" notice shows message count and date range but not how long the scan took. Elapsed time is already computed; surface it.  *(Note: elapsed is shown during scan; add it to the final Done line too.)*

3. **Persist last-used date range** — every page load resets the date fields to "today − 3 days". Store the last submitted range in `sessionStorage` and restore on load.

4. **Scan progress: show scroll position as %** — the scroller's `scrollTop / scrollHeight` gives a rough percent. Display it alongside the count so users know how far back the scan has reached.

5. **Cancellation feedback** — when the user clicks Stop, the panel shows the count but no clear message that the scan was stopped intentionally (vs. completed). Add a "Stopped" prefix to the notice.

6. **Download button: handle prompt dismissal** — after the user clicks Download, the button re-enables after 10 s regardless of whether the file was actually saved. Consider prompting once more or keeping the button active indefinitely after the first click.

7. **Keyboard shortcut to start scan** — no keyboard-accessible trigger. Adding `Enter` on the date fields to submit would improve keyboard-only use.

8. **Panel: remember open/closed state** — `panel.open = true` is hardcoded. Save the last toggle state in `localStorage` and restore on load so power users who close it keep it closed.

---

## Frontend — correctness / edge cases

9. **`getConversationName` / `getDisplayPersonName` may return empty on non-English locales** — the regex that strips "Messenger" from the page title is English-only. Add a fallback to the first `<h1>` or `aria-label` on the conversation header.

10. **Anonymize: only replaces "you", not the user's actual name** — if the user's account name appears as a sender (instead of "you"), it is not anonymized. Allow the user to enter their own name to replace, or detect and replace the most frequent non-"you" sender too. Because the chat is between two people, my messages sent as not my name, it is sent as "You", so that's why giving a custom name.

11. **Duplicate message deduplication uses `aria-label` as key** — two messages with identical label text (same sender, same second, same content) will deduplicate incorrectly. Consider a composite key that includes the element's DOM position.

12. **`fromDate` / `toDate` timezone mismatch** — `parseLocalDate` constructs a local-time `Date`, but `resolveRelativeDate` may produce ISO strings that are parsed as UTC. Messages near midnight can be incorrectly filtered.

13. **FileReader fallback for CSP is asynchronous but treated synchronously** — the `reader.onload` callback fires asynchronously; `url` will always be `undefined` when checked immediately after `readAsDataURL`. The fallback currently always shows the CSP error. Fix by driving the export flow from inside `reader.onload`.

14. **`el.innerText` for call minutes may match message text** — the regex `/(\d+)\s*min/i` on the full element text can match a number in a quoted message rather than the call duration. Scope it to the timer element or the aria-label only.

---

## Frontend — accessibility

15. **`<details>/<summary>` open state not communicated to all screen readers** — some screen readers do not announce the toggle state change. Add an explicit `aria-expanded` attribute mirroring `panel.open` and update it on toggle.

16. **Checkbox labels have no `for`/`id` association** — the checkboxes are wrapped in `<label>` elements (which is correct), but the `createCheckboxToggleWithInput` wrapper `<div>` breaks the label association for the text input inside. Give the text input an `id` and pair it with a `<label>`.

17. **Error notices are not focused** — when a date validation error appears in the `aria-live` region, keyboard users have no visual focus indicator pointing to the problem field. Move focus to the offending input after showing the error.

18. **Download button disabled state is not announced** — `disabled = true` suppresses screen reader events entirely. Use `aria-disabled` + prevent-click instead so the "already downloading" state is still communicated.

---

## Shared logic / server

19. **`normalizeDuration` returns `null` for unrecognised strings** — callers in `export-formatter.js` fall back to the raw string, which may be a wall-clock time like "1:23 PM". Add a guard that returns `null` when the input looks like a time-of-day.

20. **`buildSummary` counts messages per sender regardless of date filter** — if the frontend scans only a date sub-range, the summary correctly reflects the filtered set, but the "days" count is derived from the entries' dates and may show `1` for sparse ranges. Verify the days count is correct for sub-range scans.

21. **`formatLine` option `includeContent` defaults to `true`** — this means content is included unless explicitly opted out. The frontend passes the checkbox state, but server-side callers (if any) could accidentally include content. Invert the default to `false` for safety.

22. **`sanitizeFileNamePart` truncates to 20 chars** — conversation names longer than 20 characters are silently cut. The export filename may be unrecognisable. Increase the limit or use a smarter truncation (word boundary).

23. **`getContentMeta` / `messageRules` coverage** — check that the rules cover Facebook's current HTML structure for reactions, stickers, GIFs, and polls. These message types may be misclassified as `text`.

---

## Build / CI

24. **`pnpm run test` does not include `test-ui.js` when run via `test:unit`** — the `test:unit` script was updated to include it, but the outer `test` script calls `test:unit` only. Verify the full `pnpm test` command runs `test-ui.js` end-to-end by adding it to the CI matrix run log.

25. **No `pnpm run lint` step in the `test` script** — `build:ci` runs lint before build, but `pnpm test` (used locally) skips lint. A developer could commit unlinted code if they only run `test`. Add `lint` to the `test` script or document this clearly in CONTRIBUTING.md.

26. **`validate-dist.js` rebuilds the bundle as a side-effect** — it calls `spawnSync('node', ['src/frontend/build.js'])`, overwriting `dist/app.js` and `dist/app.min.js`. Running it standalone mid-development silently changes the dist files. Extract the rebuild to a separate script or make it opt-in via an env flag.

27. **Golden snapshot files not covered by lint or format** — the `.txt` files under `tests/golden/` are not checked by markdownlint or prettier. A stray edit could silently break snapshot comparisons. Add a simple line-ending / encoding check to the CI pipeline.

28. **No `engines.pnpm` constraint in `package.json`** — `packageManager` pins the pnpm version but `engines` only constrains Node. Add `"engines": { "pnpm": ">=11" }` so mismatched pnpm versions fail loudly at install time.

29. **`build:ci` does not run `pnpm run test`** — it runs `build` which calls `test`, but the chain is `build:ci → lint → build → build:server + build:frontend + test`. If `test` is ever decoupled from `build`, CI will silently skip it. Make the dependency explicit.

---

## Testing

30. **No test for `formatLine` with all option combinations** — `includeContent: false`, `includeLength: false`, missing `duration`, missing `content` are all branches with no direct coverage in `run-tests.js`. Add cases.

31. **No test for `buildSummary` edge cases** — empty entries, single participant, all-missed-calls, sub-1-minute calls, entries with no `date`. These are known tricky paths in `export-summary.js`.

32. **No test for `parseLocalDate` / `resolveRelativeDate` in `frontend-utils.js`** — these are pure functions that can be tested in isolation with jsdom. They parse user-entered dates so correctness is important.

33. **`test-ui.js` uses `global.document =` mutation** — the `loadUi` function overwrites the Node global `document` for each test. Tests running in parallel (or in sequence with different DOM states) could interfere. Use a proper jsdom `window.eval` or module sandbox instead.

34. **No integration test for the full scan-to-export path** — all tests cover individual functions. A higher-level test that injects mock DOM message nodes and runs `collectVisible` → `buildSummary` → `formatExportHeader` → final text would catch wiring bugs like the `inp` / `input` issue that caused the v5.3.1 crash.

---

## Documentation

35. **`docs/README.md` may not reflect current export format** — the export format has changed (summary block, per-person lines, content/length flags). Verify the documented output format matches what `formatLine` and `buildSummary` actually produce.

36. **No `RELEASING.md`** — the `release:tag` script exists but the release procedure (what to check, how to tag, where to publish) is not documented. Add a short release guide or fold it into CONTRIBUTING.md.

37. **`fb - script- export message.js` at workspace root** — this file appears to be a stale copy of old source not under `src/`. It should be reviewed and either deleted or moved.

---

## Security / hygiene

38. **`normalizeFacebookRedirect` in `message-metadata.js` uses `new URL()`** — if the URL is attacker-controlled (e.g. via a message containing a crafted link), this is safe (URL constructor does not make network requests), but the result is used to replace link text in the export. Verify the output is never inserted into the DOM.

39. **`downloadBtn.onclick` is reassigned on each scan** — if the button is clicked between scans (e.g. from a previous result), the old closure's `url` and `fileName` are still valid but the assignment is fragile. Switch to `removeEventListener` + `addEventListener` with a named handler variable to make the lifecycle explicit.

40. **No Subresource Integrity (SRI) for the userscript** — Tampermonkey does not verify script integrity on update. Adding a `@require` checksum for any external libraries (currently none) and documenting the release hash in the changelog would help users verify authenticity.
