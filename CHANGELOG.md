# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added

- `pnpm run release` automates the release process: renames `[Unreleased]` to the new version heading, inserts a fresh empty `[Unreleased]` above it, and bumps `package.json` version. Supports `patch`, `minor`, `major` override arguments; defaults to minor if any `Added`/`Changed` entries are present, otherwise patch.
- Pre-commit hook now also blocks commits when the `[Unreleased]` section in `CHANGELOG.md` is empty, via `scripts/check-unreleased.js`.
- `pnpm run check:unreleased` exposes the changelog guard as a standalone command.

### Fixed

- Duration values in exports and JSON previews now always use strict `HH:MM:SS` three-part format (e.g. `00:18:00`, `00:00:20`) with zero-padded hours, eliminating the previous `MM:SS` two-part form.
- `validate-generated-txt.js` summary validator is now dynamic: it accepts any number of per-sender summary sections instead of being hardcoded to two.
- `export-config.json` `personSummaryTitle` pattern is now dynamic (`^.{1,80} Summary$`) instead of listing hardcoded sender aliases.
- `export-config.json` `messageTypes` updated to include `reaction-emoji`, `reaction`, and `video-link`; `duration` pattern updated to match the strict `HH:MM:SS` format.


- `pnpm run release` automates the release process: renames `[Unreleased]` to the new version heading, inserts a fresh empty `[Unreleased]` above it, and bumps `package.json` version. Supports `patch`, `minor`, `major` override arguments; defaults to minor if any `Added`/`Changed` entries are present, otherwise patch.
- Pre-commit hook now also blocks commits when the `[Unreleased]` section in `CHANGELOG.md` is empty, via `scripts/check-unreleased.js`.
- `pnpm run check:unreleased` exposes the changelog guard as a standalone command.

### Fixed

- Duration values in exports and JSON previews now always use strict `HH:MM:SS` three-part format (e.g. `00:18:00`, `00:00:20`) with zero-padded hours, eliminating the previous `MM:SS` two-part form.
- `validate-generated-txt.js` summary validator is now dynamic: it accepts any number of per-sender summary sections instead of being hardcoded to two.
- `export-config.json` `personSummaryTitle` pattern is now dynamic (`^.{1,80} Summary$`) instead of listing hardcoded sender aliases.
- `export-config.json` `messageTypes` updated to include `reaction-emoji`, `reaction`, and `video-link`; `duration` pattern updated to match the strict `HH:MM:SS` format.

- Sticker and animated gif messages are no longer counted as images in the summary; they count toward the text total alongside reactions.
- Reaction messages using an emoji image (`<img>` element) instead of an SVG icon are now correctly classified as `reaction` type.
- The JSON preview format has been reorganised: `html_locale`, `title`, and `type` are now top-level fields; `data_raw` captures values as extracted from the HTML; `data_preview` contains processed display values; `locate` has been removed.
- Reaction messages always produce `null` content in both `data_raw` and `data_preview`.
- `video-link` is a new message type for messages whose body is a video platform URL (YouTube, Vimeo). The URL is used as content; the type appears in the export line and JSON preview. The HTML optimiser now preserves plain URL text inside `<a>` tags so the message wrapper is not incorrectly stripped as empty.
- The voice-note message type is now consistently named `voice-note` everywhere — in the rule, JSON preview, and content text — matching the raw sample filename.

### Fixed

- Text messages are no longer misclassified as voice-message in the browser scan when no audio timer element is present.
- Message type classification now stops at the first matching rule; once a type is identified from the aria-label, heuristic overrides are skipped.
- Downloaded export filename now includes the selected date range (e.g. `fb-export-2026-05-01–2026-05-19-max.txt`).
- Call duration totals in the browser summary are now counted correctly; previously, timers in `HH:MM` format without the word "min" were counted as 0 minutes.
- Messages whose aria-label uses a full calendar date (e.g. "May 7, 2026, 7:09 AM, You: text") without the "At" prefix are now correctly parsed; date, sender, and content are each placed in the right field.
- Duration values in exports and JSON previews now use `HH:MM:SS` / `MM:SS` clock format (e.g. `18:00`, `00:20`) without a trailing "mins" label.
- Video-link URLs in TXT exports are shortened to a compact form: scheme and dots are stripped, the domain dots replaced with underscores, and the path is truncated to 10 characters with an ellipsis (e.g. `youtube_com/shorts/IK...`). The raw URL in JSON `data_raw` keeps the full address without query string.

