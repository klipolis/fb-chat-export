# AI Interaction Trace — Maintenance Batch (2026-06-03)

## Request

The user asked to:
1. Add more TODO-next tasks
2. Apply changes (implement the tasks)
3. Update docs for user and AI
4. Add an AI trace

## Tasks

### T173 — Fix hasLink bare word "link" in frontend

**Why:** The frontend's `hasLink` detection included `\blink\b` in its regex, causing messages containing the bare word "link" (e.g. "Here is a link to check") to be classified as `link` type instead of `text`. The server code path (`export-text.js`) correctly avoided this. The frontend regex was aligned with the server path.

**Change:** Removed `|\blink\b` from both regex calls in `src/frontend/src/index.js:209-212`.

### T174 — Add link-video to TXT message types

**Why:** The `link-video.html` sample file produces export lines with type `link-video`, but this type was missing from the header's message types list because `getBaseSemanticTypes` in `build-server.cjs` filtered it out (it wasn't in `messageTypes`). The header silently omitted the type even though link-video entries appeared in the export body.

**Change:** Added `"link-video"` to `messageTypes` in both `src/shared/export-config.json` and `tests/generated-txt-schema.json`. Regenerated golden snapshots.

### T175 — Document four TXT export variants

**Why:** The user guide only described the browser export format. The server build produces four distinct TXT files, and the two summary-only variants (combined and detailed) were undocumented.

**Change:** Added a "Server exports" subsection to `docs/user-guide/README.md` covering all four variants, with format examples and the posts-vs-messages label convention.

### T176 — Wire date range into browser export filename

**Why:** The browser's `formatExportFileName()` in `frontend-utils.mjs` ignored its `fromDate`/`toDate` parameters entirely, producing a generic filename regardless of the selected date range. The server version correctly generated date-stamped filenames.

**Change:** Updated `formatExportFileName(mode, { fromDate, toDate })` in `frontend-utils.mjs` to include the date range in the filename when dates are provided, e.g. `chat-export-20260501-20260519-abc.txt`.

## Files changed

- `.TODO/TODO-next.md` — added T173–T176
- `src/frontend/src/index.js` — removed `\blink\b` from hasLink regex
- `src/shared/export-config.json` — added `link-video`
- `tests/generated-txt-schema.json` — added `link-video`
- `src/shared/frontend-utils.mjs` — wired date range into filename
- `tests/golden/*.txt` — regenerated with new header
- `docs/user-guide/README.md` — added server export variants section
- `docs/AI-interaction/traces/2026-06-03-maintenance-batch.md` — this file

## Learning

- Config changes that affect the header or message types require regenerating golden snapshots.
- The frontend and server code paths have independent implementations that can drift — both should be checked for consistency when fixing classification logic.
- Missing message types in the header are easy to overlook because the integration test silently skips assertions for types not in the `messageTypes` list.
