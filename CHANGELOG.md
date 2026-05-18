# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v5.4.0 (2026-05-18)

### Added

- Date inputs accept `YYYY/MM/DD`, `DD.MM.YYYY`, and `DD/MM/YYYY` in addition to `YYYY-MM-DD`.
- Panel open/closed state is remembered across page loads.
- Last-used date range is restored automatically on next visit.
- Pressing Enter in either date field starts the scan.
- Scan progress shows elapsed time and an approximate scroll-back percentage.
- Completion notice shows elapsed time alongside message count and date range.
- Scan stopped by the user shows "Stopped" instead of "Done".
- Both readable and minified output files are produced by the build.
- Automated release validation verifies both build artifacts.

### Fixed

- All panel controls (calls, anonymize, summary, content, length) now work correctly on load.
- Invalid date input is focused automatically when an error is shown.
- Date fields clear their error highlight as soon as the user starts typing.
- Messages near midnight are no longer incorrectly filtered due to a timezone mismatch.
- Download falls back gracefully when the browser restricts blob URL creation.
- Screen readers no longer announce the decorative panel arrow.
- Call duration is now read from the call timer element only, not surrounding message text.

### Dev

- Panel status area and download button are stable DOM nodes, updated in place.
- Download button uses `aria-disabled` instead of `disabled` so screen readers announce its unavailable state.
- Check/Uncheck all toggle reflects current selection state.
- Blob URL released after download; existing download cleanup cancelled before a new scan starts.
- Scan state transitions centralised; stop flag is a boolean managed by a central helper.
- Closing the panel mid-scan cancels the scan and re-enables controls.
- `sanitizeFileNamePart` limit raised to 40 characters.
- `getConversationName` falls back to the page `<h1>` on non-English locales.
- `validate-dist` rebuild is opt-in via `SKIP_BUILD` environment variable.
- `lint` added to the `test` script so local runs match CI.
- `engines.pnpm` constraint added to `package.json`.
- `formatLine` option combinations, `buildSummary` edge cases, and `parseLocalDate` format variants covered by tests.
- `test-ui.js` DOM sandbox no longer mutates the Node global `document`.

## v5.3.0 (2026-05-17)

### Dev

- Changelog, license, and security audit checks added to CI.
- ESLint updated to v10 with flat config.
- All dev dependencies updated to latest versions.
- Node version constraint relaxed to `>=26.0.0`.

## v5.2.2 (2026-05-17)

### Added

- Userscript header is now generated automatically at build time.
- Bundle version now matches the release version automatically.
- Snapshot-based export output validation added to catch regressions in TXT export content.

## v5.2.1 (2026-05-17)

### Added

- Automated release validation checks bundle header, export schema contract, and changelog version sync.
- Regression tests added for message classification, content-type detection, relative date parsing, and TXT line formatting.
- Deterministic version stamping enabled in CI builds.

## v5.2.0 (2026-05-16)

### Changed

- Export summary now uses a `Total Summary` block followed by per-person summary lines.
- Per-person summary counts exclude deleted, unsent, and missed call messages.
- Total summary counts are derived from the sum of per-person counts.
- Anonymized self name changed to `Youghurt`.
- Call summary now includes audio calls, video calls, and voice notes; missed calls are excluded.
- Removed `Total:` prefix from summary count lines.

### Fixed

- Duration fields now output correctly in exports.
- Download button is disabled for 10 seconds after click to prevent double-download.
- Completion notice simplified to name, date interval, and elapsed time.

### Dev

- Added linting, security audit, and release validation scripts.
- CI updated to use locked dependency installs and pnpm caching.

## v5.1.1 (2026-05-16)

### Fixed

- TXT exports now include link URL content in content-on mode.
- Link content now uses the resolved URL instead of a generic label.
- Added fallback Google Maps URL for pinned locations with no direct link.
- Fixed sender name parsing for dash-form aria-labels so leading conversational tokens stay in message content.
- Fixed duration parser to ignore wall-clock times like `1:23 PM`.

## v5.1.0 (2026-05-15)

### Changed

- Renamed demo pipeline folders to `demo/input-html-raw/`, `demo/output-html/`, and `demo/output-json/`.
- Frontend and server now share the same message classification and export logic.
- Build-specific version stamping added to the frontend bundle.
- Preview exports now include optional call duration.
- Preview exports now include an `export_date` field.
- Text export generation added from raw HTML snapshots.
- Fixed sender name detection in anonymization to replace only a single confirmed name.
- Fixed date extraction from link preview `At ...` labels.
- Exported text lines now include the message type in brackets after the date.

## v5.0.3 (2026-05-15)

### Fixed

- Server build runs non-interactively by default with automatic anonymization.
- Preview JSON no longer includes internal source metadata.
- Date labels like "today", "yesterday", and weekday names now resolve to correct calendar dates.

## v5.0.2 (2026-05-15)

### Dev

- GitHub Actions CI workflow added.

## v5.0.1 (2026-05-15)

### Dev

- CI workflow split into separate server and frontend build targets.

