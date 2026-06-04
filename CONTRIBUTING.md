# Contributing to the export tool

Thank you for contributing! This repository uses `pnpm` and standard Node.js tooling.

## AI agents

This repository uses AI-assisted development. If you use an AI coding agent:

- The agent reads `AGENTS.md` and `ai-chat-behavior.config.ts` for project-specific instructions.
- The `.aiignore` file tells the agent which paths to skip (sensitive or irrelevant files).
- See `docs/AI-interaction/` for interaction patterns and guidance.
- Every durable AI instruction change should update the AI interaction docs.

## Getting started

1. Clone the repository and change into the `support/` folder.
2. Run `pnpm install --frozen-lockfile`. This also installs the Husky Git hooks automatically via the `prepare` script.
3. Use `pnpm run build:ci` to verify the repository end-to-end.

## Code style and validation

- JavaScript linting: `pnpm run lint`
- Docs linting: `pnpm run lint:docs`
- Docs link validation: `pnpm run link:docs`
- Full tests: `pnpm test`
- Release validation: `pnpm run release:check`

## Commit messages

This repository follows [Conventional Commits](https://www.conventionalcommits.org/).
Husky enforces this automatically via a `commit-msg` hook.

Format: `<type>(<optional scope>): <subject>`

Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`, `revert`

Examples:
```
feat: add voice-note compact duration display
fix: parse aria-labels without At prefix
chore: release v5.5.0
```

- Subject must be lowercase with no trailing period.
- Breaking changes: use `feat!:` or `fix!:` and describe in the commit body.

## Git hooks (Husky)

Two hooks run automatically:

| Hook | Trigger | Command | Purpose |
|---|---|---|---|
| `pre-push` | Before `git push` | `pnpm run lint:unreleased && pnpm run lint` | Lint check and changelog validation |
| `commit-msg` | Before `git commit` | `commitlint` | Validates the commit message format |

To bypass hooks in exceptional circumstances: `git commit --no-verify` (use sparingly).

## Branch and PR workflow

- Use feature branches and descriptive names.
- Open a pull request against `main`.
- Ensure tests and docs validation pass before requesting review.
- If your change affects docs only, update markdown and changelog as appropriate.

## Release process

- Increment `package.json` version when preparing a release.
- Move the `[Unreleased]` section in `CHANGELOG.md` to a new versioned heading.
- Use `pnpm run release:check` to validate release readiness.
- Tag the release with `pnpm run release:tag`.

## Changelog rules

Every entry in `CHANGELOG.md` must describe an **active change** — something that was added, fixed, changed, or removed in that release.

- **Always add new entries to the `## [Unreleased]` section** at the top of `CHANGELOG.md`. Never add entries inside an already-versioned section.
- Use active voice and present tense: "Exports now include attachments" not "Attachment export support has been added".
- Describe what the user observes or benefits from, not what file or variable changed internally.
- Do not mention internal identifiers, environment variable names, or implementation file paths.
- Do not include entries for documentation-only edits, README updates, or planning notes.
- CI, test tooling, and refactor changes that have no user-visible effect belong under `### Dev` only.

Section headers per release: `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Dev`. Use only the sections that have entries.

## Usage and privacy

This project is intended for documenting personal Messenger interactions and generating personal summaries.
Do not use this tool to publish or distribute private chat conversations without consent.
Always respect the applicable Terms of Service: https://www.facebook.com/legal/terms

## Repository layout

- `src/` — application source and build scripts.
- `data-input/` — raw input and alias configuration.
- `data-output/` — generated output artifacts.
- `dist/` — built frontend bundle deliverable.
- `tests/` — test and validation scripts.
- `docs/` — project documentation.
- `CHANGELOG.md` — release notes.
