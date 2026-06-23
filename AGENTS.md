# Agents

This guide gives AI agents project-specific operating instructions.

## Before Starting

Read these first:

- This file (AGENTS.md)
- `ai-chat-behavior.config.ts`
- `kilo.json` (when using Kilo)
- `.TODO/TODO-next.md` (task numbering and instructions)

## Files to Ignore

Add files with raw prompts, keys, or sensitive user data to `.aiignore`
so they're never sent to AI.

Current entries:

```
dist/
.git/
node_modules/
pnpm-lock.yaml
package-lock.json
*.log
.env*
coverage/
.cache/
tmp/
out/
```

## What We Build

Chat messages export — exports Messenger chat history to `.txt` files.

## Key Commands

```bash
pnpm build              # build for production (server + frontend)
pnpm build:server       # generate optimized HTML, JSON, and TXT exports
pnpm build:frontend     # bundle frontend dist/app.js
pnpm test               # lint + unit tests + integration + validations
pnpm lint               # package, todos, changelog, eslint checks
pnpm validate:release   # full pre-release validation
pnpm create:nodes       # debug preview JSON generation
pnpm prompt             # list available prompt files in project-prompts/
pnpm run prompt:<name>  # show a specific prompt's content (e.g. prompt:trace-guidance)
```

## Editing Rules

- Focus on requested behavior only.
- Never read `dist/`, `.git/`, or `node_modules/` (saves tokens).
- Never edit output in `dist/` or `data-output-auto/` unless making
  production bundle artifacts.
- Use existing components, helpers, and patterns before adding new
  abstractions.
- Remove sensitive data from AI context before sending to any cloud
  vendor.
- Use direct current-state language in all text files. Describe current
  behavior and current rules, not past states, removed options,
  speculative possibilities, or future blockages. Mention past or
  future states only when the detail prevents a concrete risk.
- Prefer the shared code in `src/shared/` before duplicating logic in server or frontend paths.
- Never record exact sender names from chat data in logs, changelogs, TODO files, or documentation. Sender names are modifiable inputs — describe them generically (e.g. "the sender", "a detected name") instead.

## Script Rules

- ESM for source-side maintenance scripts (package is `type: module`).
- CommonJS for build scripts (`*.cjs`), deployment helpers, and tooling entry points that need `require()`.
- Use `scripts/lib/app-config.js` from ESM scripts and `scripts/lib/app-config.cjs` from CommonJS.
- Test scripts live in the plugin's `tests/` directory. Use `pnpm test:js`
  and `pnpm test:php` from the repo root.
- Build scripts live in `scripts/`
  (reference checks).
- Deployment automation: `scripts/deploy-and-test.mjs` verifies dist-root
  structure and prints a manual test checklist.

## Agent-Specific

### OpenCode (this CLI)

- Configured via `.opencode.json` at repo root.
- Reads `AGENTS.md` for instructions.
- Respects `.aiignore` for sensitive/ignored paths.
- Never reads `dist/`, `.git/`, or `node_modules/`.

### Kilo

- Configured via `kilo.json` at repo root for agent, command,
  permissions.
- New commands: `.kilo/command/*.md`; new agents: `.kilo/agent/*.md`.
- Respects `.aiignore` (also reads `.codexignore` if present).
- Never reads `dist/`, `.git/`, or `node_modules/`.

### Other AI Coding Agents

- Follow `ai-chat-behavior.config.ts` for communication style and
  project behavior.
- Respect `.aiignore` for sensitive/ignored paths.
- Respect `.gitignore` before reading source.
- Never read `dist/`, `.git/`, or `node_modules/`.
- Update `project-prompts/` (hot AI prompt files) after every prompt
  or guidance change.
- Update `docs/AI-interaction/` (reference docs) after every AI
  interaction then update user guidance, AI-agent guidance, prompt
  style, text-language rules, and bookkeeping guidance.

## AI Behavior

- Deterministic application logic is the source of truth for all
  metrics.
- AI must explain verified data, never invent metrics.
- Log failures enough to debug without leaking prompts or data.
- If required data is missing, state what is missing and offer next
  steps.

