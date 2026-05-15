# Project Notes

- The helper pipeline should preserve raw HTML in `Input-readonly/HTML Raw` while writing cleaned snapshots to `Output-generated/HTML Optimised`.
- `create-nodes.js` should generate JSON previews directly in `Output-generated/Data preview` and avoid nested `nodes` arrays.
- Export metadata should use `export_date` and `data_preview.optimised_date` as simple 24-hour strings, and date metadata should include both original/raw and optimized forms.
- Link previews should include `content_link` and omit `content_length`.
- Reply messages should be treated as text when exporting, while location helpers can still recognize reply elements.
- Audio/video call and voice message lengths should be expressed in minutes rather than character counts.
- Maintain dedicated `pnpm` scripts for server, frontend, and CI builds.
- Keep generated artifacts including `dist/` and `Output-generated/` checked into the repository.
- Use `aria-label` for deduplication and remove `data-message-id` references from helper locators and export logic.
- Keep changelog updates consistent in `docs/CHANGELOG.md`.
