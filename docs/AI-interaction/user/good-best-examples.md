# Good and Best User Examples

## Good examples

These request styles are clear and actionable.

- `update changelog and docs folder to document AI interaction behavior`
- `add a docs/AI-interaction guide for user prompt style and sample requests`
- `change the hook behavior so commit messages are validated and lint runs at push`
- `document the current repo workflow for commit hooks and release validation`

## Best examples

These include the exact target and intent.

- `create separate docs in docs/AI-interaction/user and docs/AI-interaction/ai with past behavior style and future best practices`
- `add a user guide describing what request details are needed for this project and how to phrase instructions`
- `add an AI guide describing what the assistant needs from the user and how it should behave in this repo`
- `update docs/README.md and docs/site.md to link to the new AI interaction folders`

## Why these are better

Best examples reduce ambiguity by naming the destination, the scope, and the purpose. That means the assistant can make exactly the requested edits without adding unrelated changes.

## Additional guidance

- When requesting multiple related tasks, list them as numbered or bulleted items so the assistant can batch related work.
- Batch asks (e.g. "add more todo-next tasks and apply changes") work well because the assistant can discover tasks, implement them, and update docs in one session.
- Mention the update scope explicitly: code-only, docs-only, or both. When docs are included, specify which doc files should change.
