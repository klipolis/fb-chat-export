# Project Documentation

This project exports Messenger chat history to a `.txt` file using a Tampermonkey user script.

## Prerequisites

### User prerequisites

- Chrome or Firefox with Tampermonkey installed.
- A Messenger conversation open at `https://www.facebook.com/messages/*`.
- The generated userscript file `dist/userscript.js` loaded into Tampermonkey after running `node src/frontend/build-userscript.js`.

### Developer prerequisites

- Node.js installed.
- A terminal opened in the `support/` folder.
- VS Code or another editor for working with the source.

## Folder structure

- `src/frontend/`: browser-facing assets, userscript source, and frontend build tooling.
- `src/server/`: build scripts such as `build-preview.js`.
- `src/shared/`: shared helper scripts and node rules.
- `Input-readonly/`: static raw HTML snapshots.
- `Output-generated/`: generated optimized HTML and JSON preview outputs.
- `dist/`: generated one-file userscript output.
- `docs/`: documentation, changelog, and project notes.
- `.skills/`: planning, requirements, and development material.

## User guide

- Open a Messenger conversation in the browser.
- Generate `dist/userscript.js` by running `node src/frontend/build-userscript.js`, then load it through Tampermonkey.
- Start at the bottom of the conversation, or keep the current view if the visible date is within the export range.
- Set `From` / `To` dates to narrow the export range.
- Toggle `Ignore calls`, `Anonymize as`, `Summary`, `Type only`, and `Length` as needed.
- Click `Scan Messages` and download the resulting `.txt` file.

## Developer guide

- Open the project in VS Code and use the terminal in `support/`.
- Run `node src/build-server.js` to clear outputs, regenerate optimized HTML, and create data preview JSON in `Output-generated/Data preview`.
- Optionally run `node src/server/build-preview.js` or `node src/shared/create-nodes.js` to generate data preview JSON directly from optimized HTML.
- Run `node src/frontend/build-userscript.js` or `node src/build-frontend.js` to emit the built userscript into `dist/userscript.js`.
- Keep `.skills/` for planning and requirements.
