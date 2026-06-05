# AI Interaction Log

This AI Agent: add entries for your session at the top of this file in reverse-chronological order. Each entry is a standalone line. Blank lines between groups for readability are fine but do not nest or indent entries.

**Format:**

```
YYYY-MM-DD HH:MM (user) what the user requested — concise summary
YYYY-MM-DD HH:MM (ai) one-line summary of what the AI did in response
YYYY-MM-DD HH:MM (commit <hash>) commit subject
```

Do not modify existing entries below. Update `project-logs/activity-log.md` as well for user-request-level summaries.

---

2026-06-05 13:56 (user) move prompt collection and logs out of docs/, add pnpm prompt script
2026-06-05 13:56 (ai) Created project-prompts/ (from prompts-collection), project-logs/ (from docs/logs), scripts/run-prompt.cjs, updated AGENTS.md, patterns, cross-references, removed old dirs
2026-06-05 13:56 (commit 50dfcf8) refactor: move hot prompt and log files out of docs/ into project-prompts/ and project-logs/


2026-06-05 13:45 (user) review log format, hash within brackets. also update the docs, agents, contribute, ..
2026-06-05 13:45 (ai) Fixed all commit entries to (commit <hash>) format, updated AGENTS.md and trace-guidance.md log format descriptions
2026-06-05 13:45 (commit e5d3fa6) docs: fix commit hash format to (commit <hash>) across logs and doc references
2026-06-05 13:30 (user) review and rebuild the interaction-log.md
2026-06-05 13:30 (ai) Fixed header to flat format, converted all entries from sectioned to flat, removed stale example block
2026-06-05 13:30 (user) Continue if you have next steps, or stop and ask for clarification
2026-06-05 13:30 (ai) Completed T-264 empty input test, T-265 error-utils.js, added 8 future tasks T-266–T-273, verified doc references
2026-06-05 13:30 (commit 931e21e) feat: consolidate error handling, add empty input test, code audit tasks
2026-06-05 13:00 (user) pattern for rows and no date grouping, but you can include new line between dates: date time (user, ai one-line response, commit + nr) text — there is no sep, because (brackets) are enough
2026-06-05 13:00 (ai) Rewrote activity-log.md with (user)/(ai)/(commit) bracketed types, added AI one-line summaries throughout
2026-06-05 13:00 (commit 0eb1269) docs: add current session entries to interaction-log and activity-log
2026-06-05 12:30 (user) add prompt to library: add more meaningful tasks to improve build, stability, shared code
2026-06-05 12:30 (ai) Created code-improvement-prompts.md with four reusable prompts (build audit, stability gaps, shared code, combined task queue), updated README
2026-06-05 12:30 (commit 500c68b) docs: add code improvement prompts to prompts-collection
2026-06-05 12:15 (user) better file naming than session-plan.md to reflect the goal. pattern is: date | type (user, commit) | text. Update the prompt so any AI agent can fill it. Also with type include commit nr.
2026-06-05 12:15 (ai) Renamed session-plan.md → activity-log.md, rewrote with date|type|text format, added AI agent prompt, updated AGENTS.md, trace-guidance.md, patterns.md
2026-06-05 12:15 (commit 503f7e4) docs: rename session-plan to activity-log, add AI agent prompt
2026-06-05 12:00 (user) Looks like needs to have clarifications: AI-interaction have prompts folder (rename to prompts collection), then add ai-logs folder which have ai session logs taken out from the prompt files, I see they are mixed. Then the docs/logs clarify that log is not precise ai user interaction, but logs the user request summary and similar reverse-chronological order, date-time for all entry, no grouping
2026-06-05 12:00 (ai) Renamed prompts/ → prompts-collection/, created ai-logs/ folder, moved interaction-log.md, rewrote session-plan, updated README/trace-guidance/AGENTS.md/patterns.md
2026-06-05 12:00 (commit 66ab709) docs: restructure AI-interaction folders, clarify session plan
2026-06-05 11:30 (user) add a .todo/plan file, ai prompt to record the history of user inputs, it should include user input, with date time, then add datetime entry to in-between for commits happened, anything for the history?
2026-06-05 11:30 (ai) Created .TODO/plan.md with chronological session log, later moved to docs/logs/session-plan.md, updated TODO files, added node --check validation
2026-06-05 11:30 (commit 7de1cd3) docs: restructure session logs, update AI interaction docs
2026-06-05 11:30 (commit f44d73f) docs: add session plan file, update TODO tracking
2026-06-05 11:30 (commit cccf06a) chore: update TODO tasks for empty input validation and error handling
2026-06-05 09:00 (user) Add Node >=26.0.0 engines constraint, remove worker_threads fallback
2026-06-05 09:00 (ai) Added engines constraint to package.json, removed hasWorkers fallback from build-server.cjs, changed Worker import from try-catch to direct require
2026-06-05 09:00 (commit cf4ef2d) refactor: remove worker_threads fallback, add Node >=26.0.0 engines constraint
2026-06-05 09:00 (commit 5d25d80) chore: add Node >=26.0.0 engines constraint, remove fallback task, add new TODOs
2026-06-05 08:30 (user) Add word count edge cases and Unicode integration tests. Update TODO files.
2026-06-05 08:30 (ai) Added word count tests across all message types, Unicode sender integration tests, JSON preview format docs
2026-06-05 08:30 (commit 5197685) test: add onlyFiles option tests for create-nodes.js, update TODO files
2026-06-05 08:30 (commit 4c62eba) test: add word count edge cases and Unicode integration tests, update TODO files
2026-06-05 08:30 (commit 3fc7c02) docs: add JSON preview format documentation with name field details
2026-06-05 08:30 (commit 19ea27d) chore: add new TODO tasks for build CI and refactoring
2026-06-05 08:30 (commit 739a379) chore: add worker pool graceful shutdown test task to TODO-next
2026-06-04 22:00 (user) Add data_raw.name and data_preview.name fields. Unicode name support. Word count consistency.
2026-06-04 22:00 (ai) Added name fields to JSON exports with alias mapping, fixed Unicode sender detection, changed length from chars to words, added tests
2026-06-04 22:00 (commit db73f35) feat: add data_raw.name and data_preview.name fields with alias mapping to json exports
2026-06-04 22:00 (commit 7731e11) feat: add unicode name recognition, word count consistency, and data name fields with tests and docs
2026-06-04 22:00 (commit 3902d07) docs: add post-interaction and post-close save procedures to AI interaction docs
2026-06-04 22:00 (commit 3a5426e) chore: add new TODO tasks for test coverage, build CI, and documentation
2026-06-04 18:00 (user) Add worker_threads availability check fallback so builds work on Node without worker_threads support.
2026-06-04 18:00 (ai) Added hasWorkers try-catch and sequential fallback, onlyFiles assertion, consolidated shared code (ensureDir, normalizeExportSender, validateExportConfig)
2026-06-04 18:00 (commit 252b531) docs: update TODO tracking, AI-interaction patterns, and developer guide for parallel/cache build
2026-06-04 18:00 (commit 81c14bd) feat: add worker_threads fallback and onlyFiles test; docs: update TODO
2026-06-04 12:00 (user) Add parallel worker pool for HTML optimization. Add incremental build cache.
2026-06-04 12:00 (ai) Implemented worker_threads pool with bounded concurrency, cache manifest with three-path build decisions, stale output cleanup, updated docs
2026-06-04 12:00 (commit f96d773) feat: add parallel worker pool and partial rebuild; test: add parallel and cache tests
2026-06-04 12:00 (commit 0adb916) feat: add incremental build support with cache manifest
2026-06-04 12:00 (commit feae95d) docs: mark T-215 done, update TODO tracking for incremental build
2026-06-04 12:00 (commit 99017e0) test: add incremental build cache and skip tests
2026-06-04 12:00 (commit 503d098) feat: add artifact size reporting, dependabot config, input HTML docs, and schema tests
2026-06-04 12:00 (commit 0205824) chore: standardise TODO categories, add commit refs to done tasks, add question template
2026-06-04 09:00 (user) Add build-time JSON schema validation. Consolidate shared code into dedicated modules. Add tests.
2026-06-04 09:00 (ai) Added validateGeneratedJson(), consolidated shared code into dedicated modules (string-utils, html-utils, aria-label-parser, message-metadata), added tests, created onboarding guide
2026-06-04 09:00 (commit 0d01301) refactor: consolidate shared code into dedicated modules
2026-06-04 09:00 (commit 36f7f81) feat: add build-time JSON schema validation for generated preview files
2026-06-04 09:00 (commit 487238b) test: add shared module tests for constants and html-utils; docs: add developer onboarding guide
2026-06-04 09:00 (commit 4c427d3) docs: update TODO files and AGENTS.md for completed tasks T-210/T-211/T-212/T-214/T-224
2026-06-04 09:00 (commit 512f5c0) test: add direct unit tests for buildEntryFromEntry, buildDetailedSummary, buildSummaryJson
2026-06-03 19:00 (user) Fix structure, summary, stats. Fix link video. Server structure. Dead code cleanup.
2026-06-03 19:00 (ai) Removed dead code, fixed unhandled promise rejection, updated link-text to include both URL and user text, standardized TODO categories
2026-06-03 19:00 (commit c4b59ce) chore: update TODO backlog, add AI interaction reference, remove dead code
2026-06-03 19:00 (commit 3adbbed) chore: cleanup dead code, fix browser unhandled rejection, update docs
2026-06-03 19:00 (commit cc7b8a3) fix: link-text content includes both URL and user text
2026-06-03 19:00 (commit 3e31f9d) chore: voice-note transcript detection, shared code consolidation
2026-06-03 19:00 (commit 5972a43) chore: standardize T- prefix across TODO files
2026-06-02 23:00 (user) Fix alias names, dates, duration
2026-06-02 23:00 (ai) Patched alias name resolution for multi-person chats, fixed date normalization and duration formatting
2026-06-02 23:00 (commit 152b844) fix: alias names, dates, duration
2026-06-02 23:00 (commit 9ad105b) fix: alias names, dates, duration
2026-05-29 09:00 (user) Fix summary word counts
2026-05-29 09:00 (ai) Corrected word count aggregation in summary output
2026-05-29 09:00 (commit a82a805) fix: structure, summary, stats
2026-05-29 09:00 (commit 9b0e601) fix: summary words
2026-05-27 15:00 (user) Fix multiple image posts, allow numeric suffixes on message files
2026-05-27 15:00 (ai) Fixed image count aggregation, allowed image-N.html patterns, updated validation docs
2026-05-27 15:00 (commit a5d913a) fix: image total count
2026-05-27 15:00 (commit c72ef35) feat: allow numeric suffixes on all message file types in rules
2026-05-27 15:00 (commit dca7975) fix: multiple image post, docs
2026-05-27 15:00 (commit 33f600b) chore: update validation docs and message metadata tests
2026-05-26 21:00 (user) Validation self-healing, documentation references
2026-05-26 21:00 (ai) Made validation scripts self-healing with --self-heal flag, finalized doc references
2026-05-26 21:00 (commit b0d576e) chore: validation self-healing
2026-05-26 21:00 (commit 5727dfb) chore: finalize docs references and default self-heal validation
2026-05-25 21:00 (user) Normalize changelog wording to direct action statements, enforce rules
2026-05-25 21:00 (ai) Rewrote changelog entries to active present-tense, added lint rules for wording
2026-05-25 21:00 (commit 9cdc6bd) fix: enforce changelog and TODO wording rules and centralize repo path resolution
2026-05-25 21:00 (commit bfb30e5) docs: normalize changelog wording to direct action statements
2026-05-24 18:00 (user) Add changelog and TODO cross-validation
2026-05-24 18:00 (ai) Added cross-validation scripts that check TODO entries against changelog
2026-05-24 18:00 (commit 92dedf7) chore: update changelog and add structured TODO/docs validation
2026-05-23 11:00 (user) Organize folder structure, tests, and dataset
2026-05-23 11:00 (ai) Restructured test directory, organized dataset, optimized TODO management
2026-05-23 11:00 (commit 5f3d235) chore: optimise tasks, todo management
2026-05-23 11:00 (commit f491034) chore: structure folder, tests, todo, dataset
2026-05-22 23:00 (user) Full test coverage, link and summary, multi-person names
2026-05-22 23:00 (ai) Added comprehensive test coverage, link extraction, multi-person name handling, summary word count
2026-05-22 23:00 (commit 3c60120) feat: summary text words count
2026-05-22 23:00 (commit e5b3a35) feat: full test coverage, link and summary for exports, deal names in multi-person chat
2026-05-21 23:00 (user) Fix duration, date, multi-sender
2026-05-21 23:00 (ai) Fixed duration formatting edge cases, date normalization for multi-sender conversations
2026-05-21 23:00 (commit 162a6b4) fix: duration, date, multi sender
2026-05-20 23:00 (user) Fix summary counts
2026-05-20 23:00 (ai) Corrected per-participant message and image counts in summary output
2026-05-20 23:00 (commit 48633bf) fix: summary counts2
2026-05-20 23:00 (commit 828ac67) fix: summary counts
2026-05-19 22:00 (user) Calendar date parsing without "At" prefix, more message types
2026-05-19 22:00 (ai) Added calendar-date parsing for ARIA labels without "At" prefix, support for reactions, multi-person summaries
2026-05-19 22:00 (commit b9d89bc) fix: duration, date, multi sender
2026-05-19 22:00 (commit 990decb) multi-person summary, reactions
2026-05-19 22:00 (commit 1aa5005) source days to date format
2026-05-18 17:00 (user) Accessible panel, dev testing, todo management
2026-05-18 17:00 (ai) Generated frontend bundle, added reaction support, structured repos, updated TODO
2026-05-18 17:00 (commit 27da1bb) reaction message type
2026-05-18 17:00 (commit 990decb) multi-person summary, reactions
2026-05-18 17:00 (commit 73226f0) todo-next
2026-05-18 17:00 (commit 5e9e2de) app and app.min version
2026-05-18 17:00 (commit 74a0be1) structure, test, version updates
2026-05-17 18:00 (user) GitHub Actions, repo structure, test validation, CI workflow
2026-05-17 18:00 (ai) Set up CI workflow, standardized repo structure, added test validation
2026-05-17 18:00 (commit 78c8657) guthub actions, build, dev structure
2026-05-17 18:00 (commit 358e572) standard repo structure, test, validation, ci workflow
2026-05-17 18:00 (commit aefd67a) github worklows
2026-05-16 23:00 (user) Multi-person chat summaries, reactions, image counts
2026-05-16 23:00 (ai) Added multi-person summary support, reaction type detection, image counting
2026-05-16 23:00 (commit a87ec74) acessible panel, dev test
2026-05-15 19:00 (user) Build a tool that exports Messenger HTML to text files
2026-05-15 19:00 (ai) Built initial export pipeline with summary, panel options, duration handling, folder structure
2026-05-15 19:00 (commit a490a14) export message with summary, panel options
2026-05-15 19:00 (commit 2911db4) standard duration, updated tests
2026-05-15 19:00 (commit a5f5d7f) initial test
2026-05-15 19:00 (commit 00d3aef) folder structure
2026-05-15 19:00 (commit 98c14c9) Remove JSON source metadata and make build scripts fully non-interactive
2026-05-15 19:00 (commit a5d8c4d) Fix CI build and docs, remove stale src_ path
2026-05-15 19:00 (commit 5a76f2e) Initial commit