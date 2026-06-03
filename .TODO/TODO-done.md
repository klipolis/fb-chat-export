# TODO — Completed tasks

## Links

- [TODO-next.md](TODO-next.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

## Process

- T160. Add a short process note at the top of TODO-next that explains how to write T-numbered tasks, group them, and avoid tool-specific wording.
- T161. Review `.todo/config.json` and TODO files for task-numbering consistency and update any missing entries.
- T162. Add a brief contributor note in docs/AI-interaction explaining changelog and task entries should focus on outcomes, not implementation details.

---

## Anonymisation

- T44. Build-server name detection runs a two-pass approach: first scan all chat files to auto-detect a name, then apply aliases before processing each file.
- T45. Raw HTML write-back is opt-in — a dedicated build flag writes aliased files; the default build preserves the originals.
- T46. Multi-person explicit name map supports sender-to-pseudonym pairs and a fallback for any unmatched name.

## Summary

- T47. Generate summaries for all participants, not just the two most active.
- T48. Non-duration types (stickers, GIFs, reactions, links) count as text in the summary.
- T49. Sticker and GIF treated as reaction — image-like content excluded from image count.

## Message type detection

- T50. Classify text messages correctly instead of misreading them as voice-note in the browser scan.
- T51. Voice-note type aligned between filename and export content.
- T52. Fix call duration extraction for timers in HH:MM format in the frontend summary.
- T53. Label-locked type classification — once a label matches, heuristic overrides are skipped.
- T54. Missed-call rule broadened to match both missed audio and video calls.
- T55. Reaction emoji-image support covers emoji image reactions and preserves empty content.
- T56. JSON preview schema reorganised with top-level fields and separate raw/preview sections.
- T57. Added a dedicated video-link type for plain video platform URLs.
- T133. Stop the message type detector from misclassifying reaction, sticker, gif, or poll messages when the filename happens to match a special keyword.
- T134. Fix a gap where some link messages return no parser data, so their preview shows empty.

## Output formatting

- T58. Duration format normalised to MM:SS or HH:MM:SS without a "mins" suffix.
- T59. Added a compact video-link URL form for TXT exports.
- T60. Parse full calendar date labels without requiring the "At" prefix.

## Anonymisation

- T61. Time-only date edge case handled — time-only labels resolve to the current day.

## Export format

- T62. TXT header includes "Options:" and "Unused:" lines with blank-line separation.
- T63. Alias config centralised as the single runtime source.
- T64. Platform userscript header template moved to its own config file.
- T65. Export filename includes the selected date range.

## Test coverage

- T66. Unit tests added for file-name and label-rule priority in type detection.
- T67. Export header coverage added for all recognised message types.

## Browser frontend improvements

- T68. Date parser accepts slash-separated date formats.
- T69. Scan completion displays elapsed time.
- T70. Browser panel persists the last-used date range.
- T71. Scan progress shows scroll position as a percentage.
- T72. Stop feedback uses "Stopped" instead of "Done".
- T73. Keyboard Enter starts scan from date fields.
- T74. Panel open/closed state is persisted.

## Frontend correctness / edge cases

- T75. Conversation name falls back to the page heading on non-English locales.
- T76. Date timezone mismatch handled consistently.
- T77. FileReader CSP fallback runs asynchronously.
- T78. Call duration extraction scoped to the timer element only.

## Frontend accessibility

- T79. Details/summary open state mirrors aria-expanded.
- T80. Validation errors focus the invalid input field.
- T81. Download button uses aria-disabled for screen reader compatibility.

## Shared logic / server

- T82. Duration normaliser returns null for unrecognised strings like wall-clock times.
- T83. File name part sanitisation truncates to 40 characters.
- T84. Package manager version constrained to the project's expected range.

## Build / CI

- T85. Full test suite includes lint and both unit suites.
- T86. Dist validation no longer triggers a rebuild as a side effect.
- T157. Created lint script for TODO file format and cross-reference validation.

## Testing

- T87. Export line format option combinations covered.
- T88. Summary edge cases covered.
- T89. Date parser and relative date tests added.
- T90. Test UI file doesn't mutate the global document.
- T91. Download handler lifecycle safe from onclick reassignment.
- T92. Duplicate message dedupe key stabilised.
- T93. Export line content semantics clarified.
- T136. Add test cases for sender name validation at the export level, matching the existing parser coverage.
- T137. Write an end-to-end test that runs a multi-image message through the full build pipeline and checks the image count in the summary.

## Shared parser

- T94. Parser handles sender names that include trailing conversation name.
- T95. Sender validator rejects names with more than two words.
- T96. Parser helper functions exported for testing.

## Refactoring

- T135. Pull sender name validation rules (max words, max length) into one shared place so the parser and export code use the same limits.

## Alias support

- T97. Alias function accepts an optional name map.
- T98. Alias replacement skips names that are already targets.
- T99. Alias panel supports an other-person alias field.
- T100. Download UI includes a "Save again" link after first export.
- T101. Sticker, GIF, and poll rules extended for content metadata and summary.
- T102. Export format docs added to README.
- T103. Scan-to-export integration coverage added.

## Build / CI extras

- T104. Golden snapshot validation for encoding, line endings, and whitespace.
- T105. CI build explicitly runs build then test.
- T106. Facebook redirect normaliser output verified not inserted into DOM.

## Runtime config and export docs

- T119. Consolidated shared runtime config for browser alias mappings and date rules.
- T120. Server config supports date override for deterministic builds.
- T121. Relative date parsing sourced from shared config in both frontend and server.
- T122. Browser panel alias validation, custom file name input, and session persistence active.
- T123. Alias replacement unit tests added for explicit and fallback behavior.
- T124. TXT export header format, option state, and alias map documented in user guide.
- T125. Developer docs reviewed for shared config and server config.
- T126. Lint run and reported issues fixed.
- T127. Self-healing lint fix script confirmed available.

## Developer guide

- T128. Documented message type classification and data validation rules in developer guide.
- T129. Updated sender name validation to allow three-word names up to 49 characters.
- T130. Added developer guide section for multi-image messages with correct counting and display normalisation.
- T131. Added test fixtures for three-word sender name and multi-image boundary cases.
- T132. Verified golden export snapshots stable after name validation changes.

## Documentation

- T138. Document multi-image count display (`~ N images`) and sender name validation rules in the user guide.
- T139. Set up markdownlint for the docs folder and check the new message types guide passes.
- T140. Add cross-references between the message types guide and the JSON schema docs so related rules are easy to find.
- T154. Review CHANGELOG entries under `## [Unreleased]` for style consistency — direct active voice, no internal identifiers or file paths, no duplicate entries.
- T155. Merge orphan `### Fixed` sections in CHANGELOG so all fixes live under a single `### Fixed` heading. Added export-summary-json.txt variant for structured JSON summary output.
- T158. Review AGENTS.md and doc guidance to ensure changelog and commit rules are consistently referenced across all AI-facing guides.

## Link detection

- T109. Extend video-link detection to cover Instagram, Twitter/X, Twitch, and similar video-sharing URLs.

## Content extraction

- T111. Preserve emoji reaction content in preview data — emoji characters from reaction messages are now stored in data_preview.content instead of being discarded.

## Display and alias fixes

- T141. Extended sender name detection in labels to handle dash separators (—), so names followed by a dash instead of a colon are still found for aliasing.
- T142. Added `Ötves` as an explicit alias entry in both config files so it always maps to the fallback name regardless of auto-detection thresholds.
- T143. Make tests expect `image` as the label for all image messages, not the raw `image-2` or `image-3` variants.

## Cleanup

- T145, T148–T151. Stripped unreachable message-type references that `chooseRule` never produces.

## Test coverage

- T146. Export tests now verify emoji reaction content in the output.
- T152. Updated test expectations to match the word-length content format.
- T156. Add raw sample files for sticker, GIF, and poll types to data-input for end-to-end coverage.

## Refactoring

- T147. Consolidated message-type resolution into a single shared helper used by all code paths.
- T171. Split monolithic run-tests.js into per-module test files for maintainability.

## Coverage & testing

- T163. Fixed duration format assertion in integration test to properly validate normalized HH:MM:SS durations.
- T164. Added golden snapshot validation for TXT summary-combined and summary-detailed export variants.
- T170. Added formatExportFileName edge case tests for null, empty, undefined, and unknown mode parameters.
- T172. Added unit test coverage for buildSummary and buildDetailedSummary fixedParticipants filter.

## Documentation

- T165. Fixed broken build-preview command reference in docs/README.md (now build:preview).
- T166. Corrected user guide summary example to match the single-line ~ N text / N words format.
- T167. Rewrote JSON schema developer guide to match the actual data_raw / data_preview field structure.

## Code quality

- T168. Added sticker, gif, reaction, poll, and audio call to the text rule negative lookahead exclusion list.

## Link detection

- T173. Fixed hasLink detection in frontend to match server behavior: bare word "link" no longer triggers link classification — only URL patterns.

## Coverage

- T174. Added link-video to the TXT export message types list so the header accurately reflects all filename-derived types present in the export body.

## Documentation

- T175. Documented all four TXT export variants (max, minimal, summary-combined, summary-detailed) in the user guide, including the combined vs detailed summary differences and the "posts" vs "messages" label convention.

## Browser export

- T176. Wired the selected date range into the browser export filename so downloaded files include the date range instead of using a generic conversation-name-based filename.

## Export format

- T159. Added export-raw-date.txt variant that includes the raw aria-label date text in parentheses alongside the normalized date in each message line.
