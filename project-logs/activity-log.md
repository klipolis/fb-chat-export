# Activity Log

This AI Agent: add entries for your session at the top of this file in reverse-chronological order. Each entry is a standalone line. Blank lines between session groups for readability are fine but do not nest or indent entries.

**Format:**

```
YYYY-MM-DD HH:MM | user | what the user requested — concise summary
YYYY-MM-DD HH:MM | ai | one-line summary of what the AI did in response
YYYY-MM-DD HH:MM | commit <hash> | commit subject
```

Do not modify existing entries below. Update `project-logs/interaction-log.md` as well for AI session details.

---

2026-06-08 21:45 | user | Remove autoscan, move case-insensitive checkbox, minimise CSS, more TODO tasks
2026-06-08 21:45 | ai | Removed autoscan, moved case-insensitive toggle into alias panel, replaced inline CSS with shared classes, added TODO tasks

2026-06-08 21:30 | user | Implement T-325 to T-337 pending tasks
2026-06-08 21:30 | ai | All 13 tasks implemented via 4 parallel agents: cache tests (narrower + invalidation), reuseMode constants, schema nullable fields + exportOptions snapshot, frontend (cache-hit dot, sessionStorage persist, TTL), pinned-location type rule, emoji variant stripping, alias collision warning, pre-commit lint:docs guard, cache append doc. Fixed html-utils.js findMatchingClosingTag bug, updated reply test fixture.

2026-06-08 20:00 | user | Create and implement T-310 to T-324 tasks
2026-06-08 20:00 | ai | Added 15 new tasks (T-310 to T-324). Implemented all via parallel agents: JSON export improvements (durationSeconds, schema validation, build server options), cache architecture guide, CHANGELOG dedup, Room/Marketplace type investigation, aliases import/export JSON, message-type filter dropdown, scan progress fraction, 72 frontend tests, reply text extraction from DOM, audit+remove stale files.

2026-06-08 17:00 | user | Implement all TODO-next tasks (T-292 to T-308)
2026-06-08 17:00 | ai | 16 of 17 tasks done. 8 frontend features (alias persistence, case-insensitive matching, Escape stop, copy-to-clipboard, progress bar, preview, ETA, auto-scan), 4 test files, aria-label-parser split into sub-modules, full JSON export, 2 dev docs. T-298 (CSS extraction) skipped.
2026-06-08 17:00 | commit 4a0cb63 | feat: implement 16 of 17 TODO-next tasks - frontend features, tests, refactor, JSON export, docs

2026-06-08 12:00 | user | test verify the export output, implement tests
2026-06-08 12:00 | ai | Verified text-2 export output; updated golden snapshots; wrote unit + integration tests; fixed XYZ→ABC alias in integration test
2026-06-08 12:00 | commit 78d87c3 | test: verify export output with golden snapshots and text-2 fixture tests

2026-06-08 12:00 | user | review what we did, fix call type detection ("quick call?" classified as voice-note)
2026-06-08 12:00 | ai | Fixed plain "call" validation (≤2 words, letters only, no numbers) before voice-note classification; reordered video-call rule before link rule in message-rules.js; rebuilt frontend bundle

2026-06-07 20:00 | user | add more name/date finding rules for export label parsing
2026-06-07 20:00 | ai | Added extractNameAfterBy for "by X" patterns, isValidDateCandidate (max 6 words), DOM-based name fallback, updated pre-commit hook, rebuilt frontend bundle, lint passes
2026-06-07 20:00 | commit ce7beb1 | fix: extract sender name from by X patterns, validate date candidates, enforce AI logs in pre-commit

2026-06-07 15:00 | user | run lint + validation, audit 15 inconsistencies, fix them all, review export1.txt, improve name regex
2026-06-07 15:00 | ai | Fixed 15 inconsistencies across docs/configs/tests, expanded sender validation (50 chars, 5 words), added date:sender pattern, skipped duplicate Enter labels in parser, updated all affected tests, rebuilt frontend bundle
2026-06-07 15:00 | commit 5a5f5c3 | fix: resolve 15 inconsistencies, expand sender validation, deduplicate parser nodes

