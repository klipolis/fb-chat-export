# Message Content Rules

This file documents the developer-facing rules that map raw Messenger HTML into end-user exports. It is intentionally separate from setup and product requirements because it describes implementation behavior, not user-facing features.

## Scope
- Raw HTML in `Data-input-html-raw/` is the source of truth.
- Message rules map each raw file name to one primary message type.
- Shared helpers convert the raw content into both JSON preview files and TXT exports.
- The same semantic rules should be used by server and frontend build paths where possible.
- Frontend userscript mode must apply equivalent rules without relying on server-only file-name context.

## Message Type Mapping
- File-name rules are the first-class classifier.
- Each raw file should resolve to a stable message type defined in `src/shared/rules/message-rules.js`.
- Heuristics may support parsing, but file rules should win when a file name clearly identifies the message type.
- The message type in JSON and TXT must reflect the raw file category, not a later visual guess.

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
- Person summary totals should exclude `deleted/unsent` and missed call message types.
- Call counts in summaries should include audio/video and voice note/message entries, excluding missed calls.
- Summary count lines should not use a `Total:` prefix.

## JSON Export Rules
- Generated JSON should stay flat and simple to consume.
- `data_preview.content_type` is the primary semantic type field.
- `data_preview.content` should match the intended user-facing label or text.
- `data_preview.duration` should exist only when duration is actually known.
- `content_link` should appear for link previews.
- `content_length` should be omitted when the type does not need it.

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
