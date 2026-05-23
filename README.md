# fb-chat-exporter

A Messenger chat export project that generates `.txt`, JSON preview, HTML snapshots, and a browser-side frontend bundle.

## Overview

- Source files live under `src/`.
- Frontend source and build tooling are under `src/frontend/`.
- Data artifacts are stored under `dataset/`.
- Built frontend bundle output is stored in `dist/`.
- Documentation is kept in `docs/`.
- Release notes live in `CHANGELOG.md`.

## Quick start

```bash
pnpm install --frozen-lockfile
pnpm run build:ci
```

## Repo layout

- `README.md` - project summary and quick start.
- `CHANGELOG.md` - release history.
- `CONTRIBUTING.md` - contribution guidelines.
- `LICENSE` - project license.
- `package.json` / `pnpm-lock.yaml` - package and dependency management.
- `.github/workflows/` - CI and release workflows.
- `src/` - project source code.
- `tests/` - automated tests and validation.
- `docs/` - extended documentation and process notes.
- `docs/site.md` - documentation landing page with quick start and architecture overview.
- `docs/terms-and-conditions.md`
- `dataset/` - structured raw input and generated output artifacts.
- `dist/` - generated frontend bundle.

## More documentation

- See `docs/README.md` for developer and user guidance.
- See `docs/site.md` for a documentation landing page and architecture overview.
- See `docs/terms-and-conditions.md`.