2026-06-07 14:00 | user | continue from last session, commit staged, find interrupted request (stash userscript fix)
2026-06-07 14:00 | ai | Committed Links section cleanup / panel refactor (36714a4), popped stash "wip: before userscript fix", reviewed all stash files vs current codebase — no feature loss, stash superseded by evolution, resolved conflicts, removed orphaned files, dropped stash
2026-06-07 14:00 | commit 36714a4 | refactor: remove Links section from TODO scripts, add cleanup countdown and Unicode alias validation

2026-06-06 20:00 | user | review sender name policy, fix editorconfig CRLF warning, fix UTF-8 encoding for Hungarian text, update AI interaction tracing
2026-06-06 20:00 | ai | Restored corrupted UTF-8 files from git, added data-output-auto rules to .editorconfig and .gitattributes, verified sender name policy compliance, updated session logs and AI interaction docs

2026-06-06 18:00 | user | fix full-name img alt not fully aliased, add frontend auto-populate alias panel, add group chat checkbox
2026-06-06 18:00 | ai | Fixed aliasChatNames full-name alt replacement, added setDetectedNames to createAliasRows, added sender name collection during scan and auto-populate on completion, added group chat mode checkbox

2026-06-06 17:30 | user | add more todo-next.md tasks
2026-06-06 17:30 | ai | Added 3 tasks to TODO-next.md (CLI args, worker pool refactoring, error handler), created worker-pool.js shared module
2026-06-06 17:30 | commit 10d9511 | docs: record AI session entry for TODO task queue update and worker-pool module

2026-06-06 09:30 | user | complete TODO-next tasks, verify dist, update docs, trace-guidance, post-interaction saves
2026-06-06 09:30 | ai | Removed unused exports from message-metadata, refactored worker-pool with terminate(), added signal handling and test, cleaned TODO files, validated dist (34/34 pass), updated logs
2026-06-06 09:30 | commit b0a0b9b | refactor: remove unused message-metadata exports, add worker pool graceful shutdown

2026-06-05 13:56 | user | restructure: move prompts+logs out of docs/ into project-prompts/ and project-logs/, add prompt script
2026-06-05 13:56 | ai | Moved prompts-collection/ → project-prompts/, logs/ → project-logs/, created scripts/run-prompt.cjs, updated AGENTS.md/docs cross-refs
2026-06-05 13:56 | commit 50dfcf8 | refactor: move hot prompt and log files out of docs/ into project-prompts/ and project-logs/


2026-06-05 13:45 | user | review and rebuild the log format, update docs, agents, contribute
2026-06-05 13:45 | ai | Fixed all commit entries to (commit <hash>) format, updated format specs, checked cross-references
2026-06-05 13:45 | user | review log format, hash within brackets. also update the docs, agents, contribute
2026-06-05 13:45 | ai | Fixed all commit entries to (commit <hash>) format, updated AGENTS.md and trace-guidance.md log format descriptions
2026-06-05 13:45 | commit e5d3fa6 | docs: fix commit hash format to (commit <hash>) across logs and doc references
2026-06-05 13:30 | user | review and rebuild the interaction-log.md, then commit all session work
2026-06-05 13:30 | ai | Fixed interaction-log.md header to match actual entry format, removed stale example block, added current session entry
2026-06-05 13:30 | commit 931e21e | feat: consolidate error handling, add empty input test, code audit tasks
2026-06-05 13:00 | user | Continue if you have next steps, or stop and ask for clarification
2026-06-05 13:00 | ai | Completed T-264 empty input test, T-265 error-utils.js consolidation, added 8 future tasks to TODO-future.md, verified doc cross-references

