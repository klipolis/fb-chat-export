# TODO — Next tasks

Process note: use T-prefixed IDs from `.todo/config.json`, keep one task per bullet, group tasks by canonical category (see categories in config.json), and write task descriptions that describe the desired outcome rather than a specific tool or implementation.

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

## Documentation

- T-239. Document incremental build and partial rebuild in developer guide covering cache manifest, changed-file detection, and stale output cleanup.
- T-240. Document parallel worker pool architecture in developer guide covering threading model, worker data flow, and error handling.
- T-241. Update AI-interaction patterns and watch-for guidance with parallel build and cache patterns.

## Cleanup

- T-242. Remove _debug_build.cjs and _speed.cjs from version control — debug utilities that belonged in .gitignore.
- T-243. Add data-output-auto/build-cache.json to .gitignore — generated cache state that should not be tracked.

## Test coverage

- T-244. Add tests for create-nodes.js onlyFiles option to verify filtered processing skips unchanged files during partial rebuild.

## Build / CI

- T-245. Add worker_threads availability check fallback so the build function returns a promise-based alias+optimize path when workers are unavailable (e.g., older Node versions).




