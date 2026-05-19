# TODO — Next tasks

Tasks grouped by area. Each is self-contained and can be instructed individually.
Completed tasks are tracked in [TODO-done.md](TODO-done.md).
Items that were considered and deliberately not implemented are listed in the **Won't implement** section of [TODO-done.md](TODO-done.md) — these are intentional design decisions, not omissions.

---

## Anonymisation

~~44~~ ✅ **Build-server name detection: two-pass** — Implemented: all raw HTML files are read first, `collectAutoName` runs once globally, then each file is anonymised with the pre-detected name. Explicit-map target names are excluded from auto-detection candidates via `makeExcludeSet`.

~~build:raw~~ ✅ **Raw HTML write-back is opt-in** — Default build reads raw files without modifying them. `build:raw` writes anonymised names back; `build:raw-clean` strips Facebook utility classes and inline styles from raw files.

45. **Time-only date edge case** — Messages with a time-only aria-label (e.g. `"At 11:16 AM, …"`) resolve to today's date. Add a test assertion that explicitly verifies the resolved date equals today.

## Message types

46. **Additional reaction sample files** — `reaction.html` covers 👍. Other Facebook reactions (❤️, 😮, 😢, 😂, 👏, 🙁) should each have a sample in `demo/input-html-raw`; the `reaction` rule's `matchLabel` already includes them, so only raw files and golden-snapshot updates are needed.

47. **Missed calls excluded from call duration total** — The summary shows `~ N calls X mins` which mixes connected and missed calls. Missed calls contribute 0 mins and inflate the call count; a separate `~ N missed` line would be clearer.

48. **Sticker counted as image in summary** — Stickers are included in `~ N images`. A dedicated `~ N stickers` counter would distinguish decoration from actual photo attachments.

49. **Export filename includes date range** — The TXT filename is fixed. Including the scanned date range (e.g. `fb-export-2026-05-01–2026-05-19.txt`) would help users organise multiple exports without renaming.

## Test coverage

51. **`chooseRule` unit tests** — No direct unit test for `chooseRule(fileName, label)` against all rule entries. A table-driven test covering each `matchFile`/`matchLabel` combination would catch regressions when rules change.

52. **`formatExportHeader` with all type combos** — The header lists only message types present in the export. A test with a hand-crafted entry set covering every recognised type would pin the exact header output.

---

## Future (explicit tasks — require new sample files)

42. **Sticker and GIF raw samples** — There are no `sticker.html` or `gif.html` files in `demo/input-html-raw`. Adding them would exercise the sticker/gif rules under the build-server path and extend golden-snapshot coverage.

