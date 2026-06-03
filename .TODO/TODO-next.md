# TODO — Next tasks

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

## Process

- Process note: use T-prefixed IDs from `.todo/config.json`, keep one task per bullet, group tasks by category, and write task descriptions that describe the desired outcome rather than a specific tool or implementation.

## Content extraction

- T110. Replace hardcoded `"voice note"` fallback content text with actual transcript text when Facebook supplies richer transcript data in chat exports. Check current export format for transcript availability; if present, wire it through metadata extraction and update golden snapshots.

## Stability

- T186. Remove hardcoded `"Yoghurt"` to `"Youghurt"` normalization in `export-text.js` sender alias function so alias configuration is the single source of truth (server currently overrides user-configured aliases).
- T187. Replace `throw err` with `console.error(err)` inside the `setTimeout` callback in `src/frontend/src/index.js` `scanStep()` to prevent unhandled promise rejections crashing the browser script.
- T188. Add `t.teardown()` to the integration test harness so generated artifacts in `data-output/` are cleaned up after the test suite finishes.
- T197. Add `console.warn` logging with the error object to every bare `catch {}` block across shared modules (`message-metadata.js`, `aria-label-parser.js`, `export-text.js`, `create-nodes.js`, `export-formatter.js` and `app-config.js`) so config parsing failures produce diagnostic output instead of silent fallback.

## Shared code

- T189. Consolidate duplicated `escapeRegExp` and `replaceWholeWord` into a single shared module — extract from `utils.js` and `alias-utils.js` with unified `"you"`-preservation behavior so server and frontend alias replacement are consistent.
- T190. Import `parseReferenceDate` from `aria-label-parser.js` into `create-nodes.js` instead of redefining the identical 20-line function.
- T191. Import `stripTrackingParams` from `message-metadata.js` into `create-nodes.js` and remove the redundant explicit parameter names already covered by the `utm_` prefix check.
- T192. Extract duplicated `findMatchingClosingTag` from `optimize-html.js` and `create-nodes.js` into a shared `html-utils.js` module.
- T202. Consolidate duration normalization logic by importing `normalizeDuration` from `message-metadata.js` in all modules that currently reimplement similar functionality.

## Build

- T153. Rebuild the frontend dist bundle (`app.js`, `app.min.js`) to include the `chooseRule` deduplication, dead-code removal, and word-length content changes.
- T185. Verify `.husky/pre-push` and `.husky/commit-msg` hooks match documentation and only lint on push.
- T193. Remove `src/build.js` wrapper and point `package.json` `build:frontend` directly at `src/frontend/build.cjs` to eliminate unnecessary indirection.
- T194. Remove dead `rel*` path constants from `build-server.cjs` (lines 26–29) that shadow the semantically identical resolved absolute paths used everywhere else.
- T195. Add `BUILD_WATCH` environment variable support to the frontend esbuild build so `pnpm build:frontend` can run in watch mode during development.
- T196. Add lightweight structural validation in `build-server.cjs` — check that input HTML files contain at least one `aria-roledescription="message"` element before attempting extraction so malformed files produce a clear error instead of garbage output.

## Schema & config

- T177. Add `export-summary-combined.txt` and `export-summary-detailed.txt` to `export-config.json` and `generated-txt-schema.json` so all 6 export variants are covered by TXT schema validation.
- T178. Align `roughTextLine` and `roughWordsLine` patterns between `export-config.json` and `generated-txt-schema.json` so both match the actual combined and detailed summary output formats. Fix `export-config.json` `roughWordsLine` (currently `^$`).

## Dead code

- T179. Remove or fix `beautify-optimized-html.js` (references non-existent `HTML Optimised` directory), remove unused `rules/selectors.js` `selectors` export, and remove unused `rules/classes.json`.

## Documentation

- T180. Update stale `src/frontend/builds.js` references to `build.cjs` across `docs/developer-guide/` files.
- T181. Update `docs/user-guide/README.md` and `docs/developer-guide/tech.md` to list six TXT export variants instead of four, and mention the raw-date and JSON summary formats.

## Cleanup

- T182. Stop exporting internal-only functions (`formatUrlCompact`, `extractPinnedLocationLink`, `isLinkOnlyText`, `normalizeContentType`) from `message-metadata.js` since no external modules use them. Convert to module-private if safe.
- T198. Rename server-side `formatExportFileName` in `export-text.js` to `formatServerExportFileName` so it does not collide with the frontend function of the same name in `frontend-utils.mjs`.

## Test coverage

- T183. Add direct unit tests for `buildDetailedSummary()`, `buildSummaryJson()`, and `buildEntryFromEntry()` — currently only covered by integration golden snapshot comparison.
- T184. Add direct unit tests for `extractHtmlLocale()`, `findMatchingClosingTag()`, and `extractRawDuration()` from `create-nodes.js`.
- T199. Split `tests/test-other.js` (432 lines covering 7+ concerns) into focused per-module test files: `test-dom-pipeline.js`, `test-preview-nodes.js`, `test-export-schema.js`.
- T200. Add unit tests for Unicode name recognition in `aria-label-parser.js` and `utils.js` to verify proper handling of international characters in sender names.
- T201. Add tests to verify word count calculations are consistent across JSON exports and text exports for all message types.