## When You See These Patterns

- Use `const` and narrow helpers over mutable shared state.
- Handle failed requests with user-facing errors, not silent failures.
- Avoid ad hoc string parsing — use schema validation
  (`tests/generated-txt-schema.json`) instead.

- Use `scripts/deploy-and-test.mjs` for pre-deployment verification.

## Output Verbosity

- Keep screen output tight. Do not echo code that can be seen via git
  diff. Summarise changes in 1–3 lines instead.
- Skip explanatory preamble/postamble. Give the answer directly.
- Tool calls (reads, writes, edits) already show file paths and line
  numbers — do not repeat that info in prose.
- Keep minified code files within their existing line-length limit.
  Markdown and docs do not need forced wrapping.

## Changelog Rules (AI agents must follow these)

When writing or editing `CHANGELOG.md`:

- Every entry must describe an **active change** — something added,
  fixed, changed, or removed in that release. Never write entries that
  only describe what was retained, preserved, or left unchanged.
- Use plain, user-facing language. Active voice: "Exports include
  attachments" not "Attachment export support has been added".
- Describe what the user observes or benefits from. Do not mention
  internal identifiers, environment variable names, or file paths.
- Documentation-only edits, README updates, and planning notes do not
  belong in the changelog.
- CI, test tooling, and refactor changes with no user-visible effect
  belong under `### Dev` only.
- Section headers per release: `### Added`, `### Changed`, `### Fixed`,
  `### Removed`, `### Dev`. Include only sections with entries.
- Keep each entry as short as possible — one sentence per change. Do
  not repeat information across entries. Avoid mentioning function names,
  file names, or internal identifiers.
- **Always add new entries to the `## [Unreleased]` section at the top
  of the file.** Never add entries inside a versioned section (e.g.
  `## v5.5.0`). If no `[Unreleased]` section exists, create one
  immediately after the file header.
- Never modify a versioned section that has already been released (i.e.
  one that has a date and a version number in its heading).
- When a release is made, the `[Unreleased]` heading is replaced with
  the new version heading (e.g. `## v5.5.0 (2026-05-21)`). Version
  choice: only `### Fixed` entries → patch bump; any `### Added` or
  `### Changed` entries → minor bump. Always check `package.json` for
  the current version before picking the new one.

## Commit Message Rules (AI agents must follow these)

