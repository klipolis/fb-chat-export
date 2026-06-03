# User Interaction Guide for AI-Assisted Editing

This guide describes how repository contributors should work with the AI assistant in this project.

## Past behavior style

In earlier interactions, broad requests often led to extra file changes or unclear edits. That made the review process slower and increased the risk of unintended modifications.

In this repository, the best behavior is:

- ask for one concrete change at a time when possible
- name the target file, folder, or subsystem
- avoid vague instructions like `fix things` or `update everything`

## What the user should provide

When you request a change, include:

- the exact file or folder name, e.g. `docs/AI-interaction`, `.husky/pre-push`, `CHANGELOG.md`
- the specific behavior you want, e.g. `preserve commit-msg hook`, `add AI docs`, `update changelog entry`
- whether the change is docs-only, code-only, or both
- any project-relevant context, such as `this repo uses pnpm`, `export preview JSON`, or `browser export panel`

## Task and changelog wording

- Describe the desired outcome, not the exact commands or implementation steps.
- Avoid mentioning specific tools or scripts in user-facing notes, since the underlying implementation can change.
- Use language like "verify changelog guard" and "update docs to explain hook behavior" rather than command names.

## Good examples

- `update changelog and docs folder to document AI interaction behavior`
- `add a new docs/AI-interaction guide for user prompt style and sample requests`
- `change the hook behavior so commit messages are validated and lint runs at push`

## Best future examples

- `create separate docs in docs/AI-interaction for user guidance and assistant behavior, with past style examples and future best practices`
- `document what users should supply in requests for this repo and what the assistant needs to know`
- `add examples of good and best user instructions tied to this project's workflow`

## Project-specific guidance

This repository uses:

- `.husky/commit-msg` for commit message validation
- `.husky/pre-push` for linting before pushes
- `CHANGELOG.md` with an `## [Unreleased]` section
- `docs/` for user and developer-facing documentation
- `src/` and `tests/` for code and regression coverage

When asking for docs or changelog updates, say whether the change should also appear in `docs/README.md` or `docs/site.md`.
