# Activity Log

This AI Agent: add entries for your session at the top of this file in reverse-chronological order.

For each user request during the session, add one `| user |` line with the date-time and a summary of what the user asked for. For each resulting commit, add one `| commit |` line with the date-time, commit hash, and a short description.

Format:

```
YYYY-MM-DD HH:MM | user | <what the user requested — concise summary>
YYYY-MM-DD HH:MM | commit | <hash> <commit subject>
```

Do not group or nest entries. Each line is a standalone event. Do not modify existing entries below.

---

2026-06-05 12:00 | user | Restructure AI-interaction docs: rename prompts folder, create ai-logs folder, clarify logs purpose
2026-06-05 12:00 | commit | 66ab709 docs: restructure AI-interaction folders, clarify session plan
2026-06-05 11:00 | user | Add session history file recording user inputs and commits
2026-06-05 11:00 | commit | f44d73f docs: add session plan file, update TODO tracking
2026-06-05 09:00 | user | Add Node >=26.0.0 engines constraint, remove worker_threads fallback
2026-06-05 09:46 | commit | cccf06a chore: update TODO tasks for empty input validation and error handling
2026-06-05 09:41 | commit | cf4ef2d refactor: remove worker_threads fallback, add Node >=26.0.0 engines constraint
2026-06-05 09:37 | commit | 5d25d80 chore: add Node >=26.0.0 engines constraint, remove fallback task, add new TODOs
2026-06-05 08:00 | user | Add word count edge cases and Unicode integration tests
2026-06-05 09:16 | commit | 739a379 chore: add worker pool graceful shutdown test task to TODO-next
2026-06-05 09:13 | commit | 19ea27d chore: add new TODO tasks for build CI and refactoring
2026-06-05 09:11 | commit | 3fc7c02 docs: add JSON preview format documentation with name field details
2026-06-05 09:08 | commit | 4c62eba test: add word count edge cases and Unicode integration tests, update TODO files
2026-06-05 09:02 | commit | 5197685 test: add onlyFiles option tests for create-nodes.js, update TODO files
2026-06-04 22:00 | user | Add data_raw.name and data_preview.name fields, Unicode name support, word count consistency
2026-06-04 23:30 | commit | 3a5426e chore: add new TODO tasks for test coverage, build CI, and documentation
2026-06-04 23:26 | commit | 3902d07 docs: add post-interaction and post-close save procedures to AI interaction docs
2026-06-04 23:14 | commit | 7731e11 feat: add unicode name recognition, word count consistency, and data name fields with tests and docs
2026-06-04 22:01 | commit | db73f35 feat: add data_raw.name and data_preview.name fields with alias mapping to json exports
2026-06-04 18:00 | user | Add worker_threads availability check fallback, onlyFiles test, consolidate shared code
2026-06-04 18:34 | commit | 81c14bd feat: add worker_threads fallback and onlyFiles test; docs: update TODO
2026-06-04 18:09 | commit | 252b531 docs: update TODO tracking, AI-interaction patterns, and developer guide for parallel/cache build
2026-06-04 12:00 | user | Add parallel worker pool for HTML optimization, incremental build cache
2026-06-04 18:03 | commit | f96d773 feat: add parallel worker pool and partial rebuild; test: add parallel and cache tests
2026-06-04 12:11 | commit | 99017e0 test: add incremental build cache and skip tests
2026-06-04 12:10 | commit | feae95d docs: mark T-215 done, update TODO tracking for incremental build
2026-06-04 12:09 | commit | 0adb916 feat: add incremental build support with cache manifest
2026-06-04 11:57 | commit | 0205824 chore: standardise TODO categories, add commit refs to done tasks, add question template
2026-06-04 11:48 | commit | 503d098 feat: add artifact size reporting, dependabot config, input HTML docs, and schema tests
2026-06-04 09:00 | user | Add build-time JSON schema validation, consolidate shared modules, add tests
2026-06-04 11:31 | commit | 487238b test: add shared module tests for constants and html-utils; docs: add developer onboarding guide
2026-06-04 11:21 | commit | 4c427d3 docs: update TODO files and AGENTS.md for completed tasks T-210/T-211/T-212/T-214/T-224
2026-06-04 11:16 | commit | 36f7f81 feat: add build-time JSON schema validation for generated preview files
2026-06-04 11:04 | commit | 0d01301 refactor: consolidate shared code into dedicated modules
2026-06-04 03:28 | commit | 512f5c0 test: add direct unit tests for buildEntryFromEntry, buildDetailedSummary, buildSummaryJson
2026-06-03 19:00 | user | Fix structure, summary, stats; server structure; dead code cleanup
2026-06-04 03:25 | commit | 5972a43 chore: standardize T- prefix across TODO files
2026-06-04 03:20 | commit | 3e31f9d chore: voice-note transcript detection, shared code consolidation
2026-06-04 00:08 | commit | cc7b8a3 fix: link-text content includes both URL and user text
2026-06-03 19:32 | commit | 3adbbed chore: cleanup dead code, fix browser unhandled rejection, update docs
2026-06-03 19:23 | commit | c4b59ce chore: update TODO backlog, add AI interaction reference, remove dead code
2026-06-02 23:00 | user | Fix alias names, dates, duration
2026-06-02 23:52 | commit | 152b844 fix: alias names, dates, duration
2026-06-02 23:37 | commit | 9ad105b fix: alias names, dates, duration
2026-05-29 09:00 | user | Fix summary word counts
2026-06-03 12:27 | commit | a82a805 fix: structure, summary, stats
2026-05-29 09:40 | commit | 9b0e601 fix: summary words
2026-05-27 15:00 | user | Fix multiple image posts, allow numeric suffixes
2026-05-27 18:05 | commit | a5d913a fix: image total count
2026-05-27 15:38 | commit | c72ef35 feat: allow numeric suffixes on all message file types in rules
2026-05-27 09:56 | commit | dca7975 fix: multiple image post, docs
2026-05-27 01:22 | commit | 33f600b chore: update validation docs and message metadata tests
2026-05-26 21:00 | user | Validation self-healing, documentation references
2026-05-26 22:52 | commit | b0d576e chore: validation self-healing
2026-05-26 21:49 | commit | 5727dfb chore: finalize docs references and default self-heal validation
2026-05-25 21:00 | user | Normalize changelog wording to direct action statements, enforce rules
2026-05-25 21:51 | commit | 9cdc6bd fix: enforce changelog and TODO wording rules and centralize repo path resolution
2026-05-25 21:09 | commit | bfb30e5 docs: normalize changelog wording to direct action statements
2026-05-24 18:00 | user | Add changelog and TODO cross-validation
2026-05-24 18:30 | commit | 92dedf7 chore: update changelog and add structured TODO/docs validation
2026-05-23 11:00 | user | Organize folder structure, tests, and dataset
2026-05-24 11:13 | commit | 5f3d235 chore: optimise tasks, todo management
2026-05-23 11:22 | commit | f491034 chore: structure folder, tests, todo, dataset
2026-05-22 23:00 | user | Full test coverage, link and summary, multi-person names
2026-05-23 06:51 | commit | 3c60120 feat: summary text words count
2026-05-22 23:56 | commit | e5b3a35 feat: full test coverage, link and summary for exports, deal names in multi-person chat
2026-05-21 23:00 | user | Fix duration, date, multi-sender
2026-05-21 23:40 | commit | 162a6b4 fix: duration, date, multi sender
2026-05-20 23:00 | user | Fix summary counts
2026-05-20 23:23 | commit | 48633bf fix: summary counts2
2026-05-20 23:21 | commit | 828ac67 fix: summary counts
2026-05-19 22:00 | user | Calendar date parsing without "At" prefix, more message types
2026-05-21 15:25 | commit | b9d89bc fix: duration, date, multi sender
2026-05-19 22:46 | commit | 990decb multi-person summary, reactions
2026-05-19 03:08 | commit | 1aa5005 source days to date format
2026-05-18 17:00 | user | Accessible panel, dev testing, todo management
2026-05-19 22:46 | commit | 27da1bb reaction message type
2026-05-19 03:08 | commit | 990decb multi-person summary, reactions
2026-05-18 13:46 | commit | 73226f0 todo-next
2026-05-18 12:43 | commit | 5e9e2de app and app.min version
2026-05-18 00:11 | commit | 74a0be1 structure, test, version updates
2026-05-17 18:00 | user | GitHub Actions, repo structure, CI workflow
2026-05-17 18:20 | commit | 78c8657 guthub actions, build, dev structure
2026-05-17 09:50 | commit | 358e572 standard repo structure, test, validation, ci workflow
2026-05-17 08:34 | commit | aefd67a github worklows
2026-05-16 23:00 | user | Multi-person chat summaries, reactions, image counts
2026-06-03 12:27 | commit | a82a805 fix: structure, summary, stats
2026-05-27 18:05 | commit | a5d913a fix: image total count
2026-05-20 23:23 | commit | 48633bf fix: summary counts2
2026-05-20 23:21 | commit | 828ac67 fix: summary counts
2026-05-18 17:37 | commit | a87ec74 acessible panel, dev test
2026-05-15 19:00 | user | Build Messenger HTML export tool with summary and panel options
2026-05-16 23:39 | commit | a490a14 export message with summary, panel options
2026-05-15 19:30 | commit | 2911db4 standard duration, updated tests
2026-05-15 16:52 | commit | a5f5d7f initial test
2026-05-15 16:34 | commit | 00d3aef folder structure
2026-05-15 14:37 | commit | 98c14c9 Remove JSON source metadata and make build scripts fully non-interactive
2026-05-15 14:08 | commit | a5d8c4d Fix CI build and docs, remove stale src_ path
2026-05-15 13:52 | commit | 5a76f2e Initial commit