## v5.4.0 (2026-05-18)

### Added

- Facebook reactions (👍, ❤️, 😂, 😮, 😢, 👏) are recognised as a distinct `reaction` message type and excluded from the character-count summary.
- Name aliasing now supports multiple explicit sender mappings (e.g. mapping both "You" and a contact name to separate pseudonyms) alongside an automatic fallback for any other detected name.
- `build:raw` script writes aliased names back to raw HTML files on demand; the default build no longer modifies raw HTML.
- `build:raw-clean` script strips Facebook-internal utility classes and inline styles from raw HTML files without running full optimisation.
- Audio call messages where the sender name matches the anonymisation target are handled correctly without double-replacement.
- Date inputs accept `YYYY/MM/DD`, `DD.MM.YYYY`, and `DD/MM/YYYY` in addition to `YYYY-MM-DD`.
- Panel open/closed state is remembered across page loads.
- Last-used date range is restored automatically on next visit.
- Pressing Enter in either date field starts the scan.
- Scan progress shows elapsed time and an approximate scroll-back percentage.
- Completion notice shows elapsed time alongside message count and date range.
- Scan stopped by the user shows "Stopped" instead of "Done".
- Both readable and minified output files are produced by the build.
- Automated release validation verifies both build artifacts.
- Release procedure is documented in RELEASING.md.

### Fixed

- Messages with a time-only or day-of-week date (e.g. "Monday 4:41pm") now parse the correct sender and date when the aria-label includes a trailing conversation name.
- Sender names containing more than two words are no longer mistaken for senders (e.g. long conversation names used as fallback labels).
- All panel controls (calls, alias, summary, content, length) now work correctly on load.
- Invalid date input is focused automatically when an error is shown.
- Date fields clear their error highlight as soon as the user starts typing.
- Messages near midnight are no longer incorrectly filtered due to a timezone mismatch.
- Download falls back gracefully when the browser restricts blob URL creation.
- Screen readers no longer announce the decorative panel arrow.
- Date-range input labels are now properly associated with their inputs via `for`/`id`.
- Download button stays disabled after use instead of re-enabling after 10 seconds.
- Messages with identical text from different positions in the conversation are no longer incorrectly deduplicated.

### Changed

- Exported message content is no longer included by default when calling `formatLine` without options — callers must opt in with `includeContent: true`.
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
- `isValidSender`, `findValidDatePrefix`, and extended `normalizeDateToSimple` cases covered by unit tests.
- `aliasChatNames` accepts an optional name map; `data-input/alias-names.json` supplies default replacements (`You` → `Youghurt`, detected name → `Alpha`) used by the server build and tests.
- `aliasChatNames` skips replacing a name that is already the target value (guards against double-aliasing on re-runs).
- Alias panel now shows two name fields: one for your own name and one for the other person; both replace in the export.
- `build:ci` explicitly runs the test suite after the build step rather than relying on it being embedded in the `build` script.
- Golden snapshot files validated for UTF-8 encoding, LF line endings, and no trailing whitespace as part of the test run.
- `messageRules` now covers sticker, GIF, and poll message types so they are no longer classified as `text`; `getContentMeta` handles content text and length omission for each.
- Download panel shows a "Save again" link after the first download so the file can be re-saved without re-scanning.
- `docs/README.md` now documents the exported `.txt` file format including the header, summary block, and per-message line structure.
- Integration test added: mock DOM nodes processed through `buildEntriesFromDocument` → `buildSummary` → `formatExportHeader` → assembled export text, verifying the full scan-to-export wiring.

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
- Aliased self name changed to `Youghurt`.
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

- TXT exports now include link URL content in export-max mode.
- Link content now uses the resolved URL instead of a generic label.
- Added fallback Google Maps URL for pinned locations with no direct link.
- Fixed sender name parsing for dash-form aria-labels so leading conversational tokens stay in message content.
- Fixed duration parser to ignore wall-clock times like `1:23 PM`.

## v5.1.0 (2026-05-15)

### Changed

- Renamed demo pipeline folders to `data-input/`, `data-output/optimized-html/`, and `data-output/json-format/`.
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
