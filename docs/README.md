# Project Documentation

This project exports Messenger chat history to a `.txt` file using a Tampermonkey user script.

## Prerequisites

### User prerequisites

- Chrome or Firefox with Tampermonkey installed.
- A Messenger conversation open at `https://www.facebook.com/messages/*`.
- The generated userscript file `dist/userscript.js` loaded into Tampermonkey after running `pnpm run build:frontend`.

### Developer prerequisites

- Node.js installed.
- `nvm` installed or otherwise use a compatible Node version.
- `pnpm` installed globally, or use Node's built-in Corepack (`corepack enable`).
- A terminal opened in the `support/` folder.
- VS Code or another editor for working with the source.

> When updating `pnpm`, keep the `packageManager` field and `engines.pnpm` in sync.

## Windows PowerShell note

If PowerShell blocks `pnpm.ps1` or `npm` script execution because scripts are not digitally signed, use one of these options:

- Run in Command Prompt: `cmd /c "pnpm install"` or `cmd /c "npm install"`
- Enable local script execution: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force`
- Use Corepack instead of global pnpm: `corepack enable && pnpm install`
- If you still see execution policy errors, see Microsoft docs: `https:/go.microsoft.com/fwlink/?LinkID=135170`

## Folder structure

- `src/frontend/`: browser-facing assets, userscript source, and frontend build tooling.
- `src/server/`: build scripts such as `build-preview.js`.
- `src/shared/`: shared helper scripts and node rules.
- `Input-readonly/`: static raw HTML snapshots.
- `Output-generated/`: generated optimized HTML and JSON preview outputs.
- `dist/`: generated one-file userscript output.
- `docs/`: documentation, changelog, and project notes.
- `.skills/`: planning, requirements, and development material.
- `.github-next/`: placeholder workflow definitions for future GitHub Actions integration.

## User guide

- Open a Messenger conversation in the browser.
- Generate `dist/userscript.js` by running `pnpm run build:frontend`, then load it through Tampermonkey.
- Start at the bottom of the conversation, or keep the current view if the visible date is within the export range.
- Set `From` / `To` dates to narrow the export range.
- Toggle `Ignore calls`, `Anonymize as`, `Summary`, `Type only`, and `Length` as needed.
- Click `Scan Messages` and download the resulting `.txt` file.

## Developer guide

- Open the project in VS Code and use the terminal in `support/`.
- Run `nvm use` in the `support/` folder to ensure the correct Node version from `.nvmrc`.
- Run `pnpm install` once after cloning the repo.
- Run `pnpm run build:server` to clear outputs, regenerate optimized HTML, and build data preview JSON.
- Run `pnpm run build:frontend` to emit the built userscript into `dist/userscript.js`.
- Use non-interactive server builds with:
  - macOS/Linux: `CI=true pnpm run build:server`
  - PowerShell: `$env:CI='true'; pnpm run build:server`
  - CMD: `set CI=true && pnpm run build:server`
- Use `pnpm run build:ci` to run the full build in CI mode.
- Use `pnpm run build:ci:frontend` to run only the frontend build in CI mode.
- Set `ANONYMIZE_RAW=true` to anonymize raw chat names during server builds.
- Run `pnpm run build-preview` to generate data preview JSON directly from optimized HTML.
- Run `pnpm run create:nodes` for lower-level preview export debugging or custom workflows.
- Keep `dist/` and `Output-generated/` committed to source control.
- Keep `.skills/` for planning and requirements.
