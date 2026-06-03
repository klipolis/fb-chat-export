# Assistant Behavior Guide for This Repository

This file describes how the assistant should behave when editing this repository.

## Past AI behavior style

Earlier guidance in this project sometimes resulted in overly broad edits, extra changes, or missing repository conventions. That made it harder to keep reviews clean and caused unnecessary churn in the repo.

The assistant should avoid:

- editing files not directly related to the user request
- rewriting docs without clear direction
- changing hook behavior without preserving project conventions
- making assumptions about release or lint workflows

## What the assistant needs from the user

The AI works best when the user provides:

- a clear goal, e.g. `update changelog and docs for AI interaction guidelines`
- the specific files or folders involved
- any repo-specific constraints, such as `commit-msg only` or `pre-push lint`
- whether the change is docs-only, code-only, or both

## Task phrasing guidelines

- Prefer outcome-oriented descriptions rather than exact implementation commands.
- Record what should be true after the change, not how it is done.
- Avoid fixing wording with exact script names or tool references in documentation or changelog text.

## Core principles

- Follow explicit user instructions precisely.
- Keep responses concise, professional, and formatted clearly.
- Use the repository's tooling and file conventions when making edits.
- Avoid unnecessary changes beyond what was requested.

## Tool usage

- Use file reads before edits to confirm current content.
- Use directory listings when locating documentation or config files.
- When editing, include 3-5 lines of surrounding context for replacements.
- Use task-specific tools rather than broad changes when possible.
- Prefer `multi_replace_string_in_file` for multiple related edits.

## Behavior in this repo

- Preserve the `commit-msg` hook for commit message validation.
- Keep the `pre-push` hook for linting before pushes.
- If asked to change hook behavior, adjust only the relevant `.husky` files.
- When asked to update docs, add or modify markdown files under `docs/`.
- When asked to update the changelog, add entries under `## [Unreleased]`.
- Avoid modifying generated output files unless the user explicitly asks.

## Good AI examples

- `update changelog and add docs/AI-interaction with separate user and assistant guides`
- `preserve commit-msg and move lint to pre-push, do not remove pre-push`
- `document user request examples for this project and AI prompt requirements`

## Best AI behavior for the future

- Verify current file contents before making edits.
- Keep changes small and scoped to the requested task.
- Document the reason for the change in the changelog when appropriate.
- Make docs easy to review by using structured headings and examples.
- Keep user and assistant guidance separated into distinct documents.

## Project-specific notes

- `docs/AI-interaction/user/overview.md` is for the user-facing guidance.
- `docs/AI-interaction/ai/overview.md` is for the assistant-facing workflow.
- Use `docs/README.md` and `docs/site.md` to advertise the new guide.
- Keep AI interaction guidance aligned with this project's existing hooks and docs conventions.
- Record each AI interaction as a trace in the AI interaction docs so future contributors can learn from past work.
