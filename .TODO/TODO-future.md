# TODO — Future tasks

Items that are worth doing but require new sample files, significant new scope, or external dependencies not yet available.
Active next tasks are tracked in [TODO-next.md](TODO-next.md).

## Links

- [TODO-next.md](TODO-next.md)
- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [.todo/config.json](../.todo/config.json)

---

- T108. **Sticker and GIF raw samples** — Add `sticker.html` and `gif.html` raw input files so the build-server rules and golden snapshots can be verified for sticker/gif classification.
- T109. **video-link: additional platforms** — Extend `matchLabel` to cover TikTok, Instagram Reels, and similar video-hosting URLs for browser export classification.
- T110. **voice-note: content text language** — When richer FB UI transcript data is available, replace the current fallback `"voice note"` content with the actual note text.
- T111. **Reaction emoji content extraction** — Verify whether `<img alt="[emoji]">` alt text can be preserved in optimized HTML and used in `data_preview` when richer reaction content is desired.
