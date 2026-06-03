# What Users Should Provide

The AI works best when the user supplies clear and concrete information.

## Essential details

- exact file or folder name, e.g. `docs/AI-interaction/user`, `docs/site.md`, `.husky/pre-push`
- the desired behavior or outcome, e.g. `preserve commit-msg validation`, `move lint to pre-push`, `add AI docs`
- whether the change is docs-only, code-only, or both
- relevant project context, such as `pnpm`, `browser export panel`, `JSON preview generation`

## Recommended structure

1. What: the change you want
2. Where: the file(s) or folder(s)
3. Why: the desired effect or reason
4. Any constraints: hooks, lint, formatting, release rules

## Example request format

- `add AI interaction docs under docs/AI-interaction/user and docs/AI-interaction/ai`
- `update changelog and docs for the new AI guide, without changing source code`
- `preserve commit-msg hook validation and keep lint in pre-push`

Providing this information helps the assistant avoid assumptions and deliver a focused result.