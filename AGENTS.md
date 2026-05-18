# Agents

This repository includes AI-assisted development guidance and planning notes.

## Agent Usage

- The repository uses AI helpers for refactor suggestions, build updates, and documentation cleanup.
- The current workflow prefers a single frontend build entry (`src/frontend/build.js`) and avoids extra wrapper layers.
- `pnpm` is standardized through Corepack in CI and local workflows.

## Notes

- If you need to extend regression coverage, use the existing `tests/` harness and `tap` as the formal runner.
- Golden snapshots are stored under `tests/golden` and compared using `tests/snapshot-helper.js`.
- Build metadata and version support are driven from the changelog release heading to keep package and build versions aligned.

## Changelog rules (AI agents must follow these)

When writing or editing `CHANGELOG.md`:

- Every entry must describe an **active change** — something added, fixed, changed, or removed in that release. Never write entries that only describe what was retained, preserved, or left unchanged.
- Use plain, user-facing language. Active voice: "Exports now include attachments" not "Attachment export support has been added".
- Describe what the user observes or benefits from. Do not mention internal identifiers, environment variable names, or file paths.
- Documentation-only edits, README updates, and planning notes do not belong in the changelog.
- CI, test tooling, and refactor changes with no user-visible effect belong under `### Dev` only.
- Section headers per release: `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Dev`. Include only sections with entries.
- Keep each entry as short as possible — one sentence per change. Do not repeat information across entries. Avoid mentioning function names, file names, or internal identifiers.
- Do not start a new version heading for changes that have not been committed yet. Add all new entries to the existing latest version block.