## v5.0.0 (2026-05-15)

### Dev

- Standardized build pipeline on `pnpm` with server, frontend, and preview scripts.

## v3.0.4 (2026-05-14)

### Changed

- Main exporter now treats replies as text by default rather than a separate `reply` type.
- Audio/video call and voice message length output uses minutes instead of character counts.
- Link preview JSON now includes `data_preview.content_link` and omits `content_length` for link items.
- Simplified the frontend panel CSS.

## v3.0.3 (2026-05-14)

### Changed

- Added a new export setting to write only content type and length instead of full message content.
- Improved content type recognition for voice messages, link previews, replies, unsent messages, and image/media previews.

## v3.0.2 (2026-05-14)

### Changed

- Removed `data-message-id` dependency from helper selectors and frontend duplicate-key logic.
- Updated JSON exports with `export_date` at top level and `data_preview.optimised_date` in `YYYY.MM.DD HH:mm` format.
- Removed obsolete top-level `timestamp` from preview JSON files.

### Dev

## v4.0.0 (2026-05-14)

### Added

- Reorganized static helper data into root-level `Input-readonly/` and `Output-generated/` folders.
- Added shared rule and helper scripts to `src/shared/`.
- Added `src/server/build-preview.js` to generate data preview JSON from optimized HTML.
- Added `src/frontend/build.js` to emit a one-file frontend bundle into `dist/`.
- Added `src/build-server.js` to run the full pipeline: clear outputs, generate optimized HTML, and build data preview.
- Added non-interactive CI support with automatic anonymization for server builds.

### Changed

- Renamed helper pipeline paths from `Helper/` to root-level `Input-readonly/` and `Output-generated/`.

### Dev

- Reworked build tooling for source-sharing and generated outputs.

## v3.0.1 (2026-05-14)

### Changed

- Flattened helper JSON exports in `Helper/Output-generated/Data preview/` by removing the top-level `nodes` wrapper.
- Added `data_preview.content_type` and `data_preview.content_length`.
- Deduplicated preview source/route metadata and finalized exports in `Data preview`.

### Dev

## v3.0.0 (2026-05-14)

### Added

- Major helper pipeline refactor: separated raw HTML, optimized HTML, and flattened JSON preview exports.
- Added `Helper/run.js` to regenerate optimized snapshots from raw HTML.
- Added `Helper/Output-generated/Data preview/` for final JSON export previews.

### Changed

- Flattened export JSON schema by removing the top-level `nodes` wrapper, promoting `export_date` to top level, and moving content metadata into `data_preview`.
- Updated `data_preview` to include `content_type`, `content_length`, and `optimised_date` in `YYYY.MM.DD HH:mm` format.
- Removed `data-message-id` references from helper selectors and export deduplication logic.

### Dev

- Reorganized repo structure into `src/frontend/`, `src/server/`, `src/shared/`, `docs/`, `skills/`, and `.skills/`.

## v2.12.3 (2026-05-14)

### Changed

- Removed `data-message-id` dependency from helper selectors and frontend duplicate-key logic.
- Updated preview JSON exports with `export_date` at top level and `data_preview.optimised_date` in `YYYY.MM.DD HH:mm` format.
- Removed obsolete top-level `timestamp` from JSON preview files.

### Dev

## v2.12.2 (2026-05-14)

### Changed

- Flattened helper JSON exports and removed the top-level `nodes` wrapper from `Helper/Output-generated/Data preview/`.
- Added `data_preview.content_type` and `data_preview.content_length`.
- Normalized `data_preview.optimised_date` to simple 24-hour date/time strings instead of ISO timestamps.

### Dev

## v2.12.1 (2026-05-14)

### Added

- Project layout reorganized with `src/frontend/`, `src/server/`, `src/shared/`, `docs/`, and `.skills/`
- Moved helper scripts and HTML snapshot folders into `src/shared/`

### Dev

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

- **Timestamp format** now exports as `[2026-05-08 15:17]`

### Added

- **Summary header** when enabled: exports top summary block with export dates from-top, total message count, and per-person counts including days, call count/duration, and image count
- **Chat output** now preserves audio/video call entries and image sent events explicitly in the downloaded history

---

## v2.10.0 (2026-05-14)

### Changed

- **Sort order**: messages always exported oldest-first, removed the "Newest first" checkbox

---

## v2.9.0 (2026-05-14)

### Changed

- **Time format**: switched from 12-hour AM/PM to 24-hour (`2026-05-11 / 14:35`) in all exported timestamps

---

## v2.8.0 (2026-05-14)

### Fixed

- **Relative date resolution** (`today`, `yesterday`, day names like `Friday`, `Wednesday`): now extracts the time component directly from the raw label (handles `9:27am`, `9:27 AM`, `at 9:27 AM` formats) and returns a proper ISO string.
- **Display date**: `displayDate` now uses the same resolved ISO string as `msgDate`.

### Changed

- **From date default** now dynamically set to 3 days before today (was hardcoded to `2026-01-19`)

---
