# Technical guide

## Build flow

The repository produces two main outputs:

- `dist/app.js` — the browser bundle for the frontend user script.
- `data-output/` — generated build artifacts from the raw HTML input.

The build-server path reads raw files from `data-input/`, optimizes them into HTML snapshots, produces JSON preview exports, and generates TXT text exports.

## Prerequisites

### User prerequisites

- Chrome or Firefox with Tampermonkey installed.
- A Messenger conversation open at `https://www.facebook.com/messages/*`.
- The generated bundle file `dist/app.js` loaded into the browser after running `pnpm run build:frontend`.

### Developer prerequisites

- Node.js installed.
- `nvm` installed or otherwise use the version from `.nvmrc`.
- `pnpm` installed globally or via Corepack (`corepack enable`).
- A terminal opened in the `support/` folder.
- VS Code or another editor for source work.

> When updating `pnpm`, keep the `packageManager` field and `engines.pnpm` in sync.

## Build commands

- `pnpm run build:server` — run the server build, generate optimized HTML, JSON previews, and TXT exports.
- `pnpm run build:frontend` — build the browser frontend bundle into `dist/app.js`.
- `pnpm run build:clean` — clear generated artifacts while preserving raw input.
- `pnpm run build:raw` — run the server build and write aliased raw HTML updates.
- `pnpm run build:ci` — CI-friendly build with lint, docs checks, build, and test steps.
- `pnpm run validate:generated-json` — verify the JSON preview schema.
- `pnpm run lint` — run ESLint on source and tests.
- `pnpm run lint:docs` — validate markdown quality.
- `pnpm run link:docs` — check external documentation links.

## Export format

The generated `.txt` export has three main sections:

1. Header block
2. Optional summary block
3. One-line message entries

### Header block

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

### Summary block

When enabled, the summary block includes totals and per-participant counts:

```
Total Summary
42 messages / 5 days
~ 30 text;
~ 320 words
~ 8 images
~ 4 calls 01:05:00
```

### Message lines

Each message line follows this pattern:

```
[YYYY-MM-DD HH:MM] Sender: type length chars / content text
```

- `length chars` is omitted for images, calls, and voice messages.
- `/ content text` is included when `Include content` is enabled.
- Call lines include duration when available.

## Developer guide

- Use `nvm use` to select the Node version from `.nvmrc`.
- Run `pnpm install --frozen-lockfile` after cloning.
- Keep `dist/`, `data-output/optimized-html/`, and `data-output/json-format/` committed when they are generated from the source data.
- Use `BUILD_PLATFORM=userscript pnpm run build:frontend` for a userscript-compatible bundle.
- Use `BUILD_RAW=true` in server builds to write aliased raw HTML updates.
- Use `BUILD_VERSION=<build-id>` with `pnpm run build:frontend` to generate a build-specific bundle version.
- Run `pnpm run release:check` before tagging releases.

## Contribution workflow

- Use GitHub issue and PR templates from `.github/`.
- Run `pnpm run lint:docs` and `pnpm run link:docs` for docs changes.
- Use `pnpm run format:check` to verify formatting before submitting.
