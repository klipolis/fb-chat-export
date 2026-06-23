# Message types and data rules

## Message types

Each message in the export is classified into one of the types below.  
Classification uses the **file name** first (when available), then the **aria-label** text, then heuristic fallback.

| Type | File name match | Aria-label match | Notes |
|------|----------------|-----------------|-------|
| `unsent` | `deleted.html` | `deleted`, `unsent` | |
| `missed-call` | `missed-audio-call.html`, `missed-video-call.html` | `missed audio call`, `missed video call` | No duration |
| `audio-call` | `audio-call.html` | `audio call` | Duration from timer |
| `image` | `image(-N).html` | `image`, `photo`, `picture` | File name with suffix (e.g. `image-2.html`) is still classified as `image`. The `imageCount` field tracks the real number of `<img>` elements in the message — for example `image-2.html` counts 2 images; `image-3.html` counts 2. Display always shows `image`. |
| `link` | `link-embed-no-text.html`, `link-text.html`, `video-link.html` | URL patterns, `attachment`, video hosting domains | Merged with `video-link` at the type level |
| `text` | `text.html`, `text-replied.html`, `text-image-replied.html` | Broad fallback | Excludes all other types |
| `video-call` | `video-call.html` | `video call` | Duration from timer |
| `voice-note` | `voice-note.html` | `voice message`, `voice note`, `audio message`, `audio note` | Duration from timer or label |
| `sticker` | `sticker.html` | `sticker` | No content text |
| `reaction` | `gif.html`, `animated-gif.html`, `reaction.html`, `reaction-emoji.html` | Emoji, `gif`, `like button`, `thumbs up` | Includes GIFs and emoji reactions |
| `poll` | `poll.html` | `poll` | |

### Image variants

Files named `image-2.html`, `image-3.html`, etc. are classified as `image` type through the filename rules.  
The `imageCount` field records the actual number of images in the message, computed by counting `<img>` elements (excluding avatar profile images identified by person-name alt text).  
In the exported text, the display type is always shown as `image` regardless of the file suffix.

## Data validation rules

### Sender names

Sender names parsed from `aria-label` attributes and HTML content must satisfy all rules below. These are enforced by `isValidSender()` in `src/shared/aria-label-parser.js` and `isValidName()` in `src/shared/utils.js`.

- **Maximum 3 words** — names with 4 or more space-separated parts are rejected.
- **Shorter than 50 characters** — total length must be 49 characters or fewer.
- **No digits** — names containing `0-9` are rejected.
- **No special characters** — only letters (including accented Latin `À-ÖØ-öø-ÿ`), spaces, dots, apostrophes, and hyphens are permitted.
- **Must start with a letter** — names beginning with a digit or punctuation are rejected.
- **Non-empty** — empty strings are rejected.

Examples:

| Input | Valid | Reason |
|-------|-------|--------|
| `Alice` | Yes | Single word letter-only |
| `John Smith` | Yes | Two words |
| `Jean-Claude van Damme` | Yes | Three words, hyphens allowed |
| `Alice 2024` | No | Contains digit |
| `R2D2` | No | Contains digit |
| `1Alpha` | No | Starts with digit |
| `majd a vegen` | Yes | Three words, no numbers |
| `A very long name that is way more than fifty characters total` | No | Exceeds 49 characters |

### Image count rules

When counting images per message:

1. All `<img>` elements in the message HTML segment are considered.
2. Elements whose `alt` text matches a person-name pattern (`/^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/`) are treated as profile avatars and excluded.
3. Elements with empty `alt` or non-person alt text are counted as images.
4. The count is stored in `imageCount` and surfaced in the summary (e.g. `~ 4 images`).

### Duration rules

Call and voice-note durations are normalised to `HH:MM:SS` format by `normalizeDuration()` in `src/shared/duration-utils.js`. Input formats:

- `M:SS` or `H:MM:SS` — colon-separated
- `N mins` — minutes
- `N sec` — seconds

Wall-clock times (e.g. `1:23 PM`) are rejected and return `null`.

### Date rules

Dates in `aria-label` attributes are parsed by `normalizeDateToSimple()` and `normalizeDateToIso()` in `src/shared/aria-label-parser.js`. Supported formats:

- Full calendar: `"May 15, 2026, 11:00"`
- Day-of-week: `"Monday 4:41pm"`
- Relative: `"today at 9:30 am"`, `"yesterday at 10:30 am"`
- Time-only: `"11:16 AM"` (resolves to today)
- Shared relative date rules from `data-config/frontend_shared.json`

Relative weekday labels such as `Saturday 4:36am` are normalised against the export reference date so the preview timestamp reflects the correct date.

### Alias rules

Preview sender names use explicit alias mappings from the shared config (`data-config/frontend_shared.json` → `aliasNames`). If a sender does not match an explicit entry, the `any` fallback alias is used.

Lowercase `you` in message text is treated as generic content and is not rewritten by alias replacement.

## File type and label matching

Message type rules are defined in `src/shared/rules/message-rules.js`. Each rule specifies:

- `type` — the message type name.
- `prefixes` — file name prefixes used to build the `matchFile` regex.
- `matchLabel` — regex tested against the `aria-label` text.
- `special` — (optional) when set, `matchFile` is not auto-generated.

The auto-generated `matchFile` regex follows the pattern:  
`^(?:you-)?(?:prefix1|prefix2)(?:-[^.]+)?\.html$`

This allows `you-` prefix variants (e.g. `you-text.html`) and numeric/suffix variants (e.g. `image-2.html`).

The generated preview JSON structure that uses these types is documented in the [JSON schema guide](json-schema.md).
