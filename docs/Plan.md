# Modern AI Plan

## Goal

- Keep Messenger exports deterministic, schema-driven, and identical across server and bundled userscript outputs.

## Current focus

- Stabilize TXT summary schema and keep counts consistent between total and per-person summaries.
- Keep frontend and server export behavior synchronized through shared modules.
- Maintain high-confidence release flow with generated artifact validation.

## Active checklist

- [x] Shared summary logic reused by server and userscript.
- [x] Schema-driven TXT summary concepts.
- [x] Per-person exclusion rules for deleted/unsent and missed calls.
- [x] Download anti-double-click guard in frontend.
- [ ] Add focused snapshot tests for final TXT content blocks.
- [ ] Add CI check for changelog entry requirement on export-schema changes.

## Risks

- Drift between docs and effective schema rules.
- Runtime coupling to test-owned schema files.
- Accidental format regressions from small wording changes.

## Next steps

1. Move shared TXT schema concepts into `src/shared/export-config.json` and let tests import from runtime config.
2. Add golden snapshot tests for `content-on` and `content-off` summary/body sections.
3. Add CI workflow gate to validate changelog + schema + dist version sync.

## Done recently

- Added frontend-local build entry (`src/frontend/build-frontend.js`).
- Unified summary generation through shared logic for server and userscript.
- Updated anonymized self output to `Youghurt`.
- Updated summary counts and call aggregation rules.
