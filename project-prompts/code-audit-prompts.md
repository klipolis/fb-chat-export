# Code Audit Prompts

Audit the project for build, stability, and code health issues. Results are written to `project-logs/audit-log.md`. No TODO files are modified.

Address prompts with "This AI Agent" so they work with any assistant.

## Audit log format

Entries appended to `project-logs/audit-log.md` use this flat format:

```
### YYYY-MM-DD – Audit title

YYYY-MM-DD HH:MM | (audit: <area>) | findings summary
YYYY-MM-DD HH:MM | (finding: <risk-level>) | specific issue at file:line — recommended fix
```

## Prompt: Audit build system

> This AI Agent: audit the project build system and append findings to `project-logs/audit-log.md`. Do not modify TODO files. For each opportunity provide:
> - what it targets (specific file, config, or pipeline step)
> - the expected benefit
> - a brief implementation sketch
>
> Focus on the build pipeline (`src/build-server.cjs`, `src/frontend/build.cjs`), cache strategy, and validation scripts. Omit improvements already tracked in TODO files.

## Prompt: Identify stability gaps

> This AI Agent: review the codebase for error handling gaps that could cause silent failures or unhelpful crashes. Append findings to `project-logs/audit-log.md`. Do not modify TODO files. Look for:
> - `catch` blocks that swallow errors without logging
> - missing input validation in file-processing functions
> - assumptions about file structure that could break on unexpected input
> - worker pool or parallel processing paths that lack error isolation
>
> For each finding state the file:line, risk level, and recommended fix.

## Prompt: Consolidate shared code

> This AI Agent: find opportunities to consolidate duplicated or near-duplicated logic across `src/shared/`, `src/build-server.cjs`, and test helpers. Append findings to `project-logs/audit-log.md`. Do not modify TODO files. Look for:
> - functions with similar signatures but slightly different implementations
> - inline logic that already exists as a shared utility
> - test utilities that duplicate production helpers
>
> For each candidate state the files involved, overlap percentage, and consolidation approach. Do not suggest changes to generated output files or vendored dependencies.
