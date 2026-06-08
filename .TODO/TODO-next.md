# TODO — Next tasks

Process instructions: fetch T-number from `.todo/config.json` before adding tasks. One task per bullet. Group by canonical categories. Keep T-numbers stable when moving tasks.

## Build / CI

- no tasks

## Test coverage

- T-310. Add unit tests for the 8 new frontend features (alias persistence, case-insensitive matching, copy-to-clipboard, progress bar, preview, Escape stop, ETA, auto-scan) — all untested and could regress silently
- T-311. Add integration test for the export-json-full variant — verify structured JSON output matches expected schema fields
- T-325. Add unit test for reuseMode 'narrower' date filtering — verify earlier messages are excluded and later messages are included when shrinking the date range
- T-326. Add test for cache invalidation when dates expand beyond the cached window — verifies reuse is rejected and a full rescan is triggered

## Documentation

- T-312. Add developer guide section documenting the browser export cache architecture (exact, alias-only, narrower-date reuse modes with code flow diagrams)
- T-327. Document the incremental append cleanup strategy — when existing cache entries are preserved and new messages are appended instead of rebuilding from scratch
- no tasks

## Refactoring

- T-298. Extract all inline CSS from frontend/src/index.js and ui.js into a single injected stylesheet — ~1200 lines of hardcoded element.style.cssText currently mixed with logic, making visual changes risky
- T-313. Consolidate duplicate CHANGELOG sections — multiple `### Added`, `### Changed`, and `### Fixed` sections exist under `[Unreleased]`; merge into single sections per type in chronological order
- T-328. Extract reuseMode string constants ('exact', 'alias-only', 'narrower') into a shared constants module — eliminates duplicated string literals in index.js and any future reuse-site
- no tasks

## Schema & config

- T-314. Add JSON schema validation for the export-json-full variant — ensure every message has required fields (date, sender, type, text, isCall, isImage, wordCount) with correct types
- T-329. Add schema rule that export-json-full respects includeContent/includeLength options when they are disabled — null content and zero/omitted length fields must validate correctly
- no tasks

## Export format

- T-315. Add per-message duration field to export-json-full — include call duration as a numeric seconds value alongside the string duration
- T-316. Add includeParticipants and includeMessageCount options to the export-json-full header — control whether participant list and count appear in the JSON output
- T-330. Add an export-options snapshot block to export-json-full so consumers can see which flags produced the output without parsing the request URL
- no tasks

## Message type detection

- T-317. Investigate and add detection for Facebook Messenger Room call types and Marketplace message types — these may produce new aria-label formats not covered under existing parser rules and would fall through to generic text handling
- T-331. Add a message-type rule to distinguish pinned-location messages from generic links — they use link-like aria-labels but should be classified as a distinct type for accurate count summaries
- no tasks

## Content extraction

- T-318. Extract quoted reply text separately from main message content — Facebook Messenger includes the replied-to message in the aria-label; currently the entire label text is treated as the message body, losing the reply context boundary
- T-332. Strip emoji variant selectors (skin-tone modifiers) only from length-calculation inputs, not from exported content — preserves skin-tone data in the export while keeping word counts consistent
- no tasks

## Alias / Anonymisation

- T-319. Add alias import/export as JSON in the browser panel — users who manage aliases across multiple chats can save and load alias maps instead of re-entering names each session
- T-333. Warn when two aliases map to the same output name — silent collisions in applyAliasToText collapse distinct senders into one identity without user awareness
- no tasks

## Frontend

- T-320. Add message-type filter dropdown to the browser export panel — allow users to exclude specific types (reactions, calls, images) from export without unchecking the global toggle
- T-321. Show scan progress as a fraction (e.g. "342 / 1500 messages") instead of just the collected count — estimate total messages from scroll position and display both numbers during scan
- T-334. Add a visual cache-hit indicator (colored dot or badge) next to the status bar — lets users know the export was reused without parsing the text message
- T-335. Persist exportOptions (includeContent, includeLength, aliasChk, messageTypeFilter) in sessionStorage alongside the date range — restoring a session restores every visual preference
- no tasks

## Cleanup

- T-322. Audit export-config.json and generated-txt-schema.json for message types that chooseRule never produces (link-embed-no-text, link-text, link-video, reaction-emoji, text-image-replied, text-replied) — remove unused types to keep schemas accurate
- T-323. Remove deprecated `build-preview.js` script if it duplicates `create-nodes.js` functionality — preview JSON is already generated by the main server build pipeline
- T-336. Add a configurable cache TTL for browser export entries (default 24 hours) — prevents overnight scans from serving stale exports when the chat has changed
- no tasks

## Process

- T-324. Add graceful commit-msg fallback when commitlint is not in PATH — husky's commit-msg hook currently fails silently without a clear warning when commitlint binary is unavailable
- T-337. Update the pre-commit hook to run lint:docs only when docs/ files are staged — avoids unnecessary markdownlint passes on code-only commits
- no tasks
