# What the AI Needs from the User

The assistant behaves best when the user gives a precise request.

## Required information

- a clear goal, e.g. `update changelog and add AI docs`
- the exact file or folder path involved
- whether the change is docs-only, code-only, or both
- repo constraints such as `commit-msg only`, `pre-push lint`, or `pnpm` usage

## Helpful context

- mention current repository conventions, e.g. `CHANGELOG.md has an Unreleased section`
- mention build or test flow if relevant, e.g. `pnpm run lint`, `pnpm run test`
- mention targeted docs sections, e.g. `docs/README.md`, `docs/site.md`, `docs/AI-interaction`
- mention `.aiignore` if you want the AI to skip certain paths
- mention `AGENTS.md` and `ai-chat-behavior.config.ts` for project-specific behavior

## Summary

The AI needs precise, project-specific requests. When the user provides that, the assistant can make clean, minimal edits that match this repository's workflow.