# Project Notes

- The helper pipeline should preserve raw HTML in `Data-input-html-raw` while writing cleaned snapshots to `Data-output-html`.
- `create-nodes.js` should generate JSON previews directly in `Data-output-json` and avoid nested `nodes` arrays.
- Export metadata should use `export_date` and `data_preview.optimised_date` as simple 24-hour strings, and date metadata should include both original/raw and optimized forms.
- Parse chat label dates consistently across browser and server exports: plain timestamps are today, weekday labels map to a recent day, and `today`/`yesterday` are normalized.
- Link previews should include `content_link` and omit `content_length`.
- Reply messages should be treated as text when exporting, while location helpers can still recognize reply elements.
- Audio/video call and voice message lengths should be expressed in minutes rather than character counts.
- Maintain dedicated `pnpm` scripts for server, frontend, and CI builds.
- Keep generated artifacts including `dist/`, `Data-output-html/`, and `Data-output-json/` checked into the repository.
- Place any automated test suites and validation scripts in a dedicated `tests/` directory.
- Use `aria-label` for deduplication and remove `data-message-id` references from helper locators and export logic.
- Keep changelog updates consistent in `docs/CHANGELOG.md`.
- Store build-specific userscript versions via `BUILD_VERSION` and validate that generated `dist/userscript.js` versions are correct in CI.
