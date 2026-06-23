# TODO — Won't implement (by design)

Process instructions: fetch T-number from `.todo/config.json` before adding tasks. One task per bullet. Group by canonical categories. Keep T-numbers stable when moving tasks.

## Build / CI

- no tasks

## Test coverage

- no tasks

## Documentation

- no tasks

## Refactoring

- no tasks

## Schema & config

- no tasks

## Export format

- no tasks

## Message type detection

- no tasks

## Content extraction

- no tasks

## Alias / Anonymisation

- no tasks

## Frontend

- **Auto-scan on panel open** — the `autoScanChk` checkbox and auto-trigger (`setTimeout(() => actionBtn.click(), 100)`) have been removed from the browser export panel. The auto-scan feature launched the export scan immediately when the panel opened, which interfered with manual setup (choosing dates, aliases, filters). Users now always start a scan explicitly via the scan button.

## Cleanup

- no tasks

## Process

- **Additional reaction sample files** — The reaction detector already covers all common Facebook emoji reactions; adding a separate test file for every variant would grow the snapshot set without testing new logic.
- **Like / reaction counts in summary** — Reactions are excluded from the text count by design. A separate reaction counter is not planned.
- **Emoji content length** — Unicode emoji length reporting is an edge case. Reactions hide character counts and that is intentional.
- **Subresource Integrity (SRI) for the userscript** — No external scripts are loaded via `@require`, so SRI has nothing to pin.
- **Auto-update fields in the userscript header** — Automatic extension updates are intentionally skipped to avoid silent DOM-accessing script changes.
- **Deno migration** — The project stays Node-first because of its pnpm, Husky, and esbuild toolchain.
- **video-link duration from embed title** — YouTube embed titles are too unreliable for duration extraction, so this is not planned.
- T-1 through T-43. Never created — the formal task numbering system started at T-44 (retroactive labels for work completed before the system existed). These slots remain permanently unused to avoid renumbering existing entries.
- T-107, T-108. Never assigned — numbering jumped from T-106 directly to T-109 during a renumbering pass. These slots remain permanently unused.
- Never assigned — numbering jumped from T-143 directly to T-145 during a renumbering pass. This slot remains permanently unused.
- Add code owners file to clearly define responsibility for different parts of the codebase.
- Add a second workflow for release or artifact publishing.
- **Tests for CI userscript validation** — The userscript bundle (dist/app.js) is already validated by validate-dist in the CI pipeline. Adding separate unit tests for CI step behaviour would test GitHub Actions internals, not application code.
- **Inline documentation in shared modules** — Permanently blocked by AGENTS.md rule: "DO NOT ADD ANY COMMENTS unless asked". Inline docs would violate this rule. Consider removing the AGENTS.md restriction first.
- **JSDoc comments** — Permanently blocked by AGENTS.md no-comment rule for the same reason as T-206.
- Add tests for release/publishing workflow to ensure proper artifact generation.
- worker_threads availability check fallback — Removed since Node >=26.0.0 is now required; fallback code is no longer needed.
- Test for empty input directory — Already validated in build-server.cjs (lines 392-409) and tested as part of build failure handling.
- Add pnpm run audit:todos command that maps TODO tasks to open GitHub issues so task provenance stays traceable.

- Improve pinned-location detection to match labels like "Sent a pin" without requiring the phrase "pinned location" in the aria-label.