2026-06-05 12:30 | user | add prompt to library: add more meaningful tasks to improve build, stability, shared code
2026-06-05 12:30 | ai | Created code-improvement-prompts.md with four reusable prompts, updated README
2026-06-05 12:30 | commit 500c68b | docs: add code improvement prompts to prompts-collection
2026-06-05 12:20 | user | better file naming than session-plan.md; pattern date|type|text; add AI agent prompt
2026-06-05 12:20 | ai | Renamed to activity-log.md, rewrote with date|type|text format, added AI agent prompt
2026-06-05 12:20 | commit 503f7e4 | docs: rename session-plan to activity-log, add AI agent prompt
2026-06-05 12:15 | commit 66ab709 | docs: restructure AI-interaction folders, clarify session plan
2026-06-05 12:15 | commit 0eb1269 | docs: add current session entries to interaction-log and activity-log
2026-06-05 12:15 | commit da872cb | chore: add future/next tasks, update activity log
2026-06-05 12:00 | user | restructure AI-interaction folders, separate prompts from logs, clarify purpose
2026-06-05 12:00 | ai | Renamed prompts/ to prompts-collection/, moved interaction-log to ai-logs/, rewrote session-plan
2026-06-05 11:30 | user | add a session history file recording user inputs with date-time and commits
2026-06-05 11:30 | ai | Created .TODO/plan.md with chronological session history, later moved to docs/logs/

2026-06-05 09:00 | user | Add Node >=26.0.0 engines constraint, remove worker_threads fallback
2026-06-05 09:46 | commit cccf06a | chore: update TODO tasks for empty input validation and error handling
2026-06-05 09:41 | commit cf4ef2d | refactor: remove worker_threads fallback, add Node >=26.0.0 engines constraint
2026-06-05 09:37 | commit 5d25d80 | chore: add Node >=26.0.0 engines constraint, remove fallback task, add new TODOs
2026-06-05 09:30 | ai | Removed hasWorkers fallback from build-server.cjs, added engines constraint to package.json

2026-06-05 08:00 | user | Add word count edge cases and Unicode integration tests
2026-06-05 09:16 | commit 739a379 | chore: add worker pool graceful shutdown test task to TODO-next
2026-06-05 09:13 | commit 19ea27d | chore: add new TODO tasks for build CI and refactoring
2026-06-05 09:11 | commit 3fc7c02 | docs: add JSON preview format documentation with name field details
2026-06-05 09:08 | commit 4c62eba | test: add word count edge cases and Unicode integration tests, update TODO files
2026-06-05 09:02 | commit 5197685 | test: add onlyFiles option tests for create-nodes.js, update TODO files
2026-06-05 08:30 | ai | Added word count tests across all message types, Unicode sender integration tests, JSON docs

2026-06-04 22:00 | user | Add data_raw.name and data_preview.name fields, Unicode name support, word count consistency
2026-06-04 23:30 | commit 3a5426e | chore: add new TODO tasks for test coverage, build CI, and documentation
2026-06-04 23:26 | commit 3902d07 | docs: add post-interaction and post-close save procedures to AI interaction docs
2026-06-04 23:14 | commit 7731e11 | feat: add unicode name recognition, word count consistency, and data name fields with tests and docs
2026-06-04 22:01 | commit db73f35 | feat: add data_raw.name and data_preview.name fields with alias mapping to json exports
2026-06-04 22:30 | ai | Added name fields to JSON exports, fixed Unicode sender detection, changed length from chars to words

2026-06-04 18:00 | user | Add worker_threads availability check fallback, onlyFiles test, consolidate shared code
2026-06-04 18:34 | commit 81c14bd | feat: add worker_threads fallback and onlyFiles test; docs: update TODO
2026-06-04 18:09 | commit 252b531 | docs: update TODO tracking, AI-interaction patterns, and developer guide for parallel/cache build
2026-06-04 18:15 | ai | Added hasWorkers try-catch with sequential fallback path, onlyFiles assertion, shared code consolidation

2026-06-04 12:00 | user | Add parallel worker pool for HTML optimization, incremental build cache
2026-06-04 18:03 | commit f96d773 | feat: add parallel worker pool and partial rebuild; test: add parallel and cache tests
2026-06-04 12:11 | commit 99017e0 | test: add incremental build cache and skip tests
2026-06-04 12:10 | commit feae95d | docs: mark T-215 done, update TODO tracking for incremental build
2026-06-04 12:09 | commit 0adb916 | feat: add incremental build support with cache manifest
2026-06-04 11:57 | commit 0205824 | chore: standardise TODO categories, add commit refs to done tasks, add question template
2026-06-04 11:48 | commit 503d098 | feat: add artifact size reporting, dependabot config, input HTML docs, and schema tests
2026-06-04 12:30 | ai | Implemented worker_threads pool with bounded concurrency, cache manifest with three-path build decisions

