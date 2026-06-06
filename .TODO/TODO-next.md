# TODO — Next tasks

Process note: use T-prefixed IDs from `.todo/config.json`, keep one task per bullet, group tasks by canonical category (see categories in config.json), and write task descriptions that describe the desired outcome rather than a specific tool or implementation.

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

## Build / CI

- T-266. Add graceful worker pool shutdown on SIGINT/SIGTERM — terminate active workers instead of leaving orphans

## Stability

- T-269. Add top-level catch-all to build-raw-clean.cjs main() call — currently throws raw Node stack trace on unhandled error

## Refactoring

- *(No pending refactoring tasks)*

## Test coverage

- *(No pending test tasks)*




