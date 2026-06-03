# Project Documentation

A minimal documentation page for the chat export project.
- Set `From` / `To` dates to narrow the export range.
- Toggle `Include calls`, `Alias`, `Raw link`, `Summary`, `Include content`, and `Length` as needed.
- Click `Scan Messages` and download the resulting `.txt` file.
- After scan completion, the ready notice is minimal and shows conversation name, date interval, and elapsed scan time.

## Export format

The exported `.txt` file contains three sections separated by `---`:

**Header** — method, message types, option state, and alias map:

```
Method: browser
Message types:
- image
- text
Options:
  content : true
  rawLink : false
Aliases:
  You : Youghurt
  any : Alpha
---
```

**Summary block** (included when the Summary toggle is on) — total and per-participant counts:

```
Total Summary
42 messages / 5 days
~ 30 text;
~ 320 words
~ 8 images
~ 4 calls 01:05:00

Alice Summary
25 messages / 5 days
~ 18 text;
~ 190 words
~ 5 images
~ 2 calls 00:45:00

Bob Summary
17 messages / 4 days
~ 12 text;
~ 130 words
~ 3 images
~ 2 calls 00:20:00

---
```

**Message lines** — one line per message:

```
[YYYY-MM-DD HH:MM] Sender: type length chars / content text
[YYYY-MM-DD HH:MM] Sender: image
[YYYY-MM-DD HH:MM] Sender: voice-note 00:20:00
[YYYY-MM-DD HH:MM] Sender: missed-audio-call
```

- `length chars` is omitted for images, calls, and voice messages.
- `/ content text` is included when the `Include content` toggle is on.
- Call lines include duration (e.g. `00:18:00`) when available.
- The server build labels counts as `posts`; the browser export labels them as `messages`.

## Developer guide

- Open the project in VS Code and use the terminal in `support/`.
- Run `nvm use` in the `support/` folder to ensure the correct Node version from `.nvmrc`.
- Run `pnpm install --frozen-lockfile` once after cloning the repo.
- Run `pnpm run build:server` to clear outputs, regenerate optimized HTML, build data preview JSON, and generate a text export in `data-output/final-export/`.
- Run `pnpm run build:frontend` to emit the built bundle into `dist/app.js`.
- Use `BUILD_PLATFORM=userscript pnpm run build:frontend` to emit a userscript-compatible bundle header. The userscript header template is stored in `data-config/userscript/header.txt`.
- The browser export now writes a stable download file name such as `export-<shortname>.txt`.
- Run `pnpm run validate:dist` to verify the generated bundle header and versioned dist artifact.
- Run `pnpm run lint` to verify JavaScript style and catch syntax issues early.
- Run `pnpm run audit` to check dependency security status.
- `build:server` now runs non-interactively by default and uses `BUILD_RAW=true` when set.
- Use `pnpm run build:ci` to run the full CI-aligned build, including linting, build, and validation.
- Use `pnpm run build:ci:frontend` to run only the frontend build in CI mode.
- Set `BUILD_RAW=true` to write aliased raw HTML files during server builds.
- Use `BUILD_VERSION=<build-id>` with `pnpm run build:frontend` to generate a build-specific bundle version without updating `package.json`.
- Use `pnpm run release:check` to verify changelog, schema, and dist sync before tagging.
- Use `pnpm run release:tag` to validate and tag the current package version automatically.
- Use `pnpm run lint:docs` to validate markdown quality for docs-only changes.
- Use `pnpm run link:docs` to validate external links in docs and catch broken references before publishing.
- A GitHub release workflow is configured to publish release notes from root `CHANGELOG.md` on `v*` tags.

> The full CI workflow skips docs-only changes (`docs/**`, `README.md`, `CHANGELOG.md`, `.skills/**`) so the build only runs when actual code or schema changes are present.
>
> Prefer GitHub/CI builds over local builds because CI builds run in a clean, consistent environment, catch dependency and environment drift early, and ensure the same generated artifacts are reproducible for release verification.

- Run `pnpm run build-preview` to generate data preview JSON directly from optimized HTML.
- Run `pnpm run build:clean` to clear generated build artifacts while preserving raw inputs.
- Run `pnpm run create:nodes` for lower-level preview export debugging or custom workflows.
- Run `pnpm run validate:generated-json` to verify final `data-output/json-format/` preview schema.
- Run `pnpm run test` to execute automated shared-code regression tests and generated JSON schema validation.
- Keep `dist/`, `data-output/optimized-html/`, and `data-output/json-format/` committed to source control.
- Keep `.skills/` for planning and requirements.

## How to contribute

- Follow `CONTRIBUTING.md` for contribution guidelines.
- Use the GitHub issue and PR templates in `.github/` for new reports and feature requests.
- Keep the project focused on personal summary use and avoid publishing private chat content.
- Use `pnpm run lint:docs`, `pnpm run link:docs`, and `pnpm run format:check` before submitting docs or formatting changes.