This repository uses [Conventional Commits](https://www.conventionalcommits.org/).
Husky enforces this via a `commit-msg` hook running commitlint.

Format: `<type>(<optional scope>): <subject>`

Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`,
`perf`, `ci`, `revert`

Examples:

- `feat: add voice-note compact duration display`
- `fix: parse aria-labels without At prefix`
- `chore: release v5.5.0`
- `test: add parseAriaLabel calendar-date cases`
- `docs: update CONTRIBUTING with husky setup`

Rules:

- Subject is lowercase, no trailing period.
- Do not reference internal file names or function names in the subject.
- Breaking changes: add `!` after the type (e.g. `feat!: redesign
export format`) and describe in the commit body.

### Commit Style

- Tone: analytical yet concise. Active voice. Every sentence adds
  concrete information.
- Order: subject-verb-object. State what is true and why.
- Prefer direct words over inflated phrasing.

## Pre-Commit Checklist (AI agents must follow these)

Before running `git commit`, verify all items below. If any file changed,
update it first in the same session — never leave documentation, logging,
or tracing for a follow-up.

**Do not make standalone commits that only touch session logs or TODO
commit-hash references.** Batch them with the next substantive file
changes instead. A commit whose entire diff is just log lines or stale
hash updates adds noise to history — wait until you have real work to
commit and include those updates in the same commit.

- **Changelog** — Add entries to `CHANGELOG.md` under `## [Unreleased]`.
  Use the correct section (`### Added`, `### Changed`, `### Fixed`,
  `### Removed`, `### Dev`). See Changelog Rules above.
- **Session logs** — Add entries to both
  `project-logs/interaction-log.md` (detailed session record) and
  `project-logs/activity-log.md` (one-line activity summary).
- **Trace guidance** — Follow `project-prompts/trace-guidance.md`
  post-interaction and post-close save procedure.
- **Prompt files** — Review and update `project-prompts/` files to reflect
  any guidance, procedure, or pattern changes introduced this session.
- **Reference docs** — Review and update `docs/AI-interaction/` reference
  docs to capture durable patterns from this session (e.g. new block
  features, script additions, naming changes).
- **TODO files** — Sync `.TODO/TODO-done.md`, `.TODO/TODO-next.md`,
  `.TODO/TODO-future.md`, `.TODO/TODO-ignore.md`, or `.TODO/TODO-audit.md`
  as needed. `TODO-done.md` is append-only: preserve all existing entries and
  add new completed tasks only at the end of the appropriate section. Run
  `pnpm lint:todos` after metadata changes.

## Safe File-Handling Rules

These rules are mandatory to prevent data loss. Append-only history files
must never be rewritten in full.

- `CHANGELOG.md`, `project-logs/interaction-log.md`,
  `project-logs/activity-log.md`, and `.TODO/TODO-done.md` are
  **append-only**. Only add new entries at the top or in designated
  sections. Never delete, move, or rewrite existing historical entries.
- When asked to "update" an append-only file, assume **maximum safety** and
  **loss prevention**: add only; preserve all existing content exactly.
- **Never use full-file rewrites** (`write` tool) on append-only history
  files. Use the `edit` tool for targeted additions.
- Before editing, inspect the current and `HEAD` state with
  `git diff` or `git show HEAD:<file>` to establish the baseline.
- After editing, verify no existing entries were lost with
  `git diff HEAD -- <file>`. Only untouched history should appear in that
  diff; new additions will show as `+`.
- If any historical entry was removed or altered, immediately restore the
  file from `git show HEAD:<file>` and then append only the missing new
  entries with `edit`.
- If the user asks to add history, changelog entries, log entries, or
  TODO-completed entries, assert this rule explicitly: "I will append only,
  I will not rewrite existing entries."

## TODOs

AI agents keep regular `.TODO/` queue files synced:

- `.TODO/TODO-next.md`: declares prefix, next available T-number, and
  available gaps; read its header before adding tasks.
- `.TODO/TODO-done.md`: stores completed work with T-numbers.
- `.TODO/TODO-future.md`: holds valid deferred work as plain bullets
  (no T-numbers).
- `.TODO/TODO-ignore.md`: holds deliberate no-fix decisions with
  rationale as plain bullets (no T-numbers).
- `.TODO/TODO-audit.md`: holds repeatable hygiene checks.
- Write tasks as outcomes, not implementation. General but precise.
  Avoid tool names, version numbers, and internal paths.
  Example: "Keep build dependencies up to date" not "Update esbuild
  from 0.28.0 to 0.28.1".
- Run `pnpm lint:todos` after TODO metadata changes.

## Session Logs

AI agents maintain two session history files (hot files outside `docs/`):

- **`project-logs/interaction-log.md`** — reverse-chronological log of
  AI sessions. Each entry records date-time, exact user input, short AI
  response summary, and resulting commits. Add new entries at the top.
- **`project-logs/activity-log.md`** — reverse-chronological log of
  user requests, AI responses, and commits. Each entry is a standalone
  line: `date | user | <summary>`, `date | ai | <summary>`, or
  `date | commit <hash> | <subject>`. Update when adding significant
  new sessions.

## Progress

See `.TODO/` files for the full task queue:

- [TODO-done.md](.TODO/TODO-done.md) — completed tasks organised by
  category with commit references
- [TODO-next.md](.TODO/TODO-next.md) — active task queue
- [TODO-ignore.md](.TODO/TODO-ignore.md) — deliberate no-fix decisions
- [TODO-future.md](.TODO/TODO-future.md) — deferred work
- [TODO-audit.md](.TODO/TODO-audit.md) — repeatable hygiene checks

All tasks use the `T-NNN` convention declared in `.TODO/TODO-next.md`.
Categories are defined in `docs/developer-guide/todo-management.md`
and kept consistent across all TODO files.
Completed entries include a short commit hash reference where the work
was done.
