# TODO — Future tasks

## Links

- [TODO-next.md](TODO-next.md)
- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [.todo/config.json](../.todo/config.json)

---

## Build / CI

- T-266. Add graceful worker pool shutdown on SIGINT/SIGTERM — terminate active workers instead of leaving orphans
- T-267. Add stale export file cleanup when input files are deleted — currently only cleans optimized-html and json-format dirs
- T-268. Accept build options via CLI arguments (e.g. --raw, --reference-date) instead of environment variables

## Stability

- T-269. Add top-level catch-all to build-raw-clean.cjs main() call — currently throws raw Node stack trace on unhandled error
- T-270. Consolidate duplicate try-catch for normalizeDateToIso in export-text.js and export-formatter.js into a shared helper

## Refactoring

- T-271. Extract worker pool logic from processFilesInParallel into reusable shared helper
- T-272. Deduplicate HTML cleaning logic between build-raw-clean.cjs and optimize-html.js

## Test coverage

- T-273. Add test for worker pool error isolation — verify one failing worker doesn't hang the pool
