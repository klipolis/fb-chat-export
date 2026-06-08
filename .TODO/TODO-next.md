# TODO — Next tasks

Process instructions: fetch T-number from `.todo/config.json` before adding tasks. One task per bullet. Group by canonical categories. Keep T-numbers stable when moving tasks.

## Build / CI

- no tasks

## Test coverage

- T-325. Add unit test for reuseMode 'narrower' date filtering — verify earlier messages are excluded and later messages are included when shrinking the date range
- T-326. Add test for cache invalidation when dates expand beyond the cached window — verifies reuse is rejected and a full rescan is triggered
- no tasks

## Documentation

- T-327. Document the incremental append cleanup strategy — when existing cache entries are preserved and new messages are appended instead of rebuilding from scratch
- no tasks

## Refactoring

- T-298. Extract all inline CSS from frontend/src/index.js and ui.js into a single injected stylesheet — ~1200 lines of hardcoded element.style.cssText currently mixed with logic, making visual changes risky
- T-328. Extract reuseMode string constants ('exact', 'alias-only', 'narrower') into a shared constants module — eliminates duplicated string literals in index.js and any future reuse-site
- no tasks

## Schema & config

- T-329. Add schema rule that export-json-full respects includeContent/includeLength options when they are disabled — null content and zero/omitted length fields must validate correctly
- no tasks

## Export format

- T-330. Add an export-options snapshot block to export-json-full so consumers can see which flags produced the output without parsing the request URL
- no tasks

## Message type detection

- T-331. Add a message-type rule to distinguish pinned-location messages from generic links — they use link-like aria-labels but should be classified as a distinct type for accurate count summaries
- no tasks

## Content extraction

- T-332. Strip emoji variant selectors (skin-tone modifiers) only from length-calculation inputs, not from exported content — preserves skin-tone data in the export while keeping word counts consistent
- no tasks

## Alias / Anonymisation

- T-333. Warn when two aliases map to the same output name — silent collisions in applyAliasToText collapse distinct senders into one identity without user awareness
- no tasks

## Frontend

- T-334. Add a visual cache-hit indicator (colored dot or badge) next to the status bar — lets users know the export was reused without parsing the text message
- T-335. Persist exportOptions (includeContent, includeLength, aliasChk, messageTypeFilter) in sessionStorage alongside the date range — restoring a session restores every visual preference
- T-345. Collapse the export textbox by default and lazy-load its content only when the user expands it — avoids holding the full export text in memory during scan
- T-346. Keep the Copy and Download buttons visible in collapsed panel mode — users can action the export without expanding the textbox
- T-347. Change the download button label to "Download .txt file" — clarifies the export format at the point of action
- no tasks

## Cleanup

- T-336. Add a configurable cache TTL for browser export entries (default 24 hours) — prevents overnight scans from serving stale exports when the chat has changed
- no tasks

## Process

- T-337. Update the pre-commit hook to run lint:docs only when docs/ files are staged — avoids unnecessary markdownlint passes on code-only commits
- no tasks
