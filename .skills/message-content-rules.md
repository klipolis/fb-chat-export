# Message Content Rules

This file documents the developer-facing rules that map raw Messenger HTML into end-user exports. It is intentionally separate from setup and product requirements because it describes implementation behavior, not user-facing features.

## Scope
- Raw HTML in `demo/input-html-raw/` is the source of truth.
- Message rules map each raw file name to one primary message type.
- Shared helpers convert the raw content into both JSON preview files and TXT exports.
- The same semantic rules should be used by server and frontend build paths where possible.
- Frontend bundle mode must apply equivalent rules without relying on server-only file-name context.

## Message Type Mapping
- File-name rules are the first-class classifier.
- Each raw file should resolve to a stable message type defined in `src/shared/rules/message-rules.js`.
- Heuristics may support parsing, but file rules should win when a file name clearly identifies the message type.
- The message type in JSON and TXT must reflect the raw file category, not a later visual guess.
- When a specific aria-label rule matches (anything other than the catch-all text fallback), the type is locked and heuristic overrides are skipped (`labelTypeLocked`). This applies in the frontend where no filename is available.
- Missed-call label rules (`/missed[\s-]*(?:audio\s+|video\s+)?call/i`) appear before audio-call in the rule list to prevent "Missed audio call" from matching the audio-call rule first.
- The `reaction` rule's `matchFile` covers `reaction.html` and `reaction-emoji.html`. Its `matchLabel` uses a Unicode property escape (`\p{Extended_Pictographic}` with `/u` flag) to match any aria-label that ends with `: [emoji]`, handling both SVG-icon and `<img alt="...">` reaction variants.
- The `video-link` rule's `matchFile` covers `video-link.html`. Its `matchLabel` matches `youtube.com/`, `youtu.be/`, and `vimeo.com/` for the browser path. The rule appears before the generic `link` rules so it takes priority. The HTML optimiser preserves plain URL text inside `<a>` tags (rather than replacing them with empty `<a></a>`) so the message wrapper survives `removeEmptyChildren`. Content is the resolved URL; no length or duration.

## Name Extraction Rules
- Prefer the sender parsed from `aria-label`.
- Do not use message body text as the sender unless parsing fails and the text is clearly a sender token.
- Sender names should be human-readable text, not numeric fragments.
- Names containing numbers should be treated as invalid sender candidates unless the raw label clearly proves they are a real sender.
- Anonymization should replace confirmed names only, and should not rewrite message content or dates.
- For dash-form labels, keep conversational leading tokens (for example `Yep`) in message text rather than appending them to sender names.

## Content Rules
- text should preserve readable end-user content.
- Link messages should emit canonical URL content when available; fall back to `link` only when no URL can be resolved.
- Pinned-location link previews without direct `href` should emit a canonical maps search URL derived from the location text.
- Redirected Facebook/Messenger links should be decoded to original target URLs using known redirect query parameters when available.
- Link previews must keep `content_link` in JSON and must not invent a content length.
- Image, deleted/unsent, and missed-call items should avoid unnecessary content text when the format does not require it.
- Reply messages can be classified as text in exports even when the raw HTML contains reply structure.

## Duration Rules
- Timed message types should carry a normalized duration when a timer or equivalent raw metadata is present.
- Duration values should be written in minute-based text such as `18 mins` or `0:20 mins`.
- Do not infer duration from arbitrary message body text unless the raw DOM contains a timer or explicit duration metadata.
- Missed-call items should not fabricate a duration field.

## Length Rules
- text may expose a character length.
- Audio, video, voice, image, link, deleted, and missed-call exports should omit length unless a specific rule says otherwise.
- Length should never override the primary content meaning.

## TXT Export Rules
- TXT exports have two modes:
- `content-on`: show content when allowed by the export mode.
- `content-off`: suppress the trailing content section.
- For link message types in `content-on`, output the URL content after `/`.
- The plain line format should be easy to scan by developers and reviewers.
- Summary sections should be schema-driven from `tests/generated-txt-schema.json` and end with `---`.
- Summary heading should use `Total Summary`.
- Rough count lines should use `~` prefixed list items.
- Top-level rough counts should equal the sum of person-summary rough counts.
- A summary section is generated for every participant present in the export; there is no cap on the number of participants.
- Person summary totals should exclude `deleted/unsent` and missed call message types.
- Only `image` type counts as an image in the summary; `sticker` and `gif` count toward the text total (treated the same as `reaction`).
- Call counts in summaries should include audio/video and voice note/message entries, excluding missed calls.
- Summary count lines should not use a `Total:` prefix.

## JSON Export Rules
- Generated JSON should stay flat and simple to consume.
- Top-level fields on every preview JSON file: `html_locale` (string or null), `title` (string), `type` (string, primary semantic type).
- `data_raw` captures values as extracted from the HTML: `date`, `content` (null for reaction), `duration` (raw value or null), `length` (always null).
- `data_preview` holds processed display values: `date`, `content` (null for reaction), `duration` (normalised or null), `length` ("N chars" or null). All four keys are always present.
- `locate` and `raw_meta` have been removed from the schema.
- Reaction messages always have `content: null` in both `data_raw` and `data_preview`.
- `data_preview.length` is null for all timed types (voice-message, audio-call, video-call) and reactions.

## Validation Rules
- The build must regenerate both TXT and JSON outputs from the current raw inputs.
- Tests should audit the final files, not just the helper functions.
- A good regression test checks:
- sender names are valid and readable
- raw file names map to the expected message types
- link, duration, and length behavior matches the format rules
- content-on and content-off exports differ only in the content section

## Maintenance Notes
- Update this file whenever a new raw file type is added or an export rule changes.
- Keep this document synchronized with `src/shared/message-metadata.js`, `src/shared/export-text.js`, `src/shared/aria-label-parser.js`, and `src/shared/rules/message-rules.js`.
- If a rule is ambiguous, prefer deterministic filename mapping over fragile heuristics.


