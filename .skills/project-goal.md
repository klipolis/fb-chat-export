# Project Goal

- Build a reliable Messenger chat export helper pipeline that preserves raw HTML snapshots, generates optimized HTML, and exports simplified JSON preview data.
- Keep AI skill documentation and helper scripts separate from the core exporter logic.
- Ensure exported JSON is flat, easy to consume, and no longer contains redundant `nodes` wrappers or duplicate route/source metadata.
- Use `aria-label` as the primary message dedupe key and remove `data-message-id` dependencies.
- Treat reply messages as text in exports, while still allowing reply detection to support locate rules.
- Preserve call/voice durations as minute-based lengths and include link preview metadata in `content_link`.
- Expose a stable `data_preview.duration` field for timed preview exports when duration metadata is available.
- Add a top-level `export_date` field to generated preview JSON for each export file.
- Support accessible message extraction using `aria-label` values and preserve original/optimized preview metadata.
- Normalize chat labels into consistent export timestamps, turning same-day times into today's date and weekday labels into recent calendar dates.
- Keep `export_date` and `data_preview.optimised_date` in the same simple 24-hour format.
- Preserve built `dist/`, `data-output/optimized-html/`, and `data-output/json-format/` artifacts in source control while supporting automated CI builds.
- Keep build-specific `dist` versioning separate from the stable project version and support deterministic CI build IDs via `BUILD_VERSION`.- Store automated tests in the dedicated `tests/` directory and validate core shared exports with unit tests.

