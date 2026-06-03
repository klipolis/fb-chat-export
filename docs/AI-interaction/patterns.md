# Patterns to Follow

- **Config is the source of truth, not code**. Every output file the server generates must appear in config so that validation covers all variants, not just the ones a particular test checks.
- **One canonical validation mechanism per output format**. Dual validation paths (golden snapshots + schema validation) diverge over time. Choose one per format and make it authoritative.
- **Bare `catch {}` is a project-wide decision**. Silent fallback is appropriate only when failure is truly harmless (e.g., optional config file missing). Otherwise log the error. Decide once, enforce consistently.
- **Test artifacts must always be cleaned up**, especially when they modify tracked directories. Use `t.teardown()`.
- **TODO files are code**. Treat stale entries, duplicate IDs, and lint failures as bugs. Run TODO lint after every change.
- **Deterministic logic is the source of truth for metrics**. Application code and config produce metrics, not AI guesses. Never invent numbers.
- **`.aiignore` must stay in sync with `.gitignore`**. Every new generated or sensitive path should be considered for both files. Run a periodic cross-check.
- **`ai-chat-behavior.config.ts` drives agent behavior, not AGENTS.md**. The config file owns machine-readable rules; AGENTS.md owns human-facing instructions. Keep both updated.
