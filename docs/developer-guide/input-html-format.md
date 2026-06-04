# Input HTML Format

## Overview

Input HTML files are raw snapshots of Messenger conversation exports. They capture the full DOM structure of a chat thread as rendered by the Messenger web client. The system parses these files to extract individual messages, their metadata, and content for downstream processing (optimization, preview generation, and TXT export).

## Expected structure

Each file is a complete HTML document (or document fragment) containing a list of message nodes. Messages are identified by `div` elements with `aria-roledescription="message"`. The parser walks top-level elements matching any tag name and checks for an `aria-label` attribute to find message containers.

Example skeleton:

```html
<div>
  <div data-virtualized="false">
    <div>
      <div>
        <div role="none">
          <div class="__fb-light-mode" role="article">
            <div>
              <div aria-label="At 12:26 AM, Alice: Hello!"
                   aria-roledescription="message"
                   data-message-id="...">
                <!-- message inner content -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Message elements

Each message node has this structure:

- **Container element**: any HTML tag (typically `div`) with:
  - `aria-roledescription="message"` — marks it as a message
  - `aria-label="..."` — contains metadata (see below)
  - `data-message-id="..."` — unique identifier (stripped during optimization but used for internal deduplication)
- **Child content**: arbitrary Messenger DOM. The parser extracts plain text by stripping all HTML tags, `<script>` and `<style>` blocks. It also inspects children for:
  - `<img>` tags — message images (excluding sender avatars identified by person-name alt text)
  - `<a>` tags — links
  - `role="timer"` — duration display for voice notes and calls
  - `aria-label="Play"` — play button for voice notes
  - `role="button"` with `aria-label` matching "Like", "Thumbs up", etc. — reactions

## Aria-label format

The `aria-label` attribute on each message container follows this pattern:

```
At [timestamp], [sender] — [message]
```

Or with an inline colon separator:

```
At [timestamp], [sender]: [message]
```

When the timestamp includes a **calendar date**, it appears as a comma-separated prefix before the time:

```
At [Month] [DD], [YYYY], [HH:MM AM/PM], [sender]: [message]
```

The parser resolves the date portion by iterating through comma-separated prefixes, testing each against known date patterns. If no date is found in the aria-label, the message is skipped.

Examples from test data:

| Aria-label | Parsed date | Sender | Message |
|---|---|---|---|
| `At 12:26 AM, Alpha Do you have that photo?` | (time-only) | Alpha | Do you have that photo? |
| `At Wednesday 7:51pm, Alpha` | Wednesday 7:51pm | Alpha | (empty) |
| `At 10:45 AM, Beta: sticker` | 10:45 AM | Beta | sticker |
| `At 11:16 AM, You: +1` | 11:16 AM | You | +1 |
| `At Wednesday 7:51pm, Alpha Yep — text` | Wednesday 7:51pm | Alpha | Yep — text |

The system normalizes relative dates (`today`, `yesterday`, day names like `Wednesday`) against an export reference date to produce absolute timestamps. See the [message types guide](message-types.md#date-rules) for supported date formats.

Labels matching `Message actions` or `Open Attachment` are skipped as non-message UI elements.

## Supported message types

The parser classifies each message into one of these types based on a combination of **file name**, **aria-label text**, and **heuristic content detection**:

- `text` — plain text messages
- `image` — photos and images
- `voice-note` — audio voice messages (detected via timer, play button, or label text)
- `audio-call`, `video-call` — call records with duration
- `missed-call` — missed audio or video call notifications
- `link` — messages containing URLs, attachments, or pinned locations
- `reaction` — emoji reactions, GIFs, and like buttons
- `sticker` — sticker images
- `unsent` — deleted/unsent message notifications
- `poll` — poll messages

Type detection is ordered: file-name match takes precedence over aria-label match, which takes precedence over heuristic fallback. The full classification rules are in `src/shared/rules/message-rules.js` and documented in the [message types guide](message-types.md).

## File naming

Filenames determine message type classification. Each HTML file in `data-input-test/` is matched against prefix patterns defined in `src/shared/rules/message-rules.js`:

| File pattern | Type |
|---|---|
| `text.html`, `you-text.html` | text |
| `image.html`, `image-2.html` | image |
| `voice-note.html` | voice-note |
| `audio-call.html` | audio-call |
| `video-call.html`, `call-video.html` | video-call |
| `missed-call-*.html` | missed-call |
| `deleted.html` | unsent |
| `link-text.html`, `link-embed-no-text.html` | link |
| `sticker.html` | sticker |
| `reaction.html`, `gif.html` | reaction |
| `poll.html` | poll |

Files may also carry a `you-` prefix (e.g. `you-text.html`) to indicate the message was sent by the current user — this produces the same type classification but uses the `you-text` subtype internally, which normalizes to `text`.

The generated JSON output that results from parsing these files is documented in the [JSON schema guide](json-schema.md).
