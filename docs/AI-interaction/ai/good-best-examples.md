# Good and Best AI Examples

## Good AI examples

These are clear, focused actions the assistant should take.

- `update changelog and add docs/AI-interaction with separate user and assistant guides`
- `preserve commit-msg and keep lint in pre-push`
- `document user request examples for this project and AI prompt requirements`
- Focus on consistency between frontend and server code paths when fixing classification logic.
- When adding a message type to the header, verify both `export-config.json` and `generated-txt-schema.json` stay in sync, then regenerate golden snapshots.
- Include edge case and function parameter tests when refactoring shared utility functions.
- `add AI interaction documentation under docs/AI-interaction with user and assistant folders`

## Best AI behavior

Best behavior means:

- verifying current file contents before editing
- keeping changes small and scoped to the request
- not altering unrelated files
- preserving repository conventions such as `.husky/commit-msg` and `CHANGELOG.md`

## Why this is best

The best AI behavior creates a minimal, reviewable diff. It follows the user's explicit instruction, updates only relevant docs or code, and uses the repo's existing conventions.
