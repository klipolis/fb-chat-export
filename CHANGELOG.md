# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Changelog entries should describe active changes in direct present-tense statements. Avoid retrospective phrasing such as "now ..." or passive retention language when writing bullets under `## [Unreleased]`.

## [Unreleased]

### Added
- Add cleanup countdown timer after download in browser export panel
- Add data_raw.name and data_preview.name fields with alias mapping to JSON exports
- Alias panel in browser export auto-populates with detected sender names after scan completes
- Group chat mode checkbox in alias panel controls whether new names auto-populate during scan

- Partial rebuild processes only changed input files and removes stale output for deleted files.
- Parallel worker pool processes HTML optimization across all available CPU cores.
- `pnpm run release` automates version bumps and changelog heading updates. Supports patch, minor, and major override arguments; defaults to minor when new features are present.
- Blocks pushes when the changelog has an empty release section, requiring changes to be recorded before publishing.
- Provides a standalone changelog guard to verify the release notes are not empty before publishing.
- Export filenames omit old tool prefixes for a simpler naming scheme.
- Browser export filenames include the selected date range when filtering by date.
- Server build generates a structured JSON summary variant for programmatic consumption.
- Server build generates a raw-date variant that shows the original date label text alongside the normalized date.

### Changed
- Alias name validation accepts Unicode characters, 1–3 words, max 25 characters, no numbers
- Sender pattern includes underscore and hyphen characters
- Sender validation accepts up to 50 characters and 5 words
- Aria-label parser handles `date:sender` format where the colon directly precedes the sender name
- Server parser skips redundant `Enter, Message sent` aria labels to avoid duplicate export nodes
- Export config and generated-txt-schema align on `includeSummary`, `duration` pattern, and `messageTypes` values
- Golden export summary files regenerated to match current server output

### Fixed

- Stale documentation references in RELEASING.md and skill files
- Error message label in test-frontend-build.js
- Stale eslint ignore entries
- Dead `referenceDateFormat` config option in server data config
- Test expectations in name-fields, word-count-consistency, and aria-label-parser tests
- Export and preview durations display in strict `HH:MM:SS` three-part format (e.g. `00:18:00`) with zero-padded hours.
- Preview dates from relative weekday labels (e.g. `Saturday 4:36am`) resolve to the correct calendar date.
- Alias replacement skips generic lowercase labels when anonymizing sender names.
- Full-name profile images in chat messages have their alt text replaced entirely with the alias instead of only the first name.
- The summary validator accepts any number of participant sections.
- Summary title patterns are dynamic.
- Message type rules include reaction and video-link variants; duration matching uses strict `HH:MM:SS`.
- Summary text count correctly handles entries that carry multiple images.
- Total summary covers every participant.
- Body content length uses word count for all message types.
- Link-video export uses the full URL.
- Server TXT export header lists link-video as a recognised message type.
- Text messages classify correctly as text, not voice, in the browser scan.
- Link detection in the browser export triggers on URL patterns only.

### Changed

- Updated alias configuration so a single source defines runtime replacements and removes duplicate metadata.
- Build and lint script ordering cleaned; added a todos validation command.
- Sticker and animated gif messages are not counted as images in the summary; they count toward the text total alongside reactions.
- Reaction messages using an emoji image classify as `reaction` type.
- Reorganises the JSON preview schema with top-level fields and separate raw and preview sections.
- Reaction messages produce null content in both raw and preview data.
- `video-link` is a new message type for video platform URLs, using the URL as content.
- The voice-note message type uses the name `voice-note` across all rule, preview, and export paths.

### Dev

