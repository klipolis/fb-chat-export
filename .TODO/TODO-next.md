# TODO — Next tasks

Process note: use T-prefixed IDs from `.todo/config.json`, keep one task per bullet, group tasks by canonical category (see categories in config.json), and write task descriptions that describe the desired outcome rather than a specific tool or implementation.

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---


## Build / CI

- T-245. Add worker_threads availability check fallback so the build function returns a promise-based alias+optimize path when workers are unavailable (e.g., older Node versions).
- T-255. Add CI step to validate dist/app.js bundle syntax before release.




