# Recurring Problems

- **Duplicate utility functions drift apart silently**. Functions like `escapeRegExp`, `replaceWholeWord`, `parseReferenceDate`, `findMatchingClosingTag`, and `stripTrackingParams` were copy-pasted with behavioral differences between copies. A periodic deduplication scan catches this before inconsistency reaches users.
- **Hardcoded normalization overrides user config**. Any hardcoded string replacement in alias or content logic (e.g., `"Yoghurt"` → `"Youghurt"`) silently overrides user-configured aliases and creates inconsistency between server and frontend paths.
- **Unhandled promise rejections in browser code crash the script**. Re-throwing inside `setTimeout` callbacks escapes as unhandled rejections. UI error handlers should reset state gracefully instead.
- **Export variants get added to the server but not to config**. When `build-server.cjs` hardcodes new variants, the config and schema files lag behind, creating a gap between what's generated and what's validated.