- Build falls back to sequential alias+optimize when worker_threads is unavailable.
- Developer guide documents incremental build, partial rebuild, cache manifest, and parallel worker pool architecture.
- AI-interaction guidance tracks worker error propagation and cache staleness patterns.
- Build cache JSON removed from version control.
- Debug utilities _debug_build.cjs and _speed.cjs removed from version control.
- Parallel processing tests verify worker alias + optimize and error reporting.
- Build cache tests verify file addition, modification, deletion, and stale output cleanup.
- Shared message type arrays (timed call, missed call, call types) used across export formatter and summary modules.
- Duration normalization logic consolidated into a single shared utility module.
- HTML tag and attribute sanitization moved to a shared module.
- Whitespace normalization function consolidated to its canonical source module.
- Message-type resolution is shared between server and browser code paths.
- Removed unreachable message-type branches that could never be triggered.
- Export tests verify emoji reaction content in the output.
- Raw sample files for sticker, GIF, and poll message types test classification rules and export output end to end.
- Updated test expectations to match the word-length content format.
- A dedicated lint script validates TODO file format and cross-reference consistency.
- AI agent changelog examples follow the repository style guide without retrospective wording.
- JSON validation allows null preview content for non-emoji reaction types.
- TXT export config includes poll and sticker types.
- TXT header validation handles empty lines after the alias block.
- Test script calls hidden dot-prefixed test scripts directly.
- Generated TXT schema synchronised with runtime export config.
- Integration test validates normalized HH:MM:SS duration format on duration-type lines.
- Golden snapshots cover all four TXT export variants.
- Text rule label exclusion list covers sticker, gif, reaction, poll, and audio call types.
- Export filename unit tests cover null, empty, and unknown mode parameters.
- Summary participant filtering covered by unit tests.
- Monolithic test file split into per-module test files.
- Entry-line regex and payload extraction support the raw-date parenthetical format.
- TXT export schema and validation cover the JSON summary and raw-date export variants.
- Remove Links section validation from TODO management scripts
- Extract createDetailsPanel into shared ui.js module
- Husky pre-commit hook reminds to update changelog, session logs, prompt files, and TODO files
- Pre-commit checklist in AGENTS.md for AI agents to follow before every commit

## v5.4.0 (2026-05-18)

### Added

- Reactions (👍, ❤️, 😂, 😮, 😢, 👏) are recognised as a distinct `reaction` message type and excluded from the character-count summary.
- Name aliasing supports multiple explicit sender mappings (e.g. mapping both "You" and a contact name to separate pseudonyms) alongside an automatic fallback for any other detected name.
- `build:raw` script writes aliased names back to raw HTML files on demand; the default build no longer modifies raw HTML.
- `build:raw-clean` script strips platform-internal utility classes and inline styles from raw HTML files without running full optimisation.
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

- Messages with a time-only or day-of-week date (e.g. "Monday 4:41pm") parse the correct sender and date when the aria-label includes a trailing conversation name.
- Sender names containing more than two words are no longer mistaken for senders (e.g. long conversation names used as fallback labels).
- All panel controls (calls, alias, summary, content, length) work correctly on load.
- Invalid date input is focused automatically when an error is shown.
- Date fields clear their error highlight as soon as the user starts typing.
- Messages near midnight are no longer incorrectly filtered due to a timezone mismatch.
- Download falls back gracefully when the browser restricts blob URL creation.
- Screen readers no longer announce the decorative panel arrow.
- Date-range input labels are properly associated with their inputs via `for`/`id`.
- Download button stays disabled after use instead of re-enabling after 10 seconds.
- Messages with identical text from different positions in the conversation are no longer incorrectly deduplicated.

### Changed

- Exported message content is no longer included by default when calling `formatLine` without options — callers must opt in with `includeContent: true`.
- Call duration is read from the call timer element only, not surrounding message text.

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
- `aliasChatNames` accepts an optional name map; `data-config/frontend_shared.json` (`aliasNames` key) supplies default replacements (`You` → `Youghurt`, detected name → `Alpha`) used by the server build and tests.
- `aliasChatNames` skips replacing a name that is already the target value (guards against double-aliasing on re-runs).
- Alias panel shows two name fields: one for your own name and one for the other person; both replace in the export.
- `build:ci` explicitly runs the test suite after the build step rather than relying on it being embedded in the `build` script.
- Golden snapshot files validated for UTF-8 encoding, LF line endings, and no trailing whitespace as part of the test run.
- `messageRules` covers sticker, GIF, and poll message types so they are no longer classified as `text`; `getContentMeta` handles content text and length omission for each.
- Download panel shows a "Save again" link after the first download so the file can be re-saved without re-scanning.
- `docs/README.md` documents the exported `.txt` file format including the header, summary block, and per-message line structure.
- Integration test added: mock DOM nodes processed through `buildEntriesFromDocument` → `buildSummary` → `formatExportHeader` → assembled export text, verifying the full scan-to-export wiring.

## v5.3.0 (2026-05-17)

### Dev

