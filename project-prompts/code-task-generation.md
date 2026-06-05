# Code Task Generation

Generates improvement tasks across all project areas and writes them to TODO files. Does not require a prior audit — works from a project overview and codebase exploration.

Address the prompt with "This AI Agent" so it works with any assistant.

## Prompt: Generate improvement tasks

> This AI Agent: review the project and propose improvement tasks across all relevant categories. Before generating tasks, read the project overview (README, package.json, AGENTS.md, `.TODO/` files) and explore the codebase structure to understand what the project does.
>
### Categories
>
> Consider which of these categories need tasks. Omit categories that are irrelevant or already well-covered:
>
> - **CI / Build** — pipeline speed, reliability, caching, automation gaps
> - **Structure** — folder layout, module boundaries, code organisation
> - **Dependencies** — outdated packages, unused deps, vulnerability fixes
> - **End-user** — UI/UX improvements, error messages, behaviour gaps
> - **Testing** — missing coverage, test speed, flaky tests, integration gaps
> - **Security** — input sanitisation, secret handling, CSP, dependency audit
> - **Prompts / Docs** — stale AI guidance, missing prompt files, doc gaps
> - **Refactoring** — dead code, duplication, consolidation opportunities
> - **Schema & config** — validation gaps, config structure improvements
> - **Export format** — missing variants, format inconsistencies, new feature requests
> - **Performance** — memory, speed, concurrency improvements
>
### Task placement
>
> For each proposed task, decide which file it belongs in:
>
> - **`.TODO/TODO-next.md`** — actionable now, clear owner, no blockers
> - **`.TODO/TODO-future.md`** — valid but deferred (needs prerequisite, lower priority)
> - **`.TODO/TODO-ignore.md`** — deliberate no-fix (add rationale)
>
> Use `T-NNN` numbering from `.TODO/config.json`. Increment `nextTaskNumber` after assigning.
>
> Format each entry:
>
> ```
> - T-NNN. <present-action statement of the task>
> ```
>
### Output
>
> Write entries directly into the correct TODO files. Update `.TODO/config.json` task counter. Do not add entries that already exist in any TODO file.
