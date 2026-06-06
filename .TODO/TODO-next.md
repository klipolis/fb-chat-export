# TODO — Next tasks

Process note: use T-prefixed IDs from `.todo/config.json`, keep one task per bullet, group tasks by canonical category (see categories in config.json), and write task descriptions that describe the desired outcome rather than a specific tool or implementation.

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

## Build / CI

- T-276. Add CLI argument parsing to build-server.cjs — replace BUILD_RAW and BUILD_REFERENCE_DATE env vars with --raw and --reference-date flags
- T-277. Refactor processFilesInParallel in build-server.cjs to use shared worker-pool.js module

## Stability

- T-278. Add top-level error handler to build-raw-clean.cjs — wrap main() call in try-catch to prevent raw stack traces on failure

## Documentation

- *(No pending Documentation tasks)*

## Cleanup

- *(No pending Cleanup tasks)*