- Changelog, license, and security audit checks added to CI.
- ESLint updated to v10 with flat config.
- All dev dependencies updated to latest versions.
- Node version constraint relaxed to `>=26.0.0`.

## v5.2.2 (2026-05-17)

### Added

- Userscript header generates automatically at build time.
- Bundle version matches the release version automatically.
- Snapshot-based export output validation added to catch regressions in TXT export content.

## v5.2.1 (2026-05-17)

### Added

- Automated release validation checks bundle header, export schema contract, and changelog version sync.
- Regression tests added for message classification, content-type detection, relative date parsing, and TXT line formatting.
- Deterministic version stamping enabled in CI builds.

## v5.2.0 (2026-05-16)

### Changed

- Export summary uses a `Total Summary` block followed by per-person summary lines.
- Per-person summary counts exclude deleted, unsent, and missed call messages.
- Total summary counts are derived from the sum of per-person counts.
- Aliased self name changed to `Youghurt`.
- Call summary includes audio calls, video calls, and voice notes; missed calls are excluded.
- Removed `Total:` prefix from summary count lines.

### Fixed

- Duration fields output correctly in exports.
- Download button is disabled for 10 seconds after click to prevent double-download.
- Completion notice simplified to name, date interval, and elapsed time.

### Dev

- Added linting, security audit, and release validation scripts.
- CI updated to use locked dependency installs and pnpm caching.

## v5.1.1 (2026-05-16)

### Fixed

- TXT exports include link URL content in export-max mode.
- Link content uses the resolved URL instead of a generic label.
- Added fallback Google Maps URL for pinned locations with no direct link.
- Fixed sender name parsing for dash-form aria-labels so leading conversational tokens stay in message content.
- Fixed duration parser to ignore wall-clock times like `1:23 PM`.

## v5.1.0 (2026-05-15)

### Changed

- Renamed demo pipeline folders to `data-input-test/`, `data-output-auto/optimized-html/`, and `data-output-auto/json-format/`.
- Frontend and server share the same message classification and export logic.
- Build-specific version stamping added to the frontend bundle.
- Preview exports include optional call duration.
- Preview exports include an `export_date` field.
- Text export generation added from raw HTML snapshots.
- Fixed sender name detection in anonymization to replace only a single confirmed name.
- Fixed date extraction from link preview `At ...` labels.
- Exported text lines include the message type in brackets after the date.

## v5.0.3 (2026-05-15)

### Fixed

- Server build runs non-interactively by default with automatic anonymization.
- Preview JSON no longer includes internal source metadata.
- Date labels like "today", "yesterday", and weekday names resolve to correct calendar dates.

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

- Main exporter treats replies as text by default rather than a separate `reply` type.
- Audio/video call and voice message length output uses minutes instead of character counts.
- Link preview JSON includes `data_preview.content_link` and omits `content_length` for link items.
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
- Completion message includes elapsed scan time in seconds or minutes

## v2.11.1 (2026-05-14)

### Changed

- **Ignore calls setting** covers `video`, `audio`, and `missed` calls consistently
- **Summary format** updated to:
  - `Total: x messages`
  - `x Days between [from] - [to]`
  - `Person 1/2 (Name): x messages - 3 days, 10 calls (x mins), 3 images`
- **Anonymization input** accepts a custom replacement string for your own name instead of a hardcoded placeholder
- **Settings sidebar** simplified by removing the separate section title

## v2.11.0 (2026-05-14)

### Added

- **Settings panel** on the right-hand side with three unchecked defaults: `Ignore video/audio calls`, `Show my name as [    ]`, and `Summary at top of downloaded file`

### Changed

- **Timestamp format** exports as `[2026-05-08 15:17]`

### Added

- **Summary header** when enabled: exports top summary block with export dates from-top, total message count, and per-person counts including days, call count/duration, and image count
- **Chat output** preserves audio/video call entries and image sent events explicitly in the downloaded history

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

- **Relative date resolution** (`today`, `yesterday`, day names like `Friday`, `Wednesday`): extracts the time component directly from the raw label (handles `9:27am`, `9:27 AM`, `at 9:27 AM` formats) and returns a proper ISO string.
- **Display date**: `displayDate` uses the same resolved ISO string as `msgDate`.

### Changed

- **From date default** is dynamically set to 3 days before today (was hardcoded to `2026-01-19`)

---
