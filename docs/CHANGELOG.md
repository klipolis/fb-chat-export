# Messenger Chat Exporter — Changelog

## v5.0.3 (2026-05-15)

### Fixed
- Made `src/build-server.js` fully non-interactive by default and use `ANONYMIZE_RAW=true` for anonymization.
- Removed `source` metadata from JSON preview generation.
- Updated README to reflect the new non-interactive build behavior.

## v5.0.2 (2026-05-15)

### Changed
- Renamed GitHub workflow placeholder directory from `.github/` to `.github-next/` until CI integration is ready.
- Added README guidance for PowerShell execution policy errors when running `pnpm` or `npm` scripts.
- Added guidance to keep `packageManager` and `engines.pnpm` aligned when updating pnpm.

## v5.0.1 (2026-05-15)

### Added
- GitHub Actions CI workflow for automated `pnpm run build:ci` builds.
- `pnpm run build:ci:frontend` for isolated frontend CI builds.
- `docs/TODO-next.md` as the next-task placeholder file.

### Changed
- Kept generated `dist/` and `Output-generated/` artifacts tracked in git.

## v5.0.0 (2026-05-15)

### Added
- `package.json` with `pnpm` build scripts for server, frontend, preview, and node export workflows.
- `pnpm run build:server` as the canonical full pipeline command.

### Changed
- Switched docs and build instructions to `pnpm` usage.
- Bumped project release to major version 5.

## v3.0.4 (2026-05-14)

### Changed
- Main exporter now treats replies as text by default rather than a separate `reply` type.
- Audio/video call and voice message length output uses minutes instead of character counts.
- Link preview JSON now includes `data_preview.content_link` and omits `content_length` for link items.
- Simplified the userscript panel CSS and kept default `left` positioning.

## v3.0.3 (2026-05-14)

### Changed
- Added a new export setting to write only content type and length instead of full message content.
- Improved content type recognition for voice messages, link previews, replies, unsent messages, and image/media previews.

## v3.0.2 (2026-05-14)

### Changed
- Removed `data-message-id` dependency from helper selectors and userscript duplicate-key logic.
- Updated JSON exports to keep `export_date` at top level and use the same `YYYY.MM.DD HH:mm` format for `data_preview.optimised_date`.
- Removed obsolete top-level `timestamp` from preview JSON files.

### Dev
## v4.0.0 (2026-05-14)

### Added
- Reorganized static helper data into root-level `Input-readonly/` and `Output-generated/` folders.
- Added shared rule and helper scripts to `src/shared/`.
- Added `src/server/build-preview.js` to generate data preview JSON from optimized HTML.
- Added `src/frontend/build-userscript.js` to emit a one-file userscript into `dist/`.
- Added `src/build-server.js` to run the full pipeline: clear outputs, generate optimized HTML, and build data preview.
- Added non-interactive `CI=true` / `SKIP_PROMPT=true` support and `ANONYMIZE_RAW=true` for server builds.

### Changed
- Renamed helper pipeline paths from `Helper/` to root-level `Input-readonly/` and `Output-generated/`.
- Updated docs and requirements to the new v4 repository layout.

### Dev
- Reworked build tooling for source-sharing and generated outputs.

- Updated `.skills` planning docs to reflect the final export schema.

## v3.0.1 (2026-05-14)

### Changed
- Flattened helper JSON exports in `Helper/Output-generated/Data preview/` by removing the top-level `nodes` wrapper.
- Added `data_preview.content_type` and `data_preview.content_length`.
- Deduplicated preview source/route metadata and kept final exports in `Data preview`.

### Dev
- Split `.skills/project-requirements.md` into modular planning files: `project-goal.md`, `project-structure.md`, and `project-notes.md`.

## v3.0.0 (2026-05-14)

### Added
- Major helper pipeline refactor: separated raw HTML, optimized HTML, and flattened JSON preview exports.
- Added `Helper/run.js` to regenerate optimized snapshots from raw HTML.
- Added `Helper/Output-generated/Data preview/` for final JSON export previews.
- Added `.skills/` planning docs and `skills/` AI guidance folder.

### Changed
- Flattened export JSON schema: removed the top-level `nodes` wrapper, kept `export_date`, and moved content metadata into `data_preview`.
- Updated `data_preview` to include `content_type`, `content_length`, and `optimised_date` in `YYYY.MM.DD HH:mm` format.
- Removed `data-message-id` references from helper selectors and export deduplication logic.

