# Documentation Site

This page is a high-level docs landing page for quick onboarding and architecture overview.

## Quick start

1. Clone the repository and open the `support/` folder.
2. Run `pnpm install --frozen-lockfile`.
3. Run `pnpm run build:ci` to verify the full pipeline.
4. Run `pnpm run build:frontend` to generate `dist/userscript.js`.

## Architecture overview

- `src/` contains the application source and build scripts.
- `src/frontend/src/` contains the userscript source code.
- `src/frontend/build/` contains frontend build tooling that bundles the userscript.
- `src/server/` contains server-side build scripts and preview generation.
- `src/shared/` contains shared helpers used by both server and frontend code.
- `demo/` contains raw input snapshots and generated output artifacts used for debugging and regression.
- `dist/` contains the bundled Tampermonkey userscript result.

## Docs and contribution

- `README.md` is the repository landing page.
- `CONTRIBUTING.md` explains how to contribute.
- `CHANGELOG.md` contains release history and notes.
- `CODE_OF_CONDUCT.md` describes expected community behavior.
- `SECURITY.md` provides guidance for responsible security disclosure.
- Use the GitHub issue and PR templates in `.github/` for consistent contributions.

## Terms and usage

See `docs/terms-and-conditions.md`.
