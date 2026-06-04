# TODO - Completed tasks

## Links

- [TODO-next.md](TODO-next.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

## Process

- T-160. Add a short process note at the top of TODO-next that explains how to write T-numbered tasks, group them, and avoid tool-specific wording.
- T-161. Review `.todo/config.json` and TODO files for task-numbering consistency and update any missing entries.
- T-162. Add a brief contributor note in docs/AI-interaction explaining changelog and task entries should focus on outcomes, not implementation details.

---

## Anonymisation

- T-44. Build-server name detection runs a two-pass approach: first scan all chat files to auto-detect a name, then apply aliases before processing each file.
- T-45. Raw HTML write-back is opt-in - a dedicated build flag writes aliased files; the default build preserves the originals.
- T-46. Multi-person explicit name map supports sender-to-pseudonym pairs and a fallback for any unmatched name.

## Summary

- T-47. Generate summaries for all participants, not just the two most active.
- T-48. Non-duration types (stickers, GIFs, reactions, links) count as text in the summary.
- T-49. Sticker and GIF treated as reaction - image-like content excluded from image count.

## Message type detection

- T-50. Classify text messages correctly instead of misreading them as voice-note in the browser scan.
- T-51. Voice-note type aligned between filename and export content.
- T-52. Fix call duration extraction for timers in HH:MM format in the frontend summary.
- T-53. Label-locked type classification - once a label matches, heuristic overrides are skipped.
- T-54. Missed-call rule broadened to match both missed audio and video calls.
- T-55. Reaction emoji-image support covers emoji image reactions and preserves empty content.
- T-56. JSON preview schema reorganised with top-level fields and separate raw/preview sections.
- T-57. Added a dedicated video-link type for plain video platform URLs.
- T-133. Stop the message type detector from misclassifying reaction, sticker, gif, or poll messages when the filename happens to match a special keyword.
- T-134. Fix a gap where some link messages return no parser data, so their preview shows empty.

## Output formatting

- T-58. Duration format normalised to MM:SS or HH:MM:SS without a "mins" suffix.
- T-59. Added a compact video-link URL form for TXT exports.
- T-60. Parse full calendar date labels without requiring the "At" prefix.

## Anonymisation

- T-61. Time-only date edge case handled - time-only labels resolve to the current day.

## Export format

- T-62. TXT header includes "Options:" and "Unused:" lines with blank-line separation.
- T-63. Alias config centralised as the single runtime source.
- T-64. Platform userscript header template moved to its own config file.
- T-65. Export filename includes the selected date range.

## Test coverage

- T-66. Unit tests added for file-name and label-rule priority in type detection.
- T-67. Export header coverage added for all recognised message types.

## Browser frontend improvements

- T-68. Date parser accepts slash-separated date formats.
- T-69. Scan completion displays elapsed time.
- T-70. Browser panel persists the last-used date range.
- T-71. Scan progress shows scroll position as a percentage.
- T-72. Stop feedback uses "Stopped" instead of "Done".
- T-73. Keyboard Enter starts scan from date fields.
- T-74. Panel open/closed state is persisted.

## Frontend correctness / edge cases

- T-75. Conversation name falls back to the page heading on non-English locales.
- T-76. Date timezone mismatch handled consistently.
- T-77. FileReader CSP fallback runs asynchronously.
- T-78. Call duration extraction scoped to the timer element only.

## Frontend accessibility

- T-79. Details/summary open state mirrors aria-expanded.
- T-80. Validation errors focus the invalid input field.
- T-81. Download button uses aria-disabled for screen reader compatibility.

## Shared logic / server

- T-82. Duration normaliser returns null for unrecognised strings like wall-clock times.
- T-83. File name part sanitisation truncates to 40 characters.
- T-84. Package manager version constrained to the project's expected range.

## Build / CI

- T-85. Full test suite includes lint and both unit suites.
- T-86. Dist validation no longer triggers a rebuild as a side effect.
- T-157. Created lint script for TODO file format and cross-reference validation.

## Testing

- T-87. Export line format option combinations covered.
- T-88. Summary edge cases covered.
- T-89. Date parser and relative date tests added.
- T-90. Test UI file doesn't mutate the global document.
- T-91. Download handler lifecycle safe from onclick reassignment.
- T-92. Duplicate message dedupe key stabilised.
- T-93. Export line content semantics clarified.
- T-136. Add test cases for sender name validation at the export level, matching the existing parser coverage.
- T-137. Write an end-to-end test that runs a multi-image message through the full build pipeline and checks the image count in the summary.

## Shared parser

- T-94. Parser handles sender names that include trailing conversation name.
- T-95. Sender validator rejects names with more than two words.
- T-96. Parser helper functions exported for testing.

## Refactoring

- T-135. Pull sender name validation rules (max words, max length) into one shared place so the parser and export code use the same limits.

## Alias support

- T-97. Alias function accepts an optional name map.
- T-98. Alias replacement skips names that are already targets.
- T-99. Alias panel supports an other-person alias field.
- T-100. Download UI includes a "Save again" link after first export.
- T-101. Sticker, GIF, and poll rules extended for content metadata and summary.
- T-102. Export format docs added to README.
- T-103. Scan-to-export integration coverage added.

## Build / CI extras

- T-104. Golden snapshot validation for encoding, line endings, and whitespace.
- T-105. CI build explicitly runs build then test.
- T-106. Facebook redirect normaliser output verified not inserted into DOM.

## Runtime config and export docs

- T-119. Consolidated shared runtime config for browser alias mappings and date rules.
- T-120. Server config supports date override for deterministic builds.
- T-121. Relative date parsing sourced from shared config in both frontend and server.
- T-122. Browser panel alias validation, custom file name input, and session persistence active.
- T-123. Alias replacement unit tests added for explicit and fallback behavior.
- T-124. TXT export header format, option state, and alias map documented in user guide.
- T-125. Developer docs reviewed for shared config and server config.
- T-126. Lint run and reported issues fixed.
- T-127. Self-healing lint fix script confirmed available.

## Developer guide

- T-128. Documented message type classification and data validation rules in developer guide.
- T-129. Updated sender name validation to allow three-word names up to 49 characters.
- T-130. Added developer guide section for multi-image messages with correct counting and display normalisation.
- T-131. Added test fixtures for three-word sender name and multi-image boundary cases.
- T-132. Verified golden export snapshots stable after name validation changes.

## Documentation

- T-138. Document multi-image count display (`~ N images`) and sender name validation rules in the user guide.
- T-139. Set up markdownlint for the docs folder and check the new message types guide passes.
- T-140. Add cross-references between the message types guide and the JSON schema docs so related rules are easy to find.
- T-154. Review CHANGELOG entries under `## [Unreleased]` for style consistency - direct active voice, no internal identifiers or file paths, no duplicate entries.
- T-155. Merge orphan `### Fixed` sections in CHANGELOG so all fixes live under a single `### Fixed` heading. Added export-summary-json.txt variant for structured JSON summary output.
- T-158. Review AGENTS.md and doc guidance to ensure changelog and commit rules are consistently referenced across all AI-facing guides.

## Link detection

- T-109. Extend video-link detection to cover Instagram, Twitter/X, Twitch, and similar video-sharing URLs.

## Content extraction

- T-111. Preserve emoji reaction content in preview data - emoji characters from reaction messages are now stored in data_preview.content instead of being discarded.

## Display and alias fixes

- T-141. Extended sender name detection in labels to handle dash separators (-), so names followed by a dash instead of a colon are still found for aliasing.
- T-142. Added `Ötves` as an explicit alias entry in both config files so it always maps to the fallback name regardless of auto-detection thresholds.
- T-143. Make tests expect `image` as the label for all image messages, not the raw `image-2` or `image-3` variants.

## Cleanup

- T-145, T-148, T-151. Stripped unreachable message-type references that `chooseRule` never produces.

## Test coverage

- T-146. Export tests now verify emoji reaction content in the output.
- T-152. Updated test expectations to match the word-length content format.
- T-156. Add raw sample files for sticker, GIF, and poll types to data-input-test for end-to-end coverage.

## Refactoring

- T-147. Consolidated message-type resolution into a single shared helper used by all code paths.
- T-171. Split monolithic run-tests.js into per-module test files for maintainability.

## Coverage & testing

- T-163. Fixed duration format assertion in integration test to properly validate normalized HH:MM:SS durations.
- T-164. Added golden snapshot validation for TXT summary-combined and summary-detailed export variants.
- T-170. Added formatExportFileName edge case tests for null, empty, undefined, and unknown mode parameters.
- T-172. Added unit test coverage for buildSummary and buildDetailedSummary fixedParticipants filter.

## Documentation

- T-165. Fixed broken build-preview command reference in docs/README.md (now build:preview).
- T-166. Corrected user guide summary example to match the single-line ~ N text / N words format.
- T-167. Rewrote JSON schema developer guide to match the actual data_raw / data_preview field structure.

## Code quality

- T-168. Added sticker, gif, reaction, poll, and audio call to the text rule negative lookahead exclusion list.

## Link detection

- T-173. Fixed hasLink detection in frontend to match server behavior: bare word "link" no longer triggers link classification - only URL patterns.

## Coverage

- T-174. Added link-video to the TXT export message types list so the header accurately reflects all filename-derived types present in the export body.
- T-183. Added direct unit tests for `buildDetailedSummary()`, `buildSummaryJson()`, and `buildEntryFromEntry()` in `tests/test-export-formatter.js`.
- T-184. Added direct unit tests for `extractHtmlLocale()`, `findMatchingClosingTag()`, and `extractRawDuration()` in `tests/test-create-nodes.js`.
- T-200. Added unit tests for Unicode name recognition: 15 `isValidSender` assertions with Latin-extended/Cyrillic/CJK/Arabic names, 10 `parseAriaLabel` assertions with Unicode senders, and `normalizeLabel` Unicode preservation test.
- T-201. Added word count consistency test (30 assertions) verifying same word totals across `formatLine`, `buildEntryFromEntry`, `buildSummary` (text), and `buildSummaryJson` (JSON) for all message types.
- T-202. Added Unicode sender + image pipeline tests: `buildEntryFromEntry` with Ötves Erno image and `extractMessageEntry` DOM pipeline with �lvaro/?? image entries.
- T-203. Added voice-note duration consistency test (12 assertions) verifying extractRawDuration → normalizeDuration pipeline for MM:SS, HH:MM:SS, and mins/secs formats.
- T-204. Added duration edge case tests (26 assertions) covering malformed formats, empty/invalid inputs, zero durations, and negative signs for both `extractRawDuration` and `normalizeDuration`.
- T-205. Added alias name mapping tests using project's actual configured pairs: Rob→Barnabas, You→Youghurt, any→XYZ in both aliasChatNames and applyAliasToText contexts.
- T-224. Added unit tests for duration formatting and conversion functions (24 assertions) covering zero, normal, negative, null, undefined, and invalid inputs.
- T-225. Added unit tests for HTML sanitization utilities stripAttributes and normalizeTagStrings (31 assertions) covering attribute stripping, case handling, and edge cases.
- T-226. Added unit tests for shared constants module (27 assertions) verifying TIMED_CALL_TYPES, MISSED_CALL_TYPES, CALL_TYPES composition, CONTENT_TYPES set, and export checks.
- T-199. Split `tests/test-other.js` (469 lines, 14 subtests, 496 assertions) into three focused per-module test files: `tests/test-dom-pipeline.js` (5 subtests), `tests/test-preview-nodes.js` (7 subtests), and `tests/test-frontend-build.js` (2 subtests).

## Integration test

- T-188. Integration test harness already includes `tap.teardown()` with conditional cleanup based on `serverBuildCache`.

## Documentation

- T-175. Documented all four TXT export variants (max, minimal, summary-combined, summary-detailed) in the user guide, including the combined vs detailed summary differences and the "posts" vs "messages" label convention.

## Browser export

- T-176. Wired the selected date range into the browser export filename so downloaded files include the date range instead of using a generic conversation-name-based filename.

## Export format

- T-159. Added export-raw-date.txt variant that includes the raw aria-label date text in parentheses alongside the normalized date in each message line.

## Dead code

- T-179. Removed unused `beautify-optimized-html.js`, `rules/selectors.js`, and `rules/classes.json`.

## Cleanup

- T-182. Stopped exporting internal-only functions (`formatUrlCompact`, `extractPinnedLocationLink`, `isLinkOnlyText`, `normalizeContentType`) from `message-metadata.js`.
- T-186. Removed hardcoded `"Yoghurt"` ? `"Youghurt"` normalization from `export-text.js` so alias configuration is the single source of truth.
- T-187. Replaced `throw err` with `console.error(err)` inside the `setTimeout` callback in `src/frontend/src/index.js` `scanStep()` to prevent unhandled promise rejections.
- T-193. Removed `src/build.js` wrapper and pointed `package.json` `build:frontend` directly at `src/frontend/build.cjs`.
- T-194. Removed dead `rel*` path constants from `build-server.cjs` lines 26�29.

## Documentation

- T-180. Updated developer guide references to use the renamed build script.
- T-181. Updated user guide to list six TXT export variants, including raw-date and JSON summary formats.
- T-212. Updated documentation to use words instead of chars for message length, reflecting the character-to-word count change.
- T-207. Created developer onboarding guide covering project overview, setup, structure, workflow, and coding conventions linked from existing documentation.

## Content extraction

- T-110. Detects generic voice-note labels as fallback content and skips media-UI segment text - when normalizedText contains real transcript, uses it; otherwise keeps 'voice note'.

## Shared logic

- T-213. Added build-time JSON schema validation to `build-server.cjs` that validates all generated preview files against the updated schema (fixed `name` field missing, `length` type corrected) immediately after creation, catching structural issues early in the pipeline.
- T-219. Created shared constants module (`src/shared/constants.js`) with message type arrays (`TIMED_CALL_TYPES`, `MISSED_CALL_TYPES`, `CALL_TYPES`, `CONTENT_TYPES`) used by export formatter and summary modules.
- T-220. Consolidated duration normalization by creating `src/shared/duration-utils.js` that exports `normalizeDuration`, `extractRawDuration`, `formatDurationSeconds`, `durationToMinutes`, and `durationToSeconds` from a single source, removed duplicate definitions from four files.
- T-221. Moved `stripAttributes` and `normalizeTagStrings` from `optimize-html.js` into `src/shared/html-utils.js` alongside existing `findMatchingClosingTag`.
- T-189. Consolidated `escapeRegExp` and `replaceWholeWord` into `src/shared/string-utils.js` with unified you-preservation behavior; both `utils.js` and `alias-utils.js` import from there.
- T-190. Imported `parseReferenceDate` from `aria-label-parser.js` into `create-nodes.js`, removed local copy.
- T-191. Imported `stripTrackingParams` from `message-metadata.js` into `create-nodes.js`, removed local copy.
- T-192. Extracted `findMatchingClosingTag` into `src/shared/html-utils.js`; both `optimize-html.js` and `create-nodes.js` import from there.
- T-197. Verified all catch blocks in shared modules already have `console.warn` with error - no bare `catch {}` blocks found.

## Schema & config

- T-177. Added `export-summary-combined.txt` and `export-summary-detailed.txt` to `export-config.json` and `generated-txt-schema.json`.
- T-178. Fixed `roughWordsLine` pattern from `^$` to `^~\s+\d+\s+words$` and `roughTextLine` to accept `text / words` format; added `skipBodyValidation` flag for summary-only exports; extended `totalLine` to accept `posts`.

## Build

- T-153. Rebuilt frontend dist bundle (app.js, app.min.js).
- T-185. Verified `.husky/pre-push` and `.husky/commit-msg` hooks match documentation; updated CONTRIBUTING.md to document actual pre-push hook instead of incorrect pre-commit.
- T-195. Added `BUILD_WATCH` env variable support to `src/frontend/build.cjs` - when set to `true`, esbuild runs in watch mode on the non-minified bundle.
- T-196. Added input file validation in `build-server.cjs` - checks every HTML file has at least one `aria-roledescription="message"` element before processing.
- T-214. Optimized image detection by skipping full analysis when a message segment contains no image tags.

## Cleanup

- T-198. Renamed server-side `formatExportFileName` in `export-text.js` to `formatServerExportFileName`.
