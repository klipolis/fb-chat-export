# AI Interaction Guidance

This folder contains reference documentation for working with the repository through AI-assisted editing and collaboration. It is a one-way reference — hot AI instruction files (prompts, session logs) live outside `docs/`.

It is intended as an educational reference for:

- repository contributors who want to interact with the assistant effectively
- future maintainers who want consistent AI behavior and response expectations
- contributors who want to understand the current AI workflow for code and docs changes

The folder is split into two areas:

- `user/` — user-facing behaviour, request guidance, past style, and best future examples.
- `ai/` — assistant-facing workflow rules, what the AI needs, past style, and best future examples.

## Related hot files (outside `docs/`)

- `project-prompts/` — reusable AI prompt files (code audit, task generation, reproduction, trace guidance)
- `project-logs/interaction-log.md` — reverse-chronological record of AI sessions
- `project-logs/activity-log.md` — reverse-chronological log of user requests, AI responses, and commits
- `project-logs/audit-log.md` — audit findings log

## Contents

- `user/overview.md` — summary of user guidance and project-specific request rules.
- `user/past-behavior.md` — historical user behavior style and lessons learned.
- `user/what-users-should-provide.md` — precise request details the assistant needs.
- `user/good-best-examples.md` — good and best user request examples for this project.

- `ai/overview.md` — summary of assistant behavior and workflow expectations.
- `ai/past-behavior.md` — historical assistant behavior style and lessons learned.
- `ai/what-ai-needs.md` — what the assistant needs from the user.
- `ai/good-best-examples.md` — good and best assistant behavior examples.
