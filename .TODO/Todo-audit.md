# TODO — Audit

This file contains ongoing audit and hygiene tasks that are always valid. These tasks are not time-boxed; run them when reviewing project health, before releases, or when guidance changes.

Audit tasks should verify project conventions and prevent regressions. Include checks for:

- Automation scripts still run correctly
- Safety rules (safe file handling, append-only patterns) remain honored
- Cross-file consistency (version numbers, configuration sync)
- User-facing outcomes match expected behavior

Avoid rote file-maintenance tasks here; instead, document them in this file's procedure
so they happen automatically without needing separate tracking.

## For TODO

- Verify TODO-next.md header still declares the task prefix, next T-number, categories, gap-reuse rule, and empty-section rule.
- Verify TODO-done.md header still records the last inserted T-number.
- Verify no T-numbers appear in TODO-future.md, TODO-ignore.md, or TODO-audit.md.
- Verify all task descriptions start with a capital letter and use present-tense wording.
- Verify gap reuse is still preferred over advancing the next T-number.
- Verify all five canonical sections exist in TODO-next.md and TODO-done.md, including empty ones with placeholder.
- Verify tasks moved from TODO-next to TODO-done keep their number and wording unchanged.

## For CHANGELOG

- Verify CHANGELOG still uses the [Unreleased] section at the top and keeps all entries in active voice.
- Verify each release entry uses only the allowed sections and excludes internal identifiers or file paths.
- Verify every feature or fix commit has a matching user-facing entry under [Unreleased].

## For lints

- Verify scripts/check-todo-management.js still enforces the active TODO rules and reports missing categories or invalid task IDs.
- Verify scripts/lint-todo-files.js still checks task format, category sections, and header patterns.
- Verify pre-commit hooks still run TODO linting and validate docs, scripts, and AGENTS references together.
- Verify lint:internal-refs runs without errors on the full doc set.
- Verify no .only calls remain in test files.
- Verify pre-commit hooks still run the internal-refs checker and .only detector.
- Verify esbuild version is up to date with no audit warnings.
- Verify all build dependencies are current and free of audit warnings.

## For QA

- Verify style-variant visual reference covers Default, Hero, Compact, and Inline variants across desktop and mobile breakpoints.
- Verify counter-default editor animation triggers on mode switch and completes without console errors.
- Verify all inner blocks render correctly in the editor and on the front end.

## For docs and guidance

- Verify project-prompts/trace-guidance.md still matches current procedure.
- Verify guidance docs reference current block features and patterns.
- Verify all user-facing docs avoid internal file paths and script names.
- Verify publish-readiness checklist covers the latest block.json features.
- Verify release checklist matches the current release process and automation.
- Verify publish-readiness checklist references correct context naming conventions.
- Verify docs/AI-interaction/ files are in sync with current project practices.
