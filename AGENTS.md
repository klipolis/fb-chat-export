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
- Update `docs/AI-interaction/` after every durable AI instruction change, including user guidance,
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

## Progress

### Done

- T-200. Added Unicode name recognition tests (15 isValidSender assertions with Latin-extended/Cyrillic/CJK/Arabic, 10 parseAriaLabel assertions with Unicode senders, normalizeLabel Unicode preservation test)
- T-201. Added word count consistency test (30 assertions) verifying same totals across formatLine, buildEntryFromEntry, buildSummary (text), and buildSummaryJson (JSON) for all message types
- T-202. Added Unicode sender + image pipeline tests (buildEntryFromEntry with Ötves Ernő image, extractMessageEntry DOM pipeline with Álvaro/王明 image entries)
- T-203. Voice note duration consistency test (12 assertions) for extractRawDuration → normalizeDuration pipeline
- T-204. Duration edge case tests (26 assertions) for malformed/invalid/zero/negative durations in both extractRawDuration and normalizeDuration
- T-205. Alias name mapping tests using actual configured pairs: Rob→Barnabas, You→Youghurt, any→XYZ in both aliasChatNames and applyAliasToText
- T-199. Split `tests/test-other.js` (469 lines, 14 subtests, 496 assertions) into three focused per-module test files: `tests/test-dom-pipeline.js` (5 subtests, DOM export pipeline), `tests/test-preview-nodes.js` (7 subtests, preview node generation/schema), `tests/test-frontend-build.js` (2 subtests, frontend build/date parsing)
- T-210. Updated stale `src/frontend/builds.js` references to `build.cjs` across `docs/developer-guide/` files
- T-211. Updated `docs/developer-guide/tech.md` to list all six TXT export variants (was only listing two in that file)
- T-212. Changed `length chars` to `length words` in 4 doc files (`docs/user-guide/README.md`, `docs/developer-guide/tech.md`, `docs/developer-guide/project-overview.md`, `docs/README.md`)
- T-214. Optimized image detection in `create-nodes.js` with early `<img>` tag check to skip matchAll pipeline for segments without images
- T-224. Added unit tests for `formatDurationSeconds`, `durationToMinutes`, `durationToSeconds` (24 assertions)
- Test count: 1006 total assertions (was 982, previously 810)
- Fixed `.todo/config.json` taskIdPattern from `^T\\d{2,}$` to `^T-\\d{2,}$` to match T-prefix format
- All completed test tasks moved from TODO-next.md to TODO-done.md

### Next Steps

- T-206–T-209. Documentation updates (inline docs, developer guide, JSDoc, input HTML format)
- T-219–T-221. Shared code consolidation (duration utilities, HTML sanitization, constants module)
- T-213, T-215–T-218. Build improvements (schema validation done, incremental builds, parallel processing, artifact size, cache mechanism)
- T-222. CI/CD workflows (userscript test step)
- T-225–T-231. Test coverage (HTML utils, constants, schema validation, incremental, parallel, cache, CI)
- T-233, T-235–T-237. Process improvements (deps, contributing guidelines, issue templates, semver automation)
