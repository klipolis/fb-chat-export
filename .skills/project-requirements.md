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
- Keep raw HTML and optimized HTML separated in `Data-input-html-raw/` and `Data-output-html/`.
- Push final flattened JSON exports to `Data-output-json/`.
- Avoid nested `nodes` wrappers in exported JSON; use `data_preview.optimised_date` in a simple 24-hour date/time format.
- Use `aria-label` as the primary message dedupe key and remove `data-message-id` dependencies.
- Anonymize only sender/receiver labels in raw HTML, including `aria-label` and profile image `alt` values, while preserving message text and chat titles.
- Prioritize explicit `link` classification for raw files whose filename indicates link data, and never override link types with image heuristics.
- For link-type exports, prefer canonical URL values as message content when URLs are available in raw metadata or message anchors.
- Parse dash-form labels (`At <date>, <sender> - <message>`) so conversational tokens remain in message text and sender names stay clean.
- Ensure missed call exports do not include duration metadata.
- Treat reply messages as text in exports, while still recognizing reply structure for locating messages if needed.
- Use shared relative date parsing for chat timestamps: plain times map to today, weekday labels map to the most recent matching day, and yesterday/today are handled consistently.
- Use minute-based content length for audio/video calls and voice messages, and omit length for link preview exports.
- Expose a stable `data_preview.duration` field for timed preview exports when duration metadata is available.
- Add a top-level `export_date` field to generated preview JSON output.
- Validate final `Data-output-json/` export schema with a dedicated test and JSON schema file under `tests/`.
- Add a `pnpm run build:clean` script to safely clear generated build artifacts.
- Provide separate `pnpm` build scripts for server, frontend, and CI workflows.
- Keep shared metadata logic compatible with frontend one-file userscript runtime (no server file-name dependency for core content behavior).
- Resolve Facebook/Messenger redirect links (for example `l.php`, `flx/warn`) to original URLs when possible.
- Keep TXT summary structure schema-driven and reusable through `tests/generated-txt-schema.json` summary concepts.
- Keep total summary rough counts derived from summed person summary counts for consistency.
- Keep per-person summary totals excluding `deleted/unsent` and missed call types.
- Count call totals in summaries using only audio/video calls and voice notes/messages (not missed calls).
- Keep anonymized self sender output as `Youghurt` in final exports.
- Keep generated `dist/`, `Data-output-html/`, and `Data-output-json/` artifacts in source control.
- Keep build-specific `dist/userscript.js` versioning separate from `package.json` using `BUILD_VERSION`.
- Use minor version bumps for release-level changelog entries that contain feature or contract updates.
- Keep `package.json` version aligned with the topmost changelog release heading.
- Update changelog entries for every new helper or export schema change.
