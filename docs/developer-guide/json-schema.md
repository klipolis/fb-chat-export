# Generated JSON Schema

This document describes the generated preview JSON export contract for `data-output-auto/json-format/*.json`. For the message classification rules that drive these fields, see the [Message types guide](message-types.md).

## Summary

Each generated JSON file contains a top-level object with `html_locale`, `title`, `type`, `data_raw`, and `data_preview` fields:

- `html_locale`: string or null
- `title`: string — display-friendly name for the message type
- `type`: string — canonical semantic type (e.g. `text`, `link`, `image`, `reaction`, `voice-note`)
- `data_raw`: object with the original values scraped from the HTML
- `data_preview`: object with cleaned/normalized values for display

### `data_raw` and `data_preview`

Both objects share the same sub-field structure:

- `date`: string — raw field uses the original aria-label date text; preview field uses an ISO-formatted `YYYY.MM.DD HH:mm` date
- `name`: string — sender name (see details below)
- `content`: string or null — message text, URL, or null for media-only types
- `duration`: string or null — normalized `HH:MM:SS` format when present (audio calls, video calls, voice notes)
- `length`: string or null — word count like `"N words"` when applicable (text messages, link text)

**Name field details:**
- `data_raw.name`: contains the original sender name as found in the HTML
- `data_preview.name`: contains the sender name after applying alias mapping (e.g., "You" → "Youghurt", or any unknown sender → "XYZ")

### Type-specific behavior

| Type | Preview content | Preview length | Preview duration |
|---|---|---|---|
| text | message text | word count | null |
| link | URL with link text | word count | null |
| image | `"image sent"` | null | null |
| reaction | emoji or `"GIF"` for non-emoji | `"N words"` for emoji | null |
| audio-call/video-call | type label | null | HH:MM:SS |
| voice-note | `"voice note"` | null | HH:MM:SS |
| sticker | type label | null | null |
| poll | poll question text | `"N words"` | null |
| deleted/unsent | null | null | null |

## Validation

The authoritative JSON schema is stored in `tests/generated-json-schema.json`.

The `tests/validate-generated-json.js` script loads that schema file and verifies generated previews against the expected preview contract.
