# Session plan

Chronological log of user inputs and corresponding commits. Each entry shows what the user asked for, followed by any resulting commits.

---

## 2026-05-15 – Initial setup

User: Build a tool that exports Messenger HTML to text files.

- `a490a14` Initial export logic with summary, panel options
- `a5f5d7f` First tests
- `2911db4` Standardized duration handling
- `00d3aef` Folder structure
- `a5d8c4d` Fix CI and docs, clean up stale paths
- `98c14c9` Remove JSON metadata source, non-interactive build

## 2026-05-16 – Multi-person chat, reactions

User: Handle multi-person chat summaries, reactions, image counts.

- `9ad105b` Fix alias names, dates, duration
- `152b844` Fix alias names, dates, duration
- `a82a805` Fix structure, summary, stats
- `a5d913a` Fix image total count
- `9b0e601` Fix summary words

## 2026-05-17 – Structure, CI, validation

User: Set up GitHub Actions, repo structure, test validation.

- `78c8657` GitHub Actions, build, dev structure
- `358e572` Standard repo structure, test validation, CI workflow
- `aefd67a` GitHub workflows
- `5e9e2de` Frontend dist bundle (app.js, app.min.js)

## 2026-05-18 – Accessibility, tests

User: Accessible panel, dev testing, todo management.

- `f491034` Structure folder, tests, todo, dataset
- `990decb` Multi-person summary, reactions
- `27da1bb` Reaction message type
- `1aa5005` Date format from source days

## 2026-05-19 – Date normalization, more types

User: Handle calendar dates without "At" prefix, more message types.

- `e5b3a35` Full test coverage, link and summary, multi-person names
- `b9d89bc` Fix duration, date, multi sender

## 2026-05-20 – Summary counts

User: Fix summary counts.

- `828ac67` Fix summary counts
- `48633bf` Fix summary counts

## 2026-05-21 – Duration fixes

User: Fix duration formatting.

- `3c60120` Summary word counts
- `162a6b4` Fix duration, date, multi sender

## 2026-05-22 – Full coverage

User: Complete test coverage.

- `b9d89bc` Fix duration, date, multi sender
- `162a6b4` Fix duration, date, multi sender

## 2026-05-23 – Structure

User: Organize folder structure, tests, and dataset.

- `5f3d235` Optimise tasks, todo management

## 2026-05-24 – Validation

User: Add changelog and TODO cross-validation.

- `92dedf7` Update changelog, structured TODO/docs validation

## 2026-05-25 – Wording rules

User: Normalize changelog wording to direct action statements. Enforce rules.

- `bfb30e5` Normalize changelog wording
- `9cdc6bd` Enforce changelog/TODO rules, centralize path resolution

## 2026-05-26 – Self-healing

User: Validation self-healing, documentation references.

- `5727dfb` Finalize docs references and default self-heal validation
- `b0d576e` Validation self-healing

## 2026-05-27 – Image handling

User: Fix multiple image posts, allow numeric suffixes.

- `33f600b` Update validation docs, message metadata tests
- `dca7975` Fix multiple image post, docs
- `c72ef35` Allow numeric suffixes on message file types
- `a5d913a` Fix image total count

## 2026-05-29 – Summary words

User: Fix summary word counts.

- `9b0e601` Fix summary words

## 2026-06-02 – Alias fixes

User: Fix alias names, dates, duration.

- `9ad105b` Fix alias names, dates, duration
- `152b844` Fix alias names, dates, duration

## 2026-06-03 – Structure & cleanup

User: Fix structure, summary, stats. Fix link video. Server structure. Dead code cleanup.

- `82191b6` Fix link video
- `a82a805` Fix structure, summary, stats
- `d8bec65` Server structure
- `c4b59ce` Update TODO backlog, add AI interaction reference, remove dead code
- `3adbbed` Cleanup dead code, fix browser unhandled rejection, update docs
- `74b9b4e` Remove duplicate TODO sections from lint reorder
- `cc7b8a3` Fix link-text content includes URL and user text

## 2026-06-04 – Consolidation

User: Voice-note transcript detection, shared code consolidation. Tests. Incremental build. Parallel processing.

- `3e31f9d` Voice-note transcript detection, shared code consolidation
- `5972a43` Standardize T- prefix across TODO files
- `512f5c0` Direct unit tests for buildEntryFromEntry, buildDetailedSummary, buildSummaryJson
- `e98c792` More tests
- `b70ad2f` Structure input-output
- `0d01301` Consolidate shared code into dedicated modules
- `36f7f81` Build-time JSON schema validation
- `4c427d3` Update TODO files and AGENTS.md for completed tasks
- `2dd5b79` Fix language style in changelog, todo entries, and documentation
- `487238b` Shared module tests, developer onboarding guide
- `42861f8` Update progress tracking
- `503d098` Artifact size reporting, dependabot, input HTML docs, schema tests
- `0205824` Standardise TODO categories, commit refs, question template

User: Add incremental build support — skip processing when unchanged, cache mtimes.

- `0adb916` Incremental build with cache manifest
- `feae95d` Mark T-215 done, update TODO tracking
- `99017e0` Incremental build cache and skip tests
- `6c8ca77` Mark T-228 done, update TODO tracking
- `27454b3` Move T-206, T-208, T-231 to ignore
- `f96d773` Parallel worker pool and partial rebuild

User: Add worker_threads availability check fallback.

- `252b531` Update TODO tracking, AI-interaction patterns, developer guide
- `81c14bd` Worker fallback and onlyFiles test

User: Add data_raw.name and data_preview.name fields. Unicode name support. Word count consistency.

- `db73f35` Add data_raw.name and data_preview.name with alias mapping
- `7731e11` Unicode name recognition, word count consistency, data name fields
- `3902d07` Post-interaction and post-close save procedures
- `3a5426e` New TODO tasks for test coverage, build CI, documentation

## 2026-06-05 – Tests & refactoring

User: Add word count edge cases and Unicode integration tests. Update TODO files.

- `5197685` onlyFiles option tests, update TODO files
- `4c62eba` Word count edge cases, Unicode integration tests, update TODO
- `3fc7c02` JSON preview format docs with name field details
- `19ea27d` New TODO tasks for build CI and refactoring
- `739a379` Worker pool graceful shutdown test task

User: Add Node engine constraint >=26, remove worker_threads fallback.

- `5d25d80` Node >=26 engines, remove fallback, new TODOs
- `cf4ef2d` Remove worker_threads fallback, add Node >=26 constraint
- `cccf06a` Update TODO tasks for empty input validation and error handling

---

## Current work (2026-06-05)

User: Refactoring — consolidate `ensureDir`, `extractLink`, `normalizeExportSender` into shared `utils.js`. Add `validateExportConfig()` to `build-server.cjs`. Audit `src/shared/` for remaining duplication. Add export config validation to CI.
