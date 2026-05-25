# TODO — Next tasks

Get T-number (task number) from .todo/config file before adding new tasks.

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

- T119. Consolidate shared runtime config in `data-config/frontend_shared.json` with alias mappings and relative date rules.
- T120. Add `data-config/server.json` with `overwriteToday` support for deterministic server builds.
- T121. Source relative date parsing rules from shared config in both frontend and server code.
- T122. Add browser panel alias-row validation, custom filename input, and session persistence.
- T123. Extend integration tests to cover alias replacement inside exported text and stable filename behavior.
- T124. Document the TXT export header format, option state, and alias map behavior for end users.
- T125. Review developer documentation for `data-config/frontend_shared.json` and `data-config/server.json`.
- T126. Run `pnpm run lint` and fix reported lint issues; add autofix where safe.
- T127. Add `scripts/lint-fix.sh` or an npm script to run ESLint `--fix` and Prettier for easy self-healing fixes.
