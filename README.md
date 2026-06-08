# chat-exporter

A chat export project that generates `.txt`, JSON preview, HTML snapshots, and a browser-side frontend bundle.

## Overview

- Source files live under `src/`.
- Frontend source and build tooling are under `src/frontend/`.
- Raw input artifacts are stored under `data-input-test/`.
- Generated build outputs are stored under `data-output-auto/`.
- Built frontend bundle output is stored in `dist/`.
- Documentation is kept in `docs/`.
- Release notes live in `CHANGELOG.md`.

## Docs

- [User Guide](docs/user-guide/README.md)
- [Developer Guide](docs/developer-guide/README.md)
- [Release Management](docs/developer-guide/release-management.md)
- [TODO Management](docs/developer-guide/todo-management.md)

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
- `data-input-test/` - raw HTML input snapshots and alias metadata.
- `data-output-auto/` - generated output artifacts, including HTML, JSON, and TXT.
- `dist/` - generated frontend bundle.

## Browser Export Panel

The browser export panel is a floating toolbar injected into Facebook Messenger when the frontend script runs.

### Opening the panel

Click the **Export Chat** summary bar at the top of the panel to toggle it open or closed. The arrow (▲/▼) indicates the current state. The panel remembers its state across page loads via `localStorage`.

### Collapsed panel mode

After a scan completes, the textbox stays collapsed by default — the first 20 lines are not rendered until you expand the panel. This keeps memory usage flat even for large exports. Click the summary bar to expand and view the preview content.

### Status message

When the panel is collapsed after a successful scan, a status message shows: **"Export ready. Tap to expand."** — indicating content is available but not yet rendered.

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Start a scan (when either date input is focused) |
| `Escape` | Stop an active scan |

### Button visibility

- **Copy** and **Download** buttons remain visible even when the panel is collapsed after a scan completes, so you can copy or download the full export without expanding the preview.
- When a new scan starts (`cleanupExport` runs), both buttons are hidden until the new scan finishes.
- After clicking **Download**, the button shows `aria-disabled="true"`, its opacity decreases, a **Save again** link appears, and the label changes to **Downloaded**.
