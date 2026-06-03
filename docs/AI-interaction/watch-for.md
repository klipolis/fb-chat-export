# What to Watch for Going Forward

- **Co-located duplication**: adjacent files in `src/shared/` can contain copy-pasted logic without anyone noticing during normal development. A structured deduplication review for each new feature flag would help.
- **Behavioral drift between server and frontend**: when the same concept (alias replacement, URL stripping, content classification) has independent implementations, they develop different edge-case behavior. Shared code in `src/shared/` should be the default, not the exception.
- **Error handling normalization**: a single bare `catch {}` in one module makes it the local convention. Review all `catch` blocks as a batch when touching a file.
- **Validation gaps from hardcoded generation**: any file produced by `build-server.cjs` that isn't declared in `export-config.json` is invisible to schema validation. Cross-check after every server change.
