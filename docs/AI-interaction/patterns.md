# Patterns to Follow

- **Config is the source of truth, not code**. Every output file the server generates must appear in config so that validation covers all variants, not just the ones a particular test checks.
- **One canonical validation mechanism per output format**. Dual validation paths (golden snapshots + schema validation) diverge over time. Choose one per format and make it authoritative.
- **Bare `catch {}` is a project-wide decision**. Silent fallback is appropriate only when failure is truly harmless (e.g., optional config file missing). Otherwise log the error. Decide once, enforce consistently.
- **Test artifacts must always be cleaned up**, especially when they modify tracked directories. Use `t.teardown()`.
- **TODO files are code**. Treat stale entries, duplicate IDs, and lint failures as bugs. Run TODO lint after every change.
- **Deterministic logic is the source of truth for metrics**. Application code and config produce metrics, not AI guesses. Never invent numbers.
- **`.aiignore` must stay in sync with `.gitignore`**. Every new generated or sensitive path should be considered for both files. Run a periodic cross-check.
- **`ai-chat-behavior.config.ts` drives agent behavior, not AGENTS.md**. The config file owns machine-readable rules; AGENTS.md owns human-facing instructions. Keep both updated.
- **Build cache decisions use deterministic file states**. Compare mtime and size from cached state against current filesystem state. Never guess or infer whether a file changed. The cache manifest is the single source of truth for rebuild decisions.
- **Parallel worker pool processes files concurrently with bounded concurrency**. Use `worker_threads` with a pool size equal to available CPU cores. Each worker is self-contained: no shared state between workers, all data passed via `workerData`. Error isolation matters — a single worker crash must not hang the pool.
- **Post-interaction saves record work to AI interaction docs**. After each session, add a new entry to `interaction-log.md` (exact user input, AI summary, commits), update relevant guidance and patterns, and keep `activity-log.md` current.
- **Post-close saves record session outcomes for continuity**. Update `interaction-log.md` with the final session entry (exact user input, AI summary, commit references). Update `activity-log.md` if the activity log is outdated.
