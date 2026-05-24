# Project Requirements

This file now serves as a central index for split requirement documents.

## See also
- `project-goal.md`
- `project-structure.md`
- `project-notes.md`
- `message-content-rules.md`

## Purpose
- Track the high-level project goal, structure, workflow requirements, and developer-facing content rules.
- Point to dedicated files for goal definition, architecture, implementation notes, and raw-to-export message mapping.

## Summary
- Keep raw HTML and optimized HTML separated in `data-input/` and `data-output/optimized-html/`.
- Push final flattened JSON exports to `data-output/json-format/`.
- Avoid nested `nodes` wrappers in exported JSON; use `data_preview.optimised_date` in a simple 24-hour date/time format.
- Use `aria-label` as the primary message dedupe key and remove `data-message-id` dependencies.
- Alias only sender/receiver labels in raw HTML, including `aria-label` and profile image `alt` values, while preserving message text and chat titles.
- Prioritize explicit `link` classification for raw files whose filename indicates link data, and never override link types with image heuristics.
- For link-type exports, prefer canonical URL values as message content when URLs are available in raw metadata or message anchors.
- Parse dash-form labels (`At <date>, <sender> - <message>`) so conversational tokens remain in message text and sender names stay clean.
- Ensure missed call exports do not include duration metadata.
- Treat reply messages as text in exports, while still recognizing reply structure for locating messages if needed.
- Use shared relative date parsing for chat timestamps: plain times map to today, weekday labels map to the most recent matching day, and yesterday/today are handled consistently.
- Use minute-based content length for audio/video calls and voice messages, and omit length for link preview exports.
- Expose a stable `data_preview.duration` field for timed preview exports when duration metadata is available.
- Add a top-level `export_date` field to generated preview JSON output.
- Validate final `data-output/json-format/` export schema with a dedicated test and JSON schema file under `tests/`.
- Add a `pnpm run build:clean` script to safely clear generated build artifacts.
- Provide separate `pnpm` build scripts for server, frontend, and CI workflows.
- Keep shared metadata logic compatible with frontend one-file bundle runtime (no server file-name dependency for core content behavior).
- Resolve Facebook/Messenger redirect links (for example `l.php`, `flx/warn`) to original URLs when possible.
- Keep TXT summary structure schema-driven and reusable through `tests/generated-txt-schema.json` summary concepts.
- Keep total summary rough counts derived from summed person summary counts for consistency.
- Keep per-person summary totals excluding `deleted/unsent` and missed call types.
- Include a new summary word count line in each total and participant block.
- Generate a summary section for every participant present in the export; do not cap at two.
- Count call totals in summaries using only audio/video calls and voice notes/messages (not missed calls).
- Keep aliased self sender output as `Youghurt` in final exports.
- Default build (`build:server` / `build`) reads raw HTML files but never modifies them. Use `build:raw` to write alias names back to raw files.
- `build:raw-clean` strips Facebook-internal utility classes (tokens starting with `x`) and inline `style` attributes from raw HTML files without running full optimisation.
- Share alias mappings and relative-date rules in `data-config/frontend_shared.json`; fall back to `data-config/alias-names.json` for legacy explicit sender mappings when present.
- Keep `data-config/server.json` as a deterministic server-run override source for build reference dates when `BUILD_REFERENCE_DATE` is not supplied.
- Detect sender names from raw labels using only up to two alphabetic words to avoid long conversation names being treated as senders.
- Keep generated `dist/`, `data-output/optimized-html/`, and `data-output/json-format/` artifacts in source control.
- Keep build-specific `dist/app.js` versioning separate from `package.json` using `BUILD_VERSION`.
- Keep platform header text in `data-config/userscript/header.txt` and prepend it to frontend bundles outside of minification.
- Use minor version bumps for release-level changelog entries that contain feature or contract updates.
- Keep `package.json` version aligned with the topmost changelog release heading.
- Update changelog entries for every new helper or export schema change.
- The browser-scan export filename includes the user-selected date range when available.

## Changelog writing rules

- Every changelog entry must describe an **active change** — something added, fixed, changed, or removed. Entries that only describe what was retained, preserved, or left unchanged are not permitted.
- Write in plain, user-facing language. Use active voice: "Exports now include attachments" not "Attachment export support has been added".
- Describe what the user observes or benefits from. Do not mention internal identifiers, environment variable names, or implementation file paths.
- Do not include entries for documentation-only edits, README updates, or planning notes.
- CI, test tooling, and refactor changes with no user-visible effect belong under `### Dev` only.
- Section headers per release: `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Dev`. Use only sections that have entries.
- Keep each entry as short as possible — one sentence per change. Do not repeat information across entries. Avoid mentioning function names, file names, or internal identifiers.
- Do not start a new version heading for uncommitted changes. Add those entries to the existing latest version block.
- When starting a new version block after a commit: only `### Fixed` entries → patch bump (e.g. 5.4.0 → 5.4.1); any `### Added` or `### Changed` entries → minor bump (e.g. 5.4.0 → 5.5.0). Check `package.json` for the current version first.


