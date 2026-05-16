# Project Structure

## Folder layout
- `src/frontend/`: browser-facing assets, userscript source, and frontend build tooling.
- `src/server/`: build scripts, including `build-preview.js`.
- `src/shared/`: shared helper scripts and node export rules.
- `src/shared/rules/`: selector and export type rules for parsed message nodes.
- `Data-output-html/`: generated cleaned HTML snapshots.
- `Data-output-json/`: final flattened JSON export previews.
- `Data-output-txt/`: generated chat export text files.
- `dist/`: generated one-file userscript output (tracked in git).
- `docs/`: documentation, changelog, and architecture notes.
- `tests/`: automated verification and regression tests.
- `.skills/`: project planning and AI guidance files.
