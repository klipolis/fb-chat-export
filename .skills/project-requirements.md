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
- Keep raw HTML and optimized HTML separated in `Input-readonly/` and `Output-generated/`.
- Push final flattened JSON exports to `Output-generated/Data preview/`.
- Avoid nested `nodes` wrappers in exported JSON; use `export_date` and `data_preview.optimised_date` in simple 24-hour date/time format.
- Use `aria-label` as the primary message dedupe key and remove `data-message-id` dependencies.
- Treat reply messages as text in exports, while still recognizing reply structure for locating messages if needed.
- Use minute-based content length for audio/video calls and voice messages, and omit length for link preview exports.
- Provide separate `pnpm` build scripts for server, frontend, and CI workflows.
- Keep generated `dist/` and `Output-generated/` artifacts in source control.
- Update changelog entries for every new helper or export schema change.
