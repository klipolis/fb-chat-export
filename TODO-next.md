# TODO — Next tasks

Tasks grouped by area. Each is self-contained and can be instructed individually.
Completed tasks are in [TODO-done.md](TODO-done.md).
Won't-implement decisions are in [TODO-ignore.md](TODO-ignore.md).
Future / requires-new-samples tasks are in [TODO-future.md](TODO-future.md).

---

## Test coverage

- **Frontend summary integration test** — A headless/unit test that drives `collectVisible()` with mock DOM entries and asserts `buildSummary` receives correct `callMinutes` values; guards against future regressions in the browser-path duration counting.

- **Rewrite validate-*.js scripts from `assert` to tap** — `validate-generated-txt.js`, `validate-generated-json.js`, `validate-dist.js`, `validate-golden.js`, and `validate-release.js` currently use Node's built-in `assert` module, which throws on first failure with no test count. Rewriting them as tap test suites (one `tap.test()` block each) adds proper counts, labels, and failure isolation. They could then be folded into `test:unit` and removed from the separate `validate:*` scripts in `pnpm run test`. Approximate effort: 3–4 hours; affects the full `pnpm run test` pipeline.

---

## JSON output

- **Strip telemetry parameters from URLs in `data_raw`** — `data_raw.content` for link-type messages currently stores the full URL minus the query string entirely (`stripUrlQuery`). Instead it should store the resolved URL with only tracking/telemetry params removed (fbclid, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fb_action_ids, fb_action_types). Meaningful query params (YouTube video id, search terms, etc.) should be kept. Add a `stripTelemetryParams(url)` helper in `message-metadata.js` (or `create-nodes.js`) that decodes FB redirect URLs and strips the above param list. `data_preview.content` should use this cleaned URL (compact form for video-link, full form for others). Optimised HTML files continue to carry the original URL unchanged.

---

## Export TXT format

- **Options block in TXT header** — After the `Method:` line and before the `---` separator (and before the summary block), add an `Options:` block that lists the state of each export option as `option : true/false`, followed by a `Aliases:` block listing each `Sender : Alias` pair (one per line). Example:
  ```
  Method: server
  Options:
  calls : true
  content : true
  length : true
  summary : true
  Aliases:
  You : Youghurt
  Rob : Barnabas
  ---
  ```
  Requires: (a) `buildExportText` / `formatExportHeader` to accept an options object and alias map; (b) the server build path to pass those values; (c) `export-config.json` patterns updated; (d) `validate-generated-txt.js` updated to parse and validate the new block; (e) golden snapshots regenerated.

---

## Frontend panel

- **Rename "Anonymize" → "Alias" everywhere** — UI label, variable names (`anonymizeChk`, `anonymizeInput`, `anonymizeOtherInput`), internal state keys, server-build comment strings, and all references in `AGENTS.md`, `CONTRIBUTING.md`, `TODO-done.md`. The underlying `anonymizeChatNames` function in `utils.js` and the `anonymize-names.json` config file should also be renamed (`createAliasMap` / `alias-names.json`). This is a mechanical rename; do the frontend + shared code first, then docs.

- **Alias rows: repeatable name → alias pairs with validation** — Replace the current two fixed text inputs (Youghurt / Alpha) with a dynamic list of rows. Each row has two inputs: an "Original name" input (editable) and an "Alias" input. First two rows are pre-filled with `You` (original, disabled) → `Youghurt` and `any` (original, disabled) → `Alpha`. An "Add" button appends a new empty row. An "×" button on each added row removes it. Validation rule on both inputs: max two whitespace-separated words, no digits, only letters plus `.`, `'`, `-`. Show inline error on blur; prevent scan if any row is invalid. The alias map passed to `anonymizeChatNames` is built from all rows.

- **Raw link checkbox** — Add a "Raw link" checkbox to the right column (below the Content checkbox). When checked: link content in the export uses the cleaned/resolved URL (telemetry params stripped). When unchecked: link content uses the Facebook-wrapped/protected URL as-is (the `href` from the HTML). Disable and uncheck when the Content checkbox is unchecked. The option state should be passed into `getContentMeta` or applied at the export-line level.

---

## Build tooling

- **Runtime: stay on Node.js (Deno not recommended)** — *Assessment:* Deno 2.0 is Node-compatible at the API level but the ecosystem friction outweighs the benefits for this project. Blockers: (1) pnpm is not supported in Deno — the Deno runtime uses its own module resolution; (2) Husky depends on shell hooks and npm lifecycle scripts (`prepare`) which do not map to Deno; (3) esbuild is invoked via Node API in `src/frontend/build.js`; (4) the frontend output is a browser userscript — Deno adds no value there. Potential upside (built-in TypeScript, `deno fmt`, `deno test`) is achievable in Node.js without migration cost. **Recommendation:** no migration. If TypeScript is wanted, add `tsc --noEmit` as a check-only step.


