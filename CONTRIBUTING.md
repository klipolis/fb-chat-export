# Contributing to fb-chat-exporter

Thank you for contributing! This repository uses `pnpm` and standard Node.js tooling.

## Getting started

1. Clone the repository and change into the `support/` folder.
2. Run `pnpm install --frozen-lockfile`.
3. Use `pnpm run build:ci` to verify the repository end-to-end.

## Code style and validation

- JavaScript linting: `pnpm run lint`
- Docs linting: `pnpm run lint:docs`
- Docs link validation: `pnpm run link:docs`
- Full tests: `pnpm test`
- Release validation: `pnpm run release:check`

## Branch and PR workflow

- Use feature branches and descriptive names.
- Open a pull request against `main`.
- Ensure tests and docs validation pass before requesting review.
- If your change affects docs only, update markdown and changelog as appropriate.

## Release process

- Increment `package.json` version when preparing a release.
- Add a changelog entry in `CHANGELOG.md`.
- Use `pnpm run release:check` to validate release readiness.
- Tag the release with `pnpm run release:tag`.

## Changelog rules

Every entry in `CHANGELOG.md` must describe an **active change** — something that was added, fixed, changed, or removed in that release. Entries that only describe what was retained, preserved, or left unchanged are not permitted.

Write in plain, user-facing language:

- Use active voice and present tense: "Exports now include attachments" not "Attachment export support has been added".
- Describe what the user observes or benefits from, not what file or variable changed internally.
- Do not mention internal identifiers, environment variable names, or implementation file paths.
- Do not include entries for documentation-only edits, README updates, or planning notes.
- CI, test tooling, and refactor changes that have no user-visible effect belong under `### Dev` only.

Section headers per release: `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Dev`. Use only the sections that have entries.

## Usage and privacy

This project is intended for documenting personal Facebook Messenger interactions and generating personal summaries.
Do not use this tool to publish or distribute private chat conversations without consent.
Always respect Facebook's Terms of Service: https://www.facebook.com/legal/terms

## Repository layout

- `src/` — application source and build scripts.
- `demo/` — raw input and generated output artifacts.
- `dist/` — built frontend bundle deliverable.
- `tests/` — test and validation scripts.
- `docs/` — project documentation.
- `CHANGELOG.md` — release notes.
