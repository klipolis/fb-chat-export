# TODO — Won't implement (by design)

Items considered and deliberately not implemented.
These are intentional design decisions, not omissions.

## Links

- [TODO-next.md](TODO-next.md)
- [TODO-done.md](TODO-done.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

- T112. **Additional reaction sample files** — The `reaction` rule's `matchLabel` already covers all common Facebook emoji reactions; separate raw HTML files for every emoji variant would expand snapshots without exercising new code paths.
- T113. **Like / reaction counts in summary** — The `reaction` type is excluded from `~ N text;`. A separate reaction counter is intentionally omitted to avoid complexity.
- T114. **Emoji content length** — Unicode emoji length reporting is an edge case; `reaction` remains in `noLengthTypes` and no char count is shown.
- T115. **Subresource Integrity (SRI) for the userscript** — There are no external `@require` dependencies, so SRI pinning is not applicable.
- T116. **`@updateURL` / `@downloadURL` header fields** — Auto-update links are intentionally omitted to avoid silent extension/script updates with DOM access.
- T117. **Deno migration** — This project remains Node-first because of pnpm, Husky, and esbuild dependencies.
- T118. **video-link duration from embed title** — YouTube embed titles are not reliable enough for duration extraction, so this is not planned.
