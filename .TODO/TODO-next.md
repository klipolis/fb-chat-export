# TODO — Next tasks

Process instructions: fetch T-number from `.todo/config.json` before adding tasks. One task per bullet. Group by canonical categories. Keep T-numbers stable when moving tasks.

## Build / CI

- T-348. Add a CI workflow that runs `pnpm run lint:docs` only when `docs/` or markdown files change, using `paths` and `paths-ignore` — reduces CI time for code-only commits
- no tasks

## Test coverage

- T-325. Add unit test for reuseMode 'narrower' date filtering — verify earlier messages are excluded and later messages are included when shrinking the date range
- T-326. Add test for cache invalidation when dates expand beyond the cached window — verifies reuse is rejected and a full rescan is triggered
- T-349. Add test for lazy-loaded export textbox — verify memory usage stays flat during scan and content is only rendered on expand
- T-350. Add test for collapsed-panel button visibility — verify Copy and Download buttons remain accessible without expanding the textbox
- T-370. Add integration test for case-insensitive alias matching — verifies lookupAlias matches case variants (John, john, JOHN) when toggle is active and falls through when off
- no tasks

## Documentation

- T-327. Document the incremental append cleanup strategy — when existing cache entries are preserved and new messages are appended instead of rebuilding from scratch
- T-351. Add a README section for browser-export keyboard shortcuts and collapsed-panel workflow — users currently have no guidance on the new UI state
- no tasks

## Refactoring

- T-298. Extract all inline CSS from frontend/src/index.js and ui.js into a single injected stylesheet — ~1200 lines of hardcoded element.style.cssText currently mixed with logic, making visual changes risky
- T-328. Extract reuseMode string constants ('exact', 'alias-only', 'narrower') into a shared constants module — eliminates duplicated string literals in index.js and any future reuse-site
- T-352. Consolidate the three download button label variants ("Download .txt", "Download .txt file", "Save again") into a single formatter function — prevents label drift across click handlers
- T-371. Replace remaining inline font-size/color style patterns with pe-label/pe-label-dull classes in ui.js createAliasRows — completes the CSS consolidation
- no tasks

## Schema & config

- T-329. Add schema rule that export-json-full respects includeContent/includeLength options when they are disabled — null content and zero/omitted length fields must validate correctly
- no tasks

## Export format

- T-330. Add an export-options snapshot block to export-json-full so consumers can see which flags produced the output without parsing the request URL
- T-353. Add a `lazyLoad` metadata flag to the export-json-full schema — signals that the text content streamed on demand rather than embedded at generation time
- no tasks

## Message type detection

- T-331. Add a message-type rule to distinguish pinned-location messages from generic links — they use link-like aria-labels but should be classified as a distinct type for accurate count summaries
- no tasks

## Content extraction

- T-332. Strip emoji variant selectors (skin-tone modifiers) only from length-calculation inputs, not from exported content — preserves skin-tone data in the export while keeping word counts consistent
- no tasks

## Alias / Anonymisation

- T-333. Warn when two aliases map to the same output name — silent collisions in applyAliasToText collapse distinct senders into one identity without user awareness
- T-354. Add a "Preview aliases" toggle that shows the first 5 aliased messages live before export — lets users verify alias mapping correctness without running a full export
- T-369. Persist case-insensitive alias toggle state in localStorage alongside other alias options — prevents checkbox reset when panel reopens mid-session
- no tasks

## Frontend

- T-334. Add a visual cache-hit indicator (colored dot or badge) next to the status bar — lets users know the export was reused without parsing the text message
- T-335. Persist exportOptions (includeContent, includeLength, aliasChk, messageTypeFilter) in sessionStorage alongside the date range — restoring a session restores every visual preference
- T-345. Collapse the export textbox by default and lazy-load its content only when the user expands it — avoids holding the full export text in memory during scan
- T-346. Keep the Copy and Download buttons visible in collapsed panel mode — users can action the export without expanding the textbox
- T-347. Change the download button label to "Download .txt file" — clarifies the export format at the point of action
- T-355. Add tooltip or aria-label to the Copy button showing "Copy text result" — matches the download label style and clarifies clipboard action
- T-356. Add aria-expanded and aria-controls to the export textbox toggle so screen readers announce the collapsed/expanded state
- T-357. Announce lazy-load completion in the status bar ("Export ready. Tap to expand.") so assistive tech users know content is available without opening the textbox
- T-358. Include the export summary and heading inside the panel textbox, matching the structure of the downloaded .txt file — users currently see only the message body in the preview
- T-359. Auto-detect the current user’s real sender name during scan and map it to the `you` alias even when no custom alias is configured — sender lines and message content should show `you` instead of the raw real name without manual setup
- no tasks

## Cleanup

- T-336. Add a configurable cache TTL for browser export entries (default 24 hours) — prevents overnight scans from serving stale exports when the chat has changed
- no tasks

## Process

- T-337. Update the pre-commit hook to run lint:docs only when docs/ files are staged — avoids unnecessary markdownlint passes on code-only commits
- no tasks
