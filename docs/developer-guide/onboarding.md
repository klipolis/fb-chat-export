# Developer onboarding guide

## Project overview

Exports Messenger chat history to `.txt` files. Provides a browser-based export panel (Tampermonkey userscript) and a server-side build pipeline that generates exports from raw HTML snapshots.

## Prerequisites

- Node.js (use the version in `.nvmrc` -- run `nvm use`)
- `pnpm` installed globally or via Corepack (`corepack enable`)

## Setup

1. Clone the repository and open a terminal in the `support/` directory.
2. Run `pnpm install --frozen-lockfile`.

## Project structure

See `docs/developer-guide/folder-structure.md` for the full layout. Key directories:

- `src/server/` -- server-side build scripts (HTML optimization, JSON preview, TXT export)
- `src/frontend/` -- browser-facing frontend code and esbuild bundling
- `src/shared/` -- shared helpers used by both server and frontend
- `data-input-test/` -- raw HTML snapshots used as build input
- `tests/` -- automated tests and validation scripts

## Key commands

- `pnpm build` -- full production build (server + frontend)
- `pnpm build:server` -- generate optimized HTML, JSON previews, and TXT exports
- `pnpm build:frontend` -- bundle the frontend into `dist/app.js`
- `pnpm test` -- run lint, unit tests, integration tests, and validations
- `pnpm lint` -- run package, TODO, changelog, and ESLint checks
- `pnpm validate:release` -- full pre-release validation

See `docs/developer-guide/tech.md` for the full command reference.

## Workflow

To add a feature or fix a bug:

1. Check `.TODO/TODO-next.md` for active tasks and assign yourself one.
2. Create a branch from `main` and make your changes.
3. Run `pnpm test` to verify nothing is broken.
4. Run `pnpm lint` to check style and consistency.
5. Run `pnpm build` to confirm the full build succeeds.
6. Commit using Conventional Commits format (see `AGENTS.md`).
7. Open a pull request using the templates in `.github/`.

## Coding conventions

- Use `const` and narrow helpers over mutable shared state.
- Prefer shared code in `src/shared/` over duplicating logic.
- Use ESM for source scripts; use CommonJS (`*.cjs`) for build scripts and tooling.
- Keep server code in `src/server/`, frontend code in `src/frontend/`.
- Handle failures with user-facing errors, not silent failures.
- Use schema validation over ad hoc string parsing.
- Write changelog entries in active voice under `## [Unreleased]` only.
- Commit messages follow the `<type>(<scope>): <subject>` format.

See `AGENTS.md` for the full editing, changelog, and commit rules.

## Next steps

- Review active tasks in `.TODO/TODO-next.md` to find work to pick up.
- Read `docs/developer-guide/tech.md` for detailed build and export format reference.
- Read `docs/developer-guide/folder-structure.md` for the complete directory layout.
