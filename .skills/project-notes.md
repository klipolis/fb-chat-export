# Project Notes

- The helper pipeline should preserve raw HTML in `demo/input-html-raw` while writing cleaned snapshots to `demo/output-html`.
- Anonymization of raw HTML should be limited to sender/receiver names in message metadata and profile `alt` attributes, not message body content.
- `create-nodes.js` should generate JSON previews directly in `demo/output-json` and avoid nested `nodes` arrays.
- Build server should also generate a text export from `demo/input-html-raw` in `demo/output-txt/`, mirroring the user-facing export line format.
- Frontend bundle should run as a single bundled file in live Messenger pages without server-only assumptions.
- Export metadata should use `export_date` and `data_preview.optimised_date` as simple 24-hour strings, and date metadata should include both original/raw and optimized forms.
- Parse chat label dates consistently across browser and server exports: plain timestamps are today, weekday labels map to a recent day, and `today`/`yesterday` are normalized.
- Link previews should include `content_link` and omit `content_length`.
- For Facebook/Messenger forward URLs, resolve redirect parameters (`u`, `url`, `q`) to original links where possible.
- Content-on TXT exports should include actual link URLs for link message types when available.
- Sender parsing for dash-form labels should avoid merging conversational message prefixes into sender names.
- Add a dedicated generated JSON schema validation test in `tests/` and a schema document in `tests/generated-json-schema.json`.
- Add a `pnpm run build:clean` script to clear generated output artifacts safely.
- Reply messages should be treated as text when exporting, while location helpers can still recognize reply elements.
- Audio/video call and voice message lengths should be expressed in minutes rather than character counts.
- Maintain dedicated `pnpm` scripts for server, frontend, and CI builds.
- Keep generated artifacts including `dist/`, `demo/output-html/`, and `demo/output-json/` checked into the repository.
- Place any automated test suites and validation scripts in a dedicated `tests/` directory.
- Use `aria-label` for deduplication and remove `data-message-id` references from helper locators and export logic.
- Keep changelog updates consistent in `CHANGELOG.md`.
- Store build-specific bundle versions via `BUILD_VERSION` and validate that generated `dist/app.js` versions are correct in CI.
- Keep frontend build entry rooted at `src/frontend/build.js` with root handoff from `src/build.js`.
- Keep frontend completion notice minimal: show conversation name, date interval, and elapsed scan time.
- Keep server and frontend summary generation reusing shared schema concepts from `tests/generated-txt-schema.json`.
- Keep anonymized self label as `Youghurt` across frontend and server export outputs.


