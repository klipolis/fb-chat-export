# TODO — Future tasks

Items that are worth doing but require new sample files, significant new scope, or external dependencies not yet available.
Active next tasks are tracked in [TODO-next.md](TODO-next.md).

---

42. **Sticker and GIF raw samples** — There are no `sticker.html` or `gif.html` files in `dataset/input-html-raw`. Adding them would exercise the sticker/gif rules under the build-server path and extend golden-snapshot coverage.

**video-link: additional platforms** — The current `matchLabel` covers YouTube and Vimeo. Extending to TikTok (`tiktok.com/`), Instagram Reels (`instagram.com/reel/`), etc. would improve browser-path classification when a plain video URL is pasted.

**voice-note: content text language** — The export content is now `"voice note"` matching the type. If the FB UI label ever includes the actual note transcript or title, that richer text could replace the fallback.

**Reaction emoji content extraction** — Verify that the `<img alt="[emoji]">` alt text is accessible from the optimised HTML if richer display content is ever needed in `data_preview`.
