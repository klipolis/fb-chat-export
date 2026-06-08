# TODO — Next tasks

Process instructions: fetch T-number from `.todo/config.json` before adding tasks. One task per bullet. Group by canonical categories. Keep T-numbers stable when moving tasks.

## Build / CI

- no tasks

## Test coverage

- T-292. Add tests for the browser export caching mechanism (canReuseCached, alias-only reuse, narrower-date reuse) — cache logic is currently untested, risking regressions on edge cases
- T-293. Add unit tests for extractMessageParts in index.js — the core browser scan function parses aria-labels, extracts senders, detects links/images, and calls getContentMeta; entirely untested standalone
- T-294. Add unit tests for string-utils.js (escapeRegExp, replaceWholeWord) — only tested indirectly through alias-utils tests; direct tests with Unicode, special regex chars, and overlapping names needed
- T-295. Add unit tests for html-utils.js (findMatchingClosingTag, cleanXClasses) — currently only 2 tests covering stripAttributes and normalizeTagStrings exist

## Documentation

- T-296. Create user-facing troubleshooting guide for browser export — document common issues: "scan hangs at 0%", "wrong names detected", "no messages found", "download not triggering"
- T-297. Add developer guide section on adding a new message type end-to-end — the process spans rules, message-metadata, constants, export-config, TXT schema, and golden snapshots; a walkthrough would make contributors more productive

## Refactoring

- T-298. Extract inline CSS from frontend/src/index.js and ui.js into an injected stylesheet — ~1177 lines use hardcoded element.style.cssText; extracting styles reduces code size and makes visual changes easier
- T-299. Split aria-label-parser.js into focused sub-modules by parsing strategy — 500+ lines with 10+ fallback strategies; splitting into by-sender-colon, by-label, by-date-colon etc makes each independently testable

## Schema & config

- no tasks

## Export format

- T-300. Add export variant with full per-message JSON data (not just summary JSON) — currently only summary has a JSON variant; full JSON export with every message as structured data supports programmatic analysis

## Message type detection

- no tasks

## Content extraction

- no tasks

## Alias / Anonymisation

- T-301. Add alias persistence to localStorage so it survives page reloads — the alias panel currently resets to defaults on refresh; persisting alongside the date range saves re-entry
- T-302. Add case-insensitive alias matching option in the alias panel — Facebook occasionally varies name casing; a checkbox for case-insensitive matching would handle this

## Frontend

- T-303. Add a "Copy to clipboard" export option alongside the download button — some users prefer copying export text directly rather than downloading a file
- T-304. Add a progress bar or percentage indicator during scan — the current text status shows collected count and elapsed time; a visual bar gives a clearer sense of completion
- T-305. Add a "Preview before download" section showing the first 20 lines of the export — users can verify alias settings and date range before committing to a download
- T-306. Add keyboard shortcut (Escape) to stop scan — currently only the button click stops a scan; Escape key handler matches user expectations for cancelling operations
- T-307. Show estimated time remaining during scan based on scroll rate — tracking scroll progress per second and extrapolating gives users a useful ETA beyond elapsed time
- T-308. Add option to auto-start scan when the panel opens for single-chat workflows — users who always export the same chat could skip the manual scan button click

## Cleanup

- no tasks

## Process

- no tasks
