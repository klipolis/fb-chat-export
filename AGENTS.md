# Agents

This guide gives AI agents project-specific operating instructions.

## Before Starting

Read these first:
- This file (AGENTS.md)
- `ai-chat-behavior.config.ts`
- `kilo.json` (when using Kilo)

## Files to Ignore

Add files with raw prompts, keys, or sensitive user data to `.aiignore` so they're never sent to AI.

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
- Never edit output in `dist/` or `data-output-auto/` unless making production bundle artifacts.
- Use existing components, helpers, and patterns before adding new abstractions.
- Remove sensitive data from AI context before sending to any cloud vendor.
- Use direct current-state language in all text files. Describe current behavior and current rules,
  not past states, removed options, speculative possibilities, or future blockages. Mention past or
  future states only when the detail prevents a concrete risk.
- Prefer the shared code in `src/shared/` before duplicating logic in server or frontend paths.

## Script Rules

- ESM for source-side maintenance scripts (package is `type: module`).
- CommonJS for build scripts (`*.cjs`), deployment helpers, and tooling entry points that need `require()`.
- Use `scripts/lib/app-config.js` from ESM scripts and `scripts/lib/app-config.cjs` from CommonJS.

## Agent-Specific

### OpenCode (this CLI)

- Configured via `.opencode.json` at repo root.
- Reads `AGENTS.md` for instructions.
- Respects `.aiignore` for sensitive/ignored paths.
- Never reads `dist/`, `.git/`, or `node_modules/`.

### Kilo

- Configured via `kilo.json` at repo root for agent, command, permissions.
- New commands: `.kilo/command/*.md`; new agents: `.kilo/agent/*.md`.
- Respects `.aiignore` (also reads `.codexignore` if present).
- Never reads `dist/`, `.git/`, or `node_modules/`.

### Other AI Coding Agents

- Follow `ai-chat-behavior.config.ts` for communication style and project behavior.
- Respect `.aiignore` for sensitive/ignored paths.
- Respect `.gitignore` before reading source.
- Never read `dist/`, `.git/`, or `node_modules/`.
- Update `project-prompts/` (hot AI prompt files) after every prompt or guidance change.
- Update `docs/AI-interaction/` (reference docs) after every durable AI instruction change, including user guidance,
  AI-agent guidance, prompt style, text-language rules, and bookkeeping guidance.

## AI Behavior

- Deterministic application logic is the source of truth for all metrics.
- AI must explain verified data, never invent metrics.
- Log failures enough to debug without leaking prompts or data.
- If required data is missing, state what is missing and offer next steps.

## When You See These Patterns

- Use `const` and narrow helpers over mutable shared state.
- Keep server work in `src/server/` build scripts.
- Keep frontend code in `src/frontend/` focused on browser export UI.
- Handle failed requests with user-facing errors, not silent failures.
- Avoid ad hoc string parsing — use schema validation (`tests/generated-txt-schema.json`) instead.

## Output Verbosity

- Keep screen output tight. Do not echo code that can be seen via git diff. Summarise changes in 1–3 lines instead.
- Skip explanatory preamble/postamble. Give the answer directly.
- Tool calls (reads, writes, edits) already show file paths and line numbers — do not repeat that info in prose.

## Changelog Rules (AI agents must follow these)

When writing or editing `CHANGELOG.md`:

- Every entry must describe an **active change** — something added, fixed, changed, or removed in that release. Never write entries that only describe what was retained, preserved, or left unchanged.
- Use plain, user-facing language. Active voice: "Exports include attachments" not "Attachment export support has been added".
- Describe what the user observes or benefits from. Do not mention internal identifiers, environment variable names, or file paths.
- Documentation-only edits, README updates, and planning notes do not belong in the changelog.
- CI, test tooling, and refactor changes with no user-visible effect belong under `### Dev` only.
- Section headers per release: `### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Dev`. Include only sections with entries.
- Keep each entry as short as possible — one sentence per change. Do not repeat information across entries. Avoid mentioning function names, file names, or internal identifiers.
- **Always add new entries to the `## [Unreleased]` section at the top of the file.** Never add entries inside a versioned section (e.g. `## v5.5.0`). If no `[Unreleased]` section exists, create one immediately after the file header.
- Never modify a versioned section that has already been released (i.e. one that has a date and a version number in its heading).
- When a release is made, the `[Unreleased]` heading is replaced with the new version heading (e.g. `## v5.5.0 (2026-05-21)`). Version choice: only `### Fixed` entries → patch bump; any `### Added` or `### Changed` entries → minor bump. Always check `package.json` for the current version before picking the new one.

## Commit Message Rules (AI agents must follow these)

This repository uses [Conventional Commits](https://www.conventionalcommits.org/). Husky enforces this via a `commit-msg` hook running commitlint.

Format: `<type>(<optional scope>): <subject>`

Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`, `revert`

Examples:
- `feat: add voice-note compact duration display`
- `fix: parse aria-labels without At prefix`
- `chore: release v5.5.0`
- `test: add parseAriaLabel calendar-date cases`
- `docs: update CONTRIBUTING with husky setup`

Rules:
- Subject is lowercase, no trailing period.
- Do not reference internal file names or function names in the subject.
- Breaking changes: add `!` after the type (e.g. `feat!: redesign export format`) and describe in the commit body.

### Commit Style

- Tone: analytical yet concise. Active voice. Every sentence adds concrete information.
- Order: subject-verb-object. State what is true and why.
- Prefer direct words over inflated phrasing.

## TODOs

AI agents keep regular `.TODO/` queue files synced:
- `.TODO/config.json`: owns metadata; read `nextTaskNumber` before adding; use `T-` prefix; increment after assigning.
- `.TODO/TODO-next.md`: active queue; add confirmed work here before start; one `T-` task per bullet.
- `.TODO/TODO-done.md`: stores completed work.
- `.TODO/TODO-future.md`: holds valid deferred work.
- `.TODO/TODO-ignore.md`: holds deliberate no-fix decisions with rationale.
- Run `pnpm lint:todos` after TODO metadata changes.

## Session Logs

AI agents maintain two session history files (hot files outside `docs/`):

- **`project-logs/interaction-log.md`** — reverse-chronological log of AI sessions. Each entry records date-time, exact user input, short AI response summary, and resulting commits. Add new entries at the top.
- **`project-logs/activity-log.md`** — reverse-chronological log of user requests, AI responses, and commits. Each entry is a standalone line: `date | (user) | <summary>`, `date | (ai) | <summary>`, or `date | (commit <hash>) | <subject>`. Update when adding significant new sessions.

## Progress

See `.TODO/` files for the full task queue:
- [TODO-done.md](.TODO/TODO-done.md) — completed tasks organised by category with commit references
- [TODO-next.md](.TODO/TODO-next.md) — active task queue
- [TODO-ignore.md](.TODO/TODO-ignore.md) — deliberate no-fix decisions
- [TODO-future.md](.TODO/TODO-future.md) — deferred work

All tasks use the `T-NNN` convention from `.todo/config.json`. Categories are defined in `config.json` and kept consistent across all TODO files. Completed entries include a short commit hash reference where the work was done.
