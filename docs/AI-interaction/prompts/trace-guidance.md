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

## Post-interaction saves

After an interaction completes, save the following to the AI interaction docs:

- Add a summary entry to `docs/AI-interaction/prompts/project-reproduction.md` if the work produces a reusable pattern
- Update relevant guidance in `docs/AI-interaction/user/` or `docs/AI-interaction/ai/` if conventions changed
- Add any new patterns to `docs/AI-interaction/patterns.md` for future reference

## Post-close saves

When an AI session closes:

- Record the session outcome in `docs/AI-interaction/prompts/interaction-log.md` (create if not exists)
- Include the final state: completed tasks, pending items, and any blockers
- Link to relevant commits, PRs, or TODO entries for continuity

## How to use traces

- Keep traces in the AI interaction docs folder.
- Use them as educational references for future AI-assisted work.
- Avoid excessive technical detail; focus on the decision and result.

## Example trace prompt

- `Add AI interaction trace guidance so every future request is preserved in the docs for educational review.`
- `Create post-interaction save procedure so work is documented after each session.`
- `Document post-close session recording so AI work continuity is maintained.`
