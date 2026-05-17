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

## Usage and privacy

This project is intended for documenting personal Facebook Messenger interactions and generating personal summaries.
Do not use this tool to publish or distribute private chat conversations without consent.
Always respect Facebook's Terms of Service: https://www.facebook.com/legal/terms

## Repository layout

- `src/` — application source and build scripts.
- `demo/` — raw input and generated output artifacts.
- `dist/` — built userscript deliverable.
- `tests/` — test and validation scripts.
- `docs/` — project documentation.
- `CHANGELOG.md` — release notes.