### Dev
- Reorganized repo structure into `src/frontend/`, `src/server/`, `src/shared/`, `docs/`, `skills/`, and `.skills/`.
- Added changelog consistency across repo documentation.

## v2.12.3 (2026-05-14)

### Changed
- Removed `data-message-id` dependency from helper selectors and userscript duplicate-key logic.
- Updated preview JSON exports to keep `export_date` at top level and use the same `YYYY.MM.DD HH:mm` format for `data_preview.optimised_date`.
- Removed obsolete top-level `timestamp` from JSON preview files.

### Dev
- Updated `.skills` planning docs to reflect the final export schema.

## v2.12.2 (2026-05-14)

### Changed
- Flattened helper JSON exports and removed the top-level `nodes` wrapper from `Helper/Output-generated/Data preview/`.
- Added `data_preview.content_type` and `data_preview.content_length`.
- Normalized `data_preview.optimised_date` to simple 24-hour date/time strings instead of ISO timestamps.

### Dev
- Split `.skills/project-requirements.md` into modular planning files: `project-goal.md`, `project-structure.md`, and `project-notes.md`.

## v2.12.1 (2026-05-14)

### Added
- Project layout reorganized with `src/frontend/`, `src/server/`, `src/shared/`, `docs/`, and `.skills/`
- Moved helper scripts and HTML snapshot folders into `src/shared/`
- Added `.skills/project-requirements.md` for Claude-style project planning
- Added documentation stubs in `docs/` and `src/frontend/`

### Dev
- Added development notes and project structure guidance to the changelog
- Kept helper assets separate from the main source script

## v2.12.0 (2026-05-14)

### Added
- Dynamic export filename: `fb-chats-{name-char3}-{count}-{from-to}.txt`
- Chat name is derived from the current page title, with the first 3 alphanumeric characters used in the filename
- Safer scanning by randomizing scroll delay between 500ms and 1000ms
- Completion message now includes elapsed scan time in seconds or minutes

## v2.11.1 (2026-05-14)

### Changed
- **Ignore calls setting** now covers `video`, `audio`, and `missed` calls consistently
- **Summary format** updated to:
  - `Total: x messages`
  - `x Days between [from] - [to]`
  - `Person 1/2 (Name): x messages - 3 days, 10 calls (x mins), 3 images`
- **Anonymization input** now accepts a custom replacement string for your own name instead of a hardcoded placeholder
- **Settings sidebar** simplified by removing the separate section title

## v2.11.0 (2026-05-14)

### Added
- **Settings panel** on the right-hand side with three unchecked defaults: `Ignore video/audio calls`, `Show my name as [    ]`, and `Summary at top of downloaded file`

### Changed
- **Timestamp format** now exports as `[2026-05-08 15:17]`, matching the requested bracketed 24-hour format

### Added
- **Summary header** when enabled: exports top summary block with export dates from-top, total message count, and per-person counts including days, call count/duration, and image count
- **Chat output** now preserves audio/video call entries and image sent events explicitly in the downloaded history

---

## v2.10.0 (2026-05-14)

### Changed
- **Sort order**: messages always exported oldest-first (newest at bottom), matching the natural Facebook/Messenger reading order — removed the "Newest first" checkbox

---

## v2.9.0 (2026-05-14)

### Changed
- **Time format**: switched from 12-hour AM/PM to 24-hour (`2026-05-11 / 14:35`) in all exported timestamps

---

## v2.8.0 (2026-05-14)

### Fixed
- **Relative date resolution** (`today`, `yesterday`, day names like `Friday`, `Wednesday`): now extracts the time component directly from the raw label (handles `9:27am`, `9:27 AM`, `at 9:27 AM` formats) and returns a proper ISO string — previously the resolved string could not be reliably parsed by `new Date()`, leaving timestamps as `0` and displaying the raw label in the export
- **Display date**: `displayDate` now uses the same resolved ISO string as `msgDate`, so exported lines always show a formatted date (`2026-05-08 / 9:27 AM`) instead of the raw label (`Friday 9:27am`)
- Both fixes apply to Facebook's "this week" and "last week" day-name labels

### Changed
- **From date default** now dynamically set to 3 days before today (was hardcoded to `2026-01-19`)
- **`@description`** updated to list all current features: auto-scroll, date-range filter, relative date support, newest-first sort, collapsible panel, live counter, stop-at-any-time, separate Download step

---
