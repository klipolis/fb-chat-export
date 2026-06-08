# TODO — Next tasks

Process instructions: fetch T-number from `.todo/config.json` before adding tasks. One task per bullet. Group by canonical categories. Keep T-numbers stable when moving tasks.

## Test coverage

- T-349. Add test for lazy-loaded export textbox — verify memory usage stays flat during scan and content is only rendered on expand
- T-350. Add test for collapsed-panel button visibility — verify Copy and Download buttons remain accessible without expanding the textbox
- T-370. Add integration test for case-insensitive alias matching — verifies lookupAlias matches case variants (John, john, JOHN) when toggle is active and falls through when off
- no tasks

## Documentation

- T-351. Add a README section for browser-export keyboard shortcuts and collapsed-panel workflow — users currently have no guidance on the new UI state
- no tasks

## Refactoring

- T-298. Extract all inline CSS from frontend/src/index.js and ui.js into a single injected stylesheet — ~1200 lines of hardcoded element.style.cssText currently mixed with logic, making visual changes risky
- T-352. Consolidate the three download button label variants ("Download .txt", "Download .txt file", "Save again") into a single formatter function — prevents label drift across click handlers
- T-371. Replace remaining inline font-size/color style patterns with pe-label/pe-label-dull classes in ui.js createAliasRows — completes the CSS consolidation
- no tasks

## Export format

- T-353. Add a `lazyLoad` metadata flag to the export-json-full schema — signals that the text content streamed on demand rather than embedded at generation time
- no tasks

## Alias / Anonymisation

- T-354. Add a "Preview aliases" toggle that shows the first 5 aliased messages live before export — lets users verify alias mapping correctness without running a full export
- T-369. Persist case-insensitive alias toggle state in localStorage alongside other alias options — prevents checkbox reset when panel reopens mid-session
- no tasks

## Frontend

- T-345. Collapse the export textbox by default and lazy-load its content only when the user expands it — avoids holding the full export text in memory during scan
- T-346. Keep the Copy and Download buttons visible in collapsed panel mode — users can action the export without expanding the textbox
- T-347. Change the download button label to "Download .txt file" — clarifies the export format at the point of action
- T-357. Announce lazy-load completion in the status bar ("Export ready. Tap to expand.") so assistive tech users know content is available without opening the textbox
- T-358. Include the export summary and heading inside the panel textbox, matching the structure of the downloaded .txt file — users currently see only the message body in the preview
- T-359. Auto-detect the user's real sender name during scan and map it to the `you` alias even when no custom alias is configured — sender lines and message content should show `you` instead of the raw real name without manual setup
- no tasks
