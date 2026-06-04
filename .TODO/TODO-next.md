# TODO — Next tasks

Process note: use T-prefixed IDs from `.todo/config.json`, keep one task per bullet, group tasks by canonical category (see categories in config.json), and write task descriptions that describe the desired outcome rather than a specific tool or implementation.

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

## Build / CI

- T-215. Add support for incremental builds by tracking file modification times and only rebuilding changed components.
- T-216. Implement parallel processing in the build server to utilize multiple CPU cores for faster HTML optimization and JSON generation.
- T-218. Create a build cache mechanism to avoid reprocessing unchanged files during development iterations.
- T-222. Add a GitHub Action test step for the generated userscript bundle contents.

## Documentation

- T-206. Add comprehensive inline documentation to complex utility functions in shared modules explaining their purpose, parameters, and return values.
- T-208. Add JSDoc comments to all public functions in shared modules to enable IDE autocomplete and type checking.

## Test coverage

- T-228. Add tests for incremental build functionality to ensure only changed files are processed.
- T-229. Add tests for parallel processing in the build server to verify correct utilization of CPU cores.
- T-230. Add tests for build cache mechanism to verify it correctly avoids reprocessing unchanged files.
- T-231. Add tests for GitHub Action validation of userscript bundle contents.




