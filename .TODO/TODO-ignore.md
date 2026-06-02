# TODO — Won't implement (by design)

## Links

- [TODO-next.md](TODO-next.md)
- [TODO-done.md](TODO-done.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

- T112. **Additional reaction sample files** — The reaction detector already covers all common Facebook emoji reactions; adding a separate test file for every variant would grow the snapshot set without testing new logic.
- T113. **Like / reaction counts in summary** — Reactions are excluded from the text count by design. A separate reaction counter is not planned.
- T114. **Emoji content length** — Unicode emoji length reporting is an edge case. Reactions hide character counts and that is intentional.
- T115. **Subresource Integrity (SRI) for the userscript** — No external scripts are loaded via `@require`, so SRI has nothing to pin.
- T116. **Auto-update fields in the userscript header** — Automatic extension updates are intentionally skipped to avoid silent DOM-accessing script changes.
- T117. **Deno migration** — The project stays Node-first because of its pnpm, Husky, and esbuild toolchain.
- T118. **video-link duration from embed title** — YouTube embed titles are too unreliable for duration extraction, so this is not planned.
