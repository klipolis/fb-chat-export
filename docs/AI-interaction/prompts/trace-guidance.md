# Trace Guidance for AI Interactions

This document explains how to record each AI interaction as a trace in the repository.

## Purpose

Every AI interaction should be documented so future readers can understand:

- what was requested
- what changed
- why the change was made
- how the AI arrived at the solution

## Trace content

A good interaction trace includes:

- the user request or prompt
- the files or doc sections updated
- the high-level reason for the change
- any learning or educational notes relevant to future contributors

## Session log

Maintain a reverse-chronological log in `docs/AI-interaction/prompts/interaction-log.md`.

Each session entry must include:

- **Date-time and short title**: `### YYYY-MM-DD HH:MM – Short title`
- **User**: Exact user input / prompt text (verbatim)
- **AI**: Short summary of what was done — key files changed, decisions made
- **Commits**: Bullet list of resulting commits with hash, date-time, and subject

Add new entries at the top of the list (most recent first).

## Session plan

`docs/logs/session-plan.md` holds a chronological (oldest-first) record of user inputs and corresponding commits across the full project history. Update it when adding significant new sessions.

## Post-interaction saves

After an interaction completes, save the following to the AI interaction docs:

- Add a summary entry to `docs/AI-interaction/prompts/project-reproduction.md` if the work produces a reusable pattern
- Update relevant guidance in `docs/AI-interaction/user/` or `docs/AI-interaction/ai/` if conventions changed
- Add any new patterns to `docs/AI-interaction/patterns.md` for future reference
- Add a session entry to `docs/AI-interaction/prompts/interaction-log.md`

## Post-close saves

When an AI session closes:

- Record the session outcome in `docs/AI-interaction/prompts/interaction-log.md` (add a new entry at top)
- Include the exact user input, AI summary, and all commit references
- If the session plan in `docs/logs/session-plan.md` is outdated, update it

## How to use traces

- Keep traces in the AI interaction docs folder.
- Use them as educational references for future AI-assisted work.
- Avoid excessive technical detail; focus on the decision and result.

## Example trace prompt

- `Add AI interaction trace guidance so every future request is preserved in the docs for educational review.`
- `Create post-interaction save procedure so work is documented after each session.`
- `Document post-close session recording so AI work continuity is maintained.`
