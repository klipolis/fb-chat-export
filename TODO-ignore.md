# TODO — Won't implement (by design)

Items considered and deliberately not implemented.
These are intentional design decisions, not omissions.

---

46. **Additional reaction sample files** — The `reaction` rule's `matchLabel` already covers all common Facebook emoji reactions. Adding a separate raw HTML file for each emoji variant would expand the golden snapshot set without exercising any new code paths; the existing `reaction.html` is sufficient for rule verification.

41. **Like / reaction counts in summary** — The `reaction` type is excluded from `~ N text;`. A separate summary counter adds complexity for emoji reactions; they are intentionally omitted from the summary body.

43. **Emoji content length** — The `reaction` type is in `noLengthTypes` so no char count is shown. Unicode code-point reporting for other emoji in text messages is an edge case not worth the added complexity.

40. **Subresource Integrity (SRI) for the userscript** — The userscript has no external `@require` dependencies, so there is nothing to pin with SRI.

50. **`@updateURL` / `@downloadURL` header fields** — Auto-update links are deliberately omitted. Users install from a known URL; silent auto-update without explicit user review is undesirable for a script with DOM access.

**video-link: duration from embed title** — YouTube embed card titles vary in format and are not a reliable source for duration metadata. Duration extraction for video-link entries is not planned.
