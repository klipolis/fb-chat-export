# Project Requirements

This file now serves as a central index for split requirement documents.

## See also
- `project-goal.md`
- `project-structure.md`
- `project-notes.md`

## Purpose
- Track the high-level project goal, structure, and workflow requirements.
- Point to dedicated files for goal definition, architecture, and implementation notes.

## Summary
- Keep raw HTML and optimized HTML separated in `Data-input-html-raw/` and `Data-output-html/`.
- Push final flattened JSON exports to `Data-output-json/`.
- Avoid nested `nodes` wrappers in exported JSON; use `export_date` and `data_preview.optimised_date` in simple 24-hour date/time format.
- Use `aria-label` as the primary message dedupe key and remove `data-message-id` dependencies.
- Treat reply messages as text in exports, while still recognizing reply structure for locating messages if needed.
- Use shared relative date parsing for chat timestamps: plain times map to today, weekday labels map to the most recent matching day, and yesterday/today are handled consistently.
- Use minute-based content length for audio/video calls and voice messages, and omit length for link preview exports.
- Expose a stable `data_preview.duration` field for timed preview exports when duration metadata is available.
- Add a top-level `export_date` field to generated preview JSON output.
- Validate final `Data-output-json/` export schema with a dedicated test and JSON schema file under `tests/`.
- Add a `pnpm run build:clean` script to safely clear generated build artifacts.
- Provide separate `pnpm` build scripts for server, frontend, and CI workflows.
- Keep generated `dist/`, `Data-output-html/`, and `Data-output-json/` artifacts in source control.
- Keep build-specific `dist/userscript.js` versioning separate from `package.json` using `BUILD_VERSION`.
- Update changelog entries for every new helper or export schema change.
