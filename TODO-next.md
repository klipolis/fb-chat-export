# TODO — Next tasks

Tasks grouped by area. Each is self-contained and can be instructed individually.
Completed tasks are tracked in [TODO-done.md](TODO-done.md).
Items that were considered and deliberately not implemented are listed in the **Won't implement** section of [TODO-done.md](TODO-done.md) — these are intentional design decisions, not omissions.

---

## Anonymisation

## Message types

- **Voice-note filename vs type name** — The raw sample is named `voice-note.html` but the classified type is `voice-message`. Aligning them would reduce confusion in golden snapshots and the message-types header.
- **video-link: duration from embed title** — The YouTube embed card includes a video title in the raw HTML. Future work could extract that title as additional display context, or extract duration from a timer if present.
- **video-link: additional platforms** — The current `matchLabel` covers YouTube and Vimeo. Extending to TikTok (`tiktok.com/`), Instagram Reels (`instagram.com/reel/`), etc. would improve browser-path classification when a plain video URL is pasted.

## Test coverage

- **Reaction emoji content extraction** — Verify that the `<img alt="[emoji]">` alt text is accessible from the optimised HTML if richer display content is ever needed in `data_preview`.
- **Content-off export: reactions** — Add an assertion that reaction lines appear in content-off output without content, since `formatLine` only outputs content for `text`, `link`, and `video-link` types.
- **video-link in text export** — Add an assertion that the YouTube URL appears after `/` in the content-on TXT export line for `video-link.html`.

---

## Future (explicit tasks — require new sample files)

42. **Sticker and GIF raw samples** — There are no `sticker.html` or `gif.html` files in `demo/input-html-raw`. Adding them would exercise the sticker/gif rules under the build-server path and extend golden-snapshot coverage.

