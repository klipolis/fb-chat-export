# Agents

This repository includes AI-assisted development guidance and planning notes.

## Agent Usage

- The repository uses AI helpers for refactor suggestions, build updates, and documentation cleanup.
- The current workflow prefers a single frontend build entry (`src/frontend/build.cjs`) and avoids extra wrapper layers.
- `pnpm` is standardized through Corepack in CI and local workflows.

## Notes

- If you need to extend regression coverage, use the existing `tests/` harness and `tap` as the formal runner.
- Golden snapshots are stored under `tests/golden` and compared using `tests/snapshot-helper.js`.
- Build metadata and version support are driven from the changelog release heading to keep package and build versions aligned.
- Every AI interaction should be captured as a trace in the AI interaction docs so the request, result, and learning are preserved for future contributors.

## Changelog rules (AI agents must follow these)

When writing or editing `CHANGELOG.md`:

- Every entry must describe an **active change** — something added, fixed, changed, or removed in that release. Never write entries that only describe what was retained, preserved, or left unchanged.
- Use plain, user-facing language. Active voice: "Exports include attachments" not "Attachment export support has been added".
- Describe what the user observes or benefits from. Do not mention internal identifiers, environment variable names, or file paths.
- Documentation-only edits, README updates, and planning notes do not belong in the changelog.
- CI, test tooling, and refactor changes with no user-visible effect belong under `### Dev` only.
- Section headers per release: `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Dev`. Include only sections with entries.
- Keep each entry as short as possible — one sentence per change. Do not repeat information across entries. Avoid mentioning function names, file names, or internal identifiers.
- **Always add new entries to the `## [Unreleased]` section at the top of the file.** Never add entries inside a versioned section (e.g. `## v5.5.0`). If no `[Unreleased]` section exists, create one immediately after the file header.
- Never modify a versioned section that has already been released (i.e. one that has a date and a version number in its heading).
- When a release is made, the `[Unreleased]` heading is replaced with the new version heading (e.g. `## v5.5.0 (2026-05-21)`). Version choice: only `### Fixed` entries → patch bump; any `### Added` or `### Changed` entries → minor bump. Always check `package.json` for the current version before picking the new one.

## Commit message rules (AI agents must follow these)

This repository uses [Conventional Commits](https://www.conventionalcommits.org/). Husky enforces this via a `commit-msg` hook running commitlint.

Format: `<type>(<optional scope>): <subject>`

Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`, `revert`

Examples:
- `feat: add voice-note compact duration display`
- `fix: parse aria-labels without At prefix`
- `chore: release v5.5.0`
- `test: add parseAriaLabel calendar-date cases`
- `docs: update CONTRIBUTING with husky setup`

Rules:
- Subject is lowercase, no trailing period.
- Do not reference internal file names or function names in the subject.
- Breaking changes: add `!` after the type (e.g. `feat!: redesign export format`) and describe in the commit body.
