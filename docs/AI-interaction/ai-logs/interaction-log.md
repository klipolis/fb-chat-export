# AI Interaction Log

This AI Agent: add entries for your session at the top of this file in reverse-chronological order. Do not modify existing entries below.

**Format:**

```
### YYYY-MM-DD HH:MM – Short title

**User**: exact user input / prompt text.

**AI**: short summary of what was done — key files changed, decisions made.

**Commits**:
- `abc1234` YYYY-MM-DD HH:MM — commit message
```

---

### 2026-06-05 13:45 – Review and rebuild interaction-log.md format

**User**: review and rebuild the docs/AI-interaction/ai-logs/interaction-log.md

**AI**: Fixed the header prompt to accurately describe the `###` heading format used throughout (was incorrectly showing activity-log's flat format). Removed stale example block that mixed in activity-log format. Added current session entry at top. Updated activity-log.md with corrected entries.

**Commits**:
- `931e21e` 2026-06-05 13:30 — feat: consolidate error handling, add empty input test, code audit tasks

### 2026-06-05 13:30 – Error handling consolidation, empty input test, code audit tasks

**User**: Continue if you have next steps, or stop and ask for clarification if you are unsure how to proceed.

**AI**: Completed T-264 (empty input directory test), T-265 (shared error-utils.js with fatal() replacing 11 console.error+process.exit across 3 files). Ran code improvement prompts audit — added 8 future tasks (T-266 through T-273) to TODO-future.md covering worker pool shutdown, stale export cleanup, CLI args, catch-all, date normalize helper, worker pool extraction, HTML cleaning dedup, error isolation test. Updated TODO-done.md, TODO-next.md, config.json. Verified all doc cross-references pass `link:docs`.

**Commits**:
- `931e21e` 2026-06-05 13:30 — feat: consolidate error handling, add empty input test, code audit tasks

### 2026-06-05 13:00 – Update activity-log format with parentheses and AI entries

**User**: pattern for rows and no date grouping, but you can include new line between dates: date time (user, ai one-line response, commit + nr) text — there is no sep, because (brackets) are enough

**AI**: Rewrote activity-log.md with `(user)`, `(ai)`, `(commit)` bracketed types throughout. Added one-line AI response summaries between user requests and commits across all entries. Inserted blank lines between session groups for readability.

**Commits**:
- `0eb1269` 2026-06-05 13:00 — docs: add current session entries to interaction-log and activity-log

### 2026-06-05 12:30 – Add code improvement prompts to prompts-collection

**User**: add prompt to library: add more meaningful tasks to improve build, stability, shared code

**AI**: Created `code-improvement-prompts.md` with four reusable prompts (build audit, stability gaps, shared code consolidation, combined task queue). Each addresses "this AI Agent" generically. Updated `prompts-collection/README.md`.

**Commits**:
- `500c68b` 2026-06-05 12:30 — docs: add code improvement prompts to prompts-collection

### 2026-06-05 12:15 – Rename session-plan to activity-log, add AI agent prompt

**User**: better file naming than session-plan.md to reflect the goal. pattern is: date | type (user, commit) | text. Update the prompt so any AI agent can fill it. Also with type include commit nr.

**AI**: Renamed `session-plan.md` → `activity-log.md`. Rewrote with `date | type (user|commit) | text` format. Added AI agent prompt at top addressing "this AI Agent" generically. Updated `AGENTS.md`, `trace-guidance.md`, `patterns.md`. Also updated TODO files and interaction-log pending commit reference.

**Commits**:
- `503f7e4` 2026-06-05 12:20 — docs: rename session-plan to activity-log, add AI agent prompt

### 2026-06-05 12:00 – Restructure AI-interaction folders, clarify session plan

**User**: Looks like needs to have clarifications: AI-interaction have prompts folder (rename to prompts collection), then add ai-logs folder which have ai session logs taken out from the prompt files, I see they are mixed. Then the docs/logs clarify that log is not precise ai user interaction, but logs the user request summary and similar reverse-chronological order, date-time for all entry, no grouping

**AI**: Renamed `prompts/` → `prompts-collection/`. Created `ai-logs/` folder and moved `interaction-log.md` there. Rewrote `session-plan.md` with reverse-chronological, date-time per entry, no grouping, user request summaries only. Updated `AI-interaction/README.md`, `trace-guidance.md`, `AGENTS.md`, `patterns.md`.

**Commits**:
- `66ab709` 2026-06-05 12:15 — docs: restructure AI-interaction folders, clarify session plan

### 2026-06-05 11:30 – Add session history file

**User**: add a .todo/plan file, ai prompt to record the history of user inputs, it should include user input, with date time, then add datetime entry to in-between for commits happened, anything for the history?

**AI**: Created `.TODO/plan.md` with chronological session log of user inputs and commits. Later moved to `docs/logs/session-plan.md`. Updated `TODO-done.md`, `TODO-ignore.md`, `TODO-next.md`. Added `node --check` syntax validation to `validate-dist.js`.

**Commits**:
- `f44d73f` 2026-06-05 11:00 — docs: add session plan file, update TODO tracking
- `7de1cd3` 2026-06-05 12:00 — docs: restructure session logs, update AI interaction docs

### 2026-06-05 12:00 – Session log format, move plan to docs/logs/

**User**: update proper file name, move to docs folder, but what subfolder should be? Analytics, Logs? Need another file as well in ai interaction, similar, it is a log ai session record entries: date-time and exact user entry, followed entry by short ai response summary, then date-time commits; recent on top. Add this request to the agents and ai instructions, update docs, and ai-interaction post-interaction analisation

**AI**: Moved `.TODO/plan.md` → `docs/logs/session-plan.md`. Rewrote `interaction-log.md` with reverse-chronological format (date-time, exact user entry, AI summary, commits). Updated `trace-guidance.md` and `AGENTS.md` with session log maintenance rules. Deleted old `.TODO/plan.md`.

**Commits**:
- `cccf06a` 2026-06-05 12:15 — chore: add dist/app.js syntax validation, update TODO tracking

### 2026-06-05 09:00 – Node engine constraint, remove worker_threads fallback

**User**: Add Node >=26.0.0 engines constraint, remove worker_threads fallback.

**AI**: Added `"engines": {"node": ">=26.0.0"}` to package.json. Removed `hasWorkers` fallback from `build-server.cjs`. Changed `Worker` import from try-catch to direct require. Updated TODO files.

**Commits**:
- `cf4ef2d` 2026-06-05 09:41 — refactor: remove worker_threads fallback...
- `5d25d80` 2026-06-05 09:37 — chore: add Node >=26.0.0 engines constraint...
- `cccf06a` 2026-06-05 09:46 — chore: update TODO tasks for empty input...

### 2026-06-05 08:30 – Word count edge cases, Unicode integration tests

**User**: Add word count edge cases and Unicode integration tests. Update TODO files.

**AI**: Added test cases for word count across all message types. Added Unicode sender integration tests. Documented JSON preview format with name fields. Updated TODO tracking.

**Commits**:
- `5197685` 2026-06-05 09:02 — test: add onlyFiles option tests...
- `4c62eba` 2026-06-05 09:08 — test: add word count edge cases...
- `3fc7c02` 2026-06-05 09:11 — docs: add JSON preview format documentation...
- `19ea27d` 2026-06-05 09:13 — chore: add new TODO tasks...
- `739a379` 2026-06-05 09:16 — chore: add worker pool graceful shutdown test task...

### 2026-06-04 22:00 – Name fields, Unicode, word count consistency

**User**: Add data_raw.name and data_preview.name fields. Unicode name support. Word count consistency.

**AI**: Added `data_raw.name` and `data_preview.name` to JSON exports with alias mapping. Fixed Unicode name recognition in sender detection. Changed body content length from chars to words. Added tests for Unicode names and word count consistency. Updated post-interaction save procedures.

**Commits**:
- `db73f35` 2026-06-04 22:01 — feat: add data_raw.name and data_preview.name...
- `7731e11` 2026-06-04 23:14 — feat: add unicode name recognition...
- `3902d07` 2026-06-04 23:26 — docs: add post-interaction and post-close save procedures...
- `3a5426e` 2026-06-04 23:30 — chore: add new TODO tasks...

### 2026-06-04 18:00 – Worker fallback, onlyFiles test

**User**: Add worker_threads availability check fallback so builds work on Node without worker_threads support.

**AI**: Added `hasWorkers` try-catch and sequential fallback path in `build-server.cjs`. Added `onlyFiles` assertion to `test-cache-partial-rebuild.js`. Consolidated shared code (`ensureDir`, `normalizeExportSender`, `validateExportConfig`). Updated TODO tracking and AI-interaction docs.

**Commits**:
- `252b531` 2026-06-04 18:09 — docs: update TODO tracking, AI-interaction patterns...
- `81c14bd` 2026-06-04 18:34 — feat: add worker_threads fallback and onlyFiles test...

### 2026-06-04 12:00 – Parallel processing, incremental build

**User**: Add parallel worker pool for HTML optimization. Add incremental build cache.

**AI**: Implemented `worker_threads` pool in `build-server.cjs` with bounded concurrency. Added cache manifest that tracks file mtimes and config mtimes for three-path decisions (full skip, full rebuild, partial rebuild). Added stale output cleanup and change-only processing. Updated developer guide, AI-interaction patterns.

**Commits**:
- `f96d773` 2026-06-04 18:03 — feat: add parallel worker pool and partial rebuild...
- `0adb916` 2026-06-04 12:09 — feat: add incremental build support with cache manifest
- `feae95d` 2026-06-04 12:10 — docs: mark T-215 done...
- `99017e0` 2026-06-04 12:11 — test: add incremental build cache and skip tests
- `503d098` 2026-06-04 11:48 — feat: add artifact size reporting...
- `0205824` 2026-06-04 11:57 — chore: standardise TODO categories...

### 2026-06-04 09:00 – Schema validation, shared module consolidation

**User**: Add build-time JSON schema validation. Consolidate shared code into dedicated modules. Add tests.

**AI**: Added `validateGeneratedJson()` to `build-server.cjs` that validates all preview JSON files against `generated-json-schema.json`. Consolidated shared code into `string-utils.js`, `html-utils.js`, `aria-label-parser.js`, `message-metadata.js`. Added shared module tests. Created developer onboarding guide.

**Commits**:
- `0d01301` 2026-06-04 11:04 — refactor: consolidate shared code into dedicated modules
- `36f7f81` 2026-06-04 11:16 — feat: add build-time JSON schema validation
- `487238b` 2026-06-04 11:31 — test: add shared module tests...
- `4c427d3` 2026-06-04 11:21 — docs: update TODO files and AGENTS.md...
- `512f5c0` 2026-06-04 03:28 — test: add direct unit tests...

### 2026-06-03 – Dead code cleanup, link-text fix

**User**: Fix structure, summary, stats. Fix link video. Server structure. Dead code cleanup.

**AI**: Removed dead code (stale message-type references, unused exports). Fixed browser unhandled promise rejection. Updated link-text content to include both URL and user text. Standardized TODO categories, commit refs.

**Commits**:
- `c4b59ce` 2026-06-03 19:23 — chore: update TODO backlog...
- `3adbbed` 2026-06-03 19:32 — chore: cleanup dead code...
- `cc7b8a3` 2026-06-04 00:08 — fix: link-text content includes both URL and user text
- `3e31f9d` 2026-06-04 03:20 — chore: voice-note transcript detection...
- `5972a43` 2026-06-04 03:25 — chore: standardize T- prefix...
