# TODO — Next tasks

Rules: docs/developer-guide/todo-management.md

- Task number Prefix: T- | Next: 394 | Gaps: none
- Sections: Build/CI, Backend, Frontend, Cleanup, Process, Documentation
- Use smallest gap T-number; fill gaps before advancing next
- Write outcome-focused, present tense, capital letter; phrase every item like a user-visible or design-level outcome so the work is actionable even if implementation names change later
- Empty sections use "- no tasks" placeholder
- Move done tasks to TODO-done.md unchanged
- Ongoing/periodic tasks belong in TODO-audit.md, not in next or done

---

# Active Task Queue

## Build / CI

- T-389. Automate dependency audit in CI — fail the build when pnpm audit returns high-severity advisories.

## Test coverage

- T-390. Add test that build:watch rebuilds only changed input files and skips unchanged ones.
- T-391. Add test for Twitter/Facebook blockquote[data-text] fallback path in reply extraction.

## Documentation

- T-381. Document data-config/frontend_shared.json alias and duration fields so contributors can extend message types without guessing keys.

## Refactoring

- T-385. Extract shared date formatter used by both export-formatter.js and export-text.js into a single helper to remove duplicated formatDate logic.

## Schema & config

- T-392. Add `includeRepliedText` to tests/generated-txt-schema.json and all export config variants so the toggle is validated consistently.

## Export format

- T-393. Wire `includeRepliedText` through build-server.cjs writeTextExports so raw-date and max exports honour the option without duplicating option objects.

## Message type detection

- no tasks

## Content extraction

- no tasks

## Alias / Anonymisation

- no tasks

## Cleanup

- Remove dead `parseDurationToSeconds` remnants from export-json.js after confirming durationToSeconds covers all call paths.

## Process

- no tasks

## Frontend

- no tasks


