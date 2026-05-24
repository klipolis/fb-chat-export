# fb-chat-exporter

A Messenger chat export project that generates `.txt`, JSON preview, HTML snapshots, and a browser-side frontend bundle.

## Overview

- Source files live under `src/`.
- Frontend source and build tooling are under `src/frontend/`.
- Raw input artifacts are stored under `data-input/`.
- Generated build outputs are stored under `data-output/`.
- Built frontend bundle output is stored in `dist/`.
- Documentation is kept in `docs/`.
- Release notes live in `CHANGELOG.md`.

## Docs

- [User Guide](docs/user-guide/index.md)
- [Developer Guide](docs/developer-guide/index.md)
- [Release Management](docs/developer-guide/release-management.md)
- [TODO Management](docs/todo-management.md)

## Quick start

```bash
pnpm install --frozen-lockfile
pnpm run build:ci
```

## Repo layout

- `README.md` - repository landing page.
- `CHANGELOG.md` - release history.
- `CONTRIBUTING.md` - contribution guidelines.
- `LICENSE` - project license.
- `package.json` / `pnpm-lock.yaml` - package and dependency management.
- `.github/workflows/` - CI and release workflows.
- `src/` - project source code.
- `tests/` - automated tests and validation.
- `docs/` - extended documentation and process notes.
- `docs/user-guide/` - end-user usage instructions.
- `docs/developer-guide/` - build, test, and release guidance.
- `docs/site.md` - documentation landing page with quick start and architecture overview.
- `data-input/` - raw HTML input snapshots and alias metadata.
- `data-output/` - generated output artifacts, including HTML, JSON, and TXT.
- `dist/` - generated frontend bundle.

## Validation

- `pnpm run lint` — check JavaScript and TODO configuration.
- `pnpm run lint:todos` — verify `.TODO` files and `.todo/config.json`.
- `pnpm run build` — run both server and frontend builds.
- `pnpm run test` — run all tests and validation.
