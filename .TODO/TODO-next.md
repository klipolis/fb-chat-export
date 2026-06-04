# TODO — Next tasks


Process note: use T-prefixed IDs from `.todo/config.json`, keep one task per bullet, group tasks by category, and write task descriptions that describe the desired outcome rather than a specific tool or implementation.

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

## Stability

- T-188. Add `t.teardown()` to the integration test harness so generated artifacts in `data-output/` are cleaned up after the test suite finishes.

## Shared code

- T-220. Consolidate duration normalization logic by creating a shared duration utility module that exports `normalizeDuration`, `extractRawDuration`, and related functions used across `message-metadata.js`, `create-nodes.js`, and `export-text.js`.
- T-221. Extract common HTML sanitization utilities (like `normalizeTagStrings`, `stripAttributes`) into a shared module to avoid duplication between `optimize-html.js` and other HTML processing code.
- T-219. Create a shared constants module for message type mappings and regex patterns used across multiple modules to ensure consistency.

## Build

- T-213. Add build-time validation to ensure all exported JSON files conform to a predefined schema, catching structural issues early in the pipeline.
- T-214. Optimize image detection logic in `create-nodes.js` to reduce unnecessary DOM traversal when processing messages without attachments.
- T-215. Add support for incremental builds by tracking file modification times and only rebuilding changed components.
- T-216. Implement parallel processing in the build server to utilize multiple CPU cores for faster HTML optimization and JSON generation.
- T-217. Add build artifact size reporting to help identify bloated output files and optimization opportunities.
- T-218. Create a build cache mechanism to avoid reprocessing unchanged files during development iterations.

## Documentation

- T-206. Add comprehensive inline documentation to complex utility functions in shared modules explaining their purpose, parameters, and return values.
- T-207. Create a developer onboarding guide that explains the project architecture, build process, and contribution guidelines.
- T-208. Add JSDoc comments to all public functions in shared modules to enable IDE autocomplete and type checking.
- T-209. Document the expected format and structure of input HTML files for the chat exporter to process correctly.
- T-210. Update stale `src/frontend/builds.js` references to `build.cjs` across `docs/developer-guide/` files.
- T-211. Update `docs/user-guide/README.md` and `docs/developer-guide/tech.md` to list six TXT export variants instead of four, and mention the raw-date and JSON summary formats.
- T-212. Update documentation to reflect the change from character counts to word counts in export formats, including update to any user-facing documentation about the export format.

## Test coverage

- T-183. Add direct unit tests for `buildDetailedSummary()`, `buildSummaryJson()`, and `buildEntryFromEntry()` — currently only covered by integration golden snapshot comparison.
- T-184. Add direct unit tests for `extractHtmlLocale()`, `findMatchingClosingTag()`, and `extractRawDuration()` from `create-nodes.js`.
- T-199. Split `tests/test-other.js` (432 lines covering 7+ concerns) into focused per-module test files: `test-dom-pipeline.js`, `test-preview-nodes.js`, `test-export-schema.js`.
- T-200. Add unit tests for Unicode name recognition in `aria-label-parser.js` and `utils.js` to verify proper handling of international characters in sender names.
- T-201. Add tests to verify word count calculations are consistent across JSON exports and text exports for all message types.
- T-202. Add tests to verify proper handling of image attachments with Unicode sender names (like Ötves Ernő) ensuring correct type normalization to 'image'.
- T-203. Add tests for voice note duration parsing to ensure consistency between raw duration extraction and formatted output.
- T-204. Add tests for edge cases in duration parsing (empty strings, malformed formats, etc.) to ensure robust error handling.
- T-205. Add tests to verify alias name mapping works correctly for all configured name pairs in various message contexts.