2026-06-04 09:00 | user | Add build-time JSON schema validation, consolidate shared modules, add tests
2026-06-04 11:31 | commit 487238b | test: add shared module tests for constants and html-utils; docs: add developer onboarding guide
2026-06-04 11:21 | commit 4c427d3 | docs: update TODO files and AGENTS.md for completed tasks T-210/T-211/T-212/T-214/T-224
2026-06-04 11:16 | commit 36f7f81 | feat: add build-time JSON schema validation for generated preview files
2026-06-04 11:04 | commit 0d01301 | refactor: consolidate shared code into dedicated modules
2026-06-04 03:28 | commit 512f5c0 | test: add direct unit tests for buildEntryFromEntry, buildDetailedSummary, buildSummaryJson
2026-06-04 10:00 | ai | Added validateGeneratedJson(), consolidated shared code into dedicated modules, added unit tests

2026-06-03 19:00 | user | Fix structure, summary, stats; server structure; dead code cleanup
2026-06-04 03:25 | commit 5972a43 | chore: standardize T- prefix across TODO files
2026-06-04 03:20 | commit 3e31f9d | chore: voice-note transcript detection, shared code consolidation
2026-06-04 00:08 | commit cc7b8a3 | fix: link-text content includes both URL and user text
2026-06-03 19:32 | commit 3adbbed | chore: cleanup dead code, fix browser unhandled rejection, update docs
2026-06-03 19:23 | commit c4b59ce | chore: update TODO backlog, add AI interaction reference, remove dead code
2026-06-03 20:00 | ai | Removed stale message-type references, fixed unhandled promise rejection, updated link-text

2026-06-02 23:00 | user | Fix alias names, dates, duration
2026-06-02 23:52 | commit 152b844 | fix: alias names, dates, duration
2026-06-02 23:37 | commit 9ad105b | fix: alias names, dates, duration
2026-06-02 23:30 | ai | Patched alias name resolution for multi-person chats, fixed date normalization

2026-05-29 09:00 | user | Fix summary word counts
2026-06-03 12:27 | commit a82a805 | fix: structure, summary, stats
2026-05-29 09:40 | commit 9b0e601 | fix: summary words
2026-05-29 09:30 | ai | Corrected word count aggregation in summary output

2026-05-27 15:00 | user | Fix multiple image posts, allow numeric suffixes on message files
2026-05-27 18:05 | commit a5d913a | fix: image total count
2026-05-27 15:38 | commit c72ef35 | feat: allow numeric suffixes on all message file types in rules
2026-05-27 09:56 | commit dca7975 | fix: multiple image post, docs
2026-05-27 01:22 | commit 33f600b | chore: update validation docs and message metadata tests
2026-05-27 16:00 | ai | Fixed image count aggregation, allowed image-N.html patterns, updated validation docs

2026-05-26 21:00 | user | Validation self-healing, documentation references
2026-05-26 22:52 | commit b0d576e | chore: validation self-healing
2026-05-26 21:49 | commit 5727dfb | chore: finalize docs references and default self-heal validation
2026-05-26 22:00 | ai | Made validation scripts self-healing with --self-heal flag, finalized doc references

2026-05-25 21:00 | user | Normalize changelog wording to direct action statements, enforce rules
2026-05-25 21:51 | commit 9cdc6bd | fix: enforce changelog and TODO wording rules and centralize repo path resolution
2026-05-25 21:09 | commit bfb30e5 | docs: normalize changelog wording to direct action statements
2026-05-25 21:30 | ai | Rewrote changelog entries to active present-tense, added lint rules for wording

2026-05-24 18:00 | user | Add changelog and TODO cross-validation
2026-05-24 18:30 | commit 92dedf7 | chore: update changelog and add structured TODO/docs validation
2026-05-24 18:15 | ai | Added cross-validation scripts that check TODO entries against changelog

