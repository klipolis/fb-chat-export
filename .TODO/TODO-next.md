# TODO — Next tasks

Process instructions: fetch T-number from `.todo/config.json` before adding tasks. One task per bullet. Group by canonical categories. Keep T-numbers stable when moving tasks.

--

## Build / CI

- T-379. Add `build:watch` mode that rebuilds only when input HTML or config changes, using the existing cache manifest to skip unchanged files.

## Test coverage

- T-380. Add regression test for browser cache with pinned-location messages — verify cached reuse preserves content type through alias-only rescans.

## Documentation

- T-381. Document data-config/frontend_shared.json alias and duration fields so contributors can extend message types without guessing keys.

## Refactoring

- T-382. Consolidate duplicate duration parsing in src/shared/duration-utils.js and src/shared/export-json.js into a single shared parser.

## Schema & config

- T-383. Align tests/generated-txt-schema.json with src/shared/export-config.json so exported TXT file headers match schema expectations.

## Export format

- T-384. Support includeRepliedText option in export config so callers can toggle quoted-reply inclusion in raw date variant exports.

## Message type detection

- T-385. Improve pinned-location detection to match labels like "Sent a pin" without requiring the phrase "pinned location" in the aria-label.

## Content extraction

- T-386. Add fallback extraction for replied-to content from Twitter/Facebook quote blocks with blockquote plus hidden data-text markers.

## Alias / Anonymisation

- T-387. Add user-configurable alias priority order so explicit mappings override auto-detected names without requiring manual deletion.

## Cleanup

- T-388. Remove stale src/shared/metadata-generated/metadata.json regeneration from build pipeline — cache manifest already tracks file mtimes.

## Process

## Frontend

- T-377. Align browser summary duration handling with server path by deriving callSeconds from entry.duration before buildSummary runs.
- T-378. Add unit test verifying browser summary callSeconds matches server build for audio/video call fixtures.
- no tasks

