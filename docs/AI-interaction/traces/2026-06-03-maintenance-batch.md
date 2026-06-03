# AI Interaction Trace — 2026-06-03 Maintenance Batch

**Request:** Continue with next steps after previous maintenance session.  
**Result:** T155 (JSON summary variant) and T159 (raw date variant) implemented end-to-end. Infra fixes applied. All tests green.

## Work performed

### T155 — JSON summary variant
- Added `buildSummaryJson()` to `src/shared/export-summary.js` — serializes `buildSummaryData()` return value as pretty-printed JSON.
- Wired into `src/build-server.cjs`: `export-summary-json.txt` written alongside other TXT variants.
- Added `export-summary-json.txt` entry to `src/shared/export-config.json` with `"format": "json"` and a regex pattern matching valid JSON summary output (total object with participants array, numeric counts).
- Mirrored config entry in `tests/generated-txt-schema.json`.
- Added `validateJsonSummary()` to `tests/validate-generated-txt.js` — parses JSON, checks `total` is object, `participants` is array, all counts are numbers, `participants` has `messages`/`days` numeric fields.
- Added golden snapshot `tests/golden/export-summary-json.txt`.
- Updated integration test (build-server-text-export.test.js) to assert JSON summary content structure.

### T159 — Raw date variant
- Added `rawDate` field to entry object returned by `extractMessageEntry()` in `src/shared/export-text.js` — set to the raw aria-label date text when available.
- Added `includeRawDate` option to `formatLine()` in `src/shared/export-formatter.js` — when `true`, appends raw date in parentheses after the normalized date bracket: `[2026-04-12 13:23] (April 12, 2026, 1:23 PM) Sender: content`.
- Added `export-raw-date.txt` variant to `src/build-server.cjs` with `includeRawDate: true`.
- Added config entry to both `export-config.json` and `generated-txt-schema.json` with `includeRawDate: true`.
- Added golden snapshot `tests/golden/export-raw-date.txt`.

### Infrastructure fixes
- Updated `entryLine` regex in both configs to `^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\](?:\s\([^)]*\))?\s[^:]+:\s[^/]+(?:\s\/\s.*)?$` — the optional `(?:\s\([^)]*\))?` group handles the raw date parenthetical after the date bracket.
- Updated payload extraction regex in `validate-generated-txt.js` to match between the closing bracket/parenthetical and the sender colon.
- Fixed pre-existing test gap in `tests/test-other.js` (line 75): `data_raw.length` assertion expected `null` for all types, but `create-nodes.js` now sets word count strings for text-bearing types. Changed to `t.ok(raw.length === null || /^\d+ words$/.test(raw.length), ...)`.
- Fixed empty catch block ESLint error in integration test (line 178).
- Removed T155 from `TODO-future.md` (was duplicate with done). Removed T159 from `TODO-future.md` (now completed).
- Added T155 and T159 to `TODO-done.md` under Summary and Export format sections respectively.

### Test results (final)
- Unit tests: **752** (6 test-*.js files) — all passing
- Integration tests: **218** (2 files) — all passing
- Validations: **TXT 184 / Golden 19 / Release 8 / JSON 360 / Dist 32** — all passing
- **Total: 1,573 assertions, all passing**

## Learning / Notes
- `entryLine` regex must be kept in sync across `export-config.json` and `generated-txt-schema.json`. Any change to message line format requires both files updated.
- Payload extraction in `validate-generated-txt.js` uses a separate regex from `entryLine` — must be updated independently when line format changes.
- `create-nodes.js` `data_raw.length` was silently changed from `null` to word count strings in a prior session but the test wasn't updated. This passed previously because the old `run-tests.js` might have had a different assertion. Splitting `run-tests.js` exposed the inconsistency.
