# Code Improvement Prompts

Reusable prompts for asking an AI agent to audit and improve build quality, stability, and shared code structure. Address these to "this AI Agent" so they work with any assistant.

## Prompt: Audit build system for improvements

> This AI Agent: audit the project build system and propose 3–5 concrete tasks that improve build speed, reliability, or maintainability. For each task provide:
> - what the task targets (specific file, config, or pipeline step)
> - the expected benefit (faster rebuilds, fewer silent failures, clearer output)
> - a brief implementation sketch
>
> Focus on the build pipeline (`src/build-server.cjs`, `src/frontend/build.cjs`), cache strategy, and validation scripts. Do not suggest tasks already in the TODO queue. Prioritise tasks that a contributor could complete in under an hour.

## Prompt: Identify stability gaps

> This AI Agent: review the codebase for error handling gaps that could cause silent failures or unhelpful crashes. Look for:
> - `catch` blocks that swallow errors without logging
> - missing input validation in file-processing functions
> - assumptions about file structure that could break on unexpected input
> - worker pool or parallel processing paths that lack error isolation
>
> Produce a list of specific locations (file:line) with the risk level and a recommended fix for each. Format as TODO-ready entries: `T-NNN. <description>`.

## Prompt: Consolidate shared code

> This AI Agent: find opportunities to consolidate duplicated or near-duplicated logic across `src/shared/`, `src/build-server.cjs`, and any test helpers. Look for:
> - functions with similar signatures but slightly different implementations
> - inline logic that already exists as a shared utility
> - test utilities that duplicate production helpers
>
> For each candidate, state the files involved, the overlap percentage, and the consolidation approach. Do not suggest changes to generated output files or vendored dependencies.

## Prompt: Generate improvement task queue

> This AI Agent: run all three audits above (build, stability, shared code) and produce a combined task queue of 5–8 entries. Each entry must be a single actionable task in TODO format:
>
> ```
> - T-NNN. <present-action statement of the task>
> ```
>
> Prioritise tasks by user-visible impact first (stability), then developer experience (build speed), then code health (shared code). Add the results to `.TODO/TODO-future.md` under the appropriate category header.