2026-05-23 11:00 | user | Organize folder structure, tests, and dataset
2026-05-24 11:13 | commit 5f3d235 | chore: optimise tasks, todo management
2026-05-23 11:22 | commit f491034 | chore: structure folder, tests, todo, dataset
2026-05-23 11:30 | ai | Restructured test directory, organized dataset, optimized TODO management

2026-05-22 23:00 | user | Full test coverage, link and summary, multi-person names
2026-05-23 06:51 | commit 3c60120 | feat: summary text words count
2026-05-22 23:56 | commit e5b3a35 | feat: full test coverage, link and summary for exports, deal names in multi-person chat
2026-05-22 23:30 | ai | Added comprehensive test coverage, link extraction, multi-person name handling

2026-05-21 23:00 | user | Fix duration, date, multi-sender
2026-05-21 23:40 | commit 162a6b4 | fix: duration, date, multi sender
2026-05-21 23:15 | ai | Fixed duration formatting edge cases, date normalization for multi-sender conversations

2026-05-20 23:00 | user | Fix summary counts
2026-05-20 23:23 | commit 48633bf | fix: summary counts2
2026-05-20 23:21 | commit 828ac67 | fix: summary counts
2026-05-20 23:10 | ai | Corrected per-participant message and image counts in summary output

2026-06-08 17:00 | commit 4255a73 | feat: browser export cache, alias-only reuse, date-shrink reuse, UI layout, smart cleanup
2026-06-08 17:00 | ai | Implemented browser export cache with alias-only and date-shrink reuse, restructured notice UI, removed auto-cleanup countdown, added cleanup on new scan
2026-05-19 22:00 | user | Calendar date parsing without "At" prefix, more message types
2026-05-21 15:25 | commit b9d89bc | fix: duration, date, multi sender
2026-05-19 22:46 | commit 990decb | multi-person summary, reactions
2026-05-19 03:08 | commit 1aa5005 | source days to date format
2026-05-19 22:30 | ai | Added calendar-date parsing for ARIA labels without "At" prefix, support for more message types

2026-05-18 17:00 | user | Accessible panel, dev testing, todo management
2026-05-19 22:46 | commit 27da1bb | reaction message type
2026-05-19 03:08 | commit 990decb | multi-person summary, reactions
2026-05-18 13:46 | commit 73226f0 | todo-next
2026-05-18 12:43 | commit 5e9e2de | app and app.min version
2026-05-18 00:11 | commit 74a0be1 | structure, test, version updates
2026-05-18 17:30 | ai | Generated frontend bundle, structured repos, added reaction support, updated TODO

2026-05-17 18:00 | user | GitHub Actions, repo structure, test validation, CI workflow
2026-05-17 18:20 | commit 78c8657 | guthub actions, build, dev structure
2026-05-17 09:50 | commit 358e572 | standard repo structure, test, validation, ci workflow
2026-05-17 08:34 | commit aefd67a | github worklows
2026-05-17 18:15 | ai | Set up CI workflow, standardized repo structure, added test validation

2026-05-16 23:00 | user | Multi-person chat summaries, reactions, image counts
2026-05-18 17:37 | commit a87ec74 | acessible panel, dev test
2026-05-16 23:30 | ai | Added multi-person summary support, reaction type detection, image counting

2026-05-15 19:00 | user | Build a tool that exports Messenger HTML to text files
2026-05-16 23:39 | commit a490a14 | export message with summary, panel options
2026-05-15 19:30 | commit 2911db4 | standard duration, updated tests
2026-05-15 16:52 | commit a5f5d7f | initial test
2026-05-15 16:34 | commit 00d3aef | folder structure
2026-05-15 14:37 | commit 98c14c9 | Remove JSON source metadata and make build scripts fully non-interactive
2026-05-15 14:08 | commit a5d8c4d | Fix CI build and docs, remove stale src_ path
2026-05-15 13:52 | commit 5a76f2e | Initial commit
2026-05-15 19:30 | ai | Built initial export pipeline with summary, panel options, duration handling, folder structure