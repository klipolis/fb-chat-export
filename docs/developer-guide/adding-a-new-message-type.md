# Adding a New Message Type — End-to-End Guide

This guide walks through adding a new message type (e.g. `game`) from identifying the Facebook HTML pattern through to regenerating golden snapshots.

---

## 1. Identify the new message pattern

Facebook Messenger renders each message as a `<div>` with `aria-roledescription="message"` and an `aria-label` attribute. Inspect the HTML to find the exact aria-label text.

**Existing example** — sticker:

```html
<div aria-label="At 10:45 AM, Beta: sticker" aria-roledescription="message" ...>
```

**Hypothetical new type** — game challenge:

```
aria-label="At 3:30 PM, Alpha: sent a game challenge"
```

The type classifier uses both:
- The **file name** (when a fixture HTML file is present in `data-input-test/`)
- The **aria-label text** (used as fallback when no file-match rule fires)

---

## 2. Add a rule in `src/shared/rules/message-rules.js`

Open `src/shared/rules/message-rules.js` and add a new entry to the `rules` array. Each rule has:

- `type` — the message type string.
- `prefixes` — file-name prefixes used to build the `matchFile` regex.
- `matchLabel` — regex tested against the `aria-label` text (when no file match).

**Example** — add a `game` type after the `poll` rule:

```js
{
  type: 'game',
  prefixes: [
    'game'
  ],
  matchLabel: /\bgame\b|\bchallenge\b/i,
},
```

The `matchFile` regex is auto-generated from `prefixes`. For prefixes `['game']`, the pattern becomes:

```
^(?:you-)?(?:game)(?:-[^.]+)?\.html$
```

This matches `game.html`, `you-game.html`, `game-2.html`, etc.

**Order matters.** Rules are checked first-match-wins for both file and label matching. Add more specific rules above less specific ones.

---

## 3. Add type constant in `src/shared/constants.js` (if needed)

If the new type belongs to a group used in summary counting or formatting, add it to the relevant array.

**Existing groups:**

```js
const TIMED_CALL_TYPES = ['audio-call', 'video-call', 'voice-note'];
const MISSED_CALL_TYPES = ['missed-call', 'missed-audio-call', 'missed-video-call'];
const CALL_TYPES = [...TIMED_CALL_TYPES, ...MISSED_CALL_TYPES];
const CONTENT_TYPES = new Set(['text', 'link', 'reaction']);
```

- If the type has a **duration** (like a timed call), add it to `TIMED_CALL_TYPES`.
- If the type is a **missed call**, add it to `MISSED_CALL_TYPES`.
- If the type's content should be shown after `/` in `export-max.txt`, add it to `CONTENT_TYPES`.

For a `game` type with no duration and no content text that requires display, **no constant change is needed**.

---

## 4. Handle metadata in `src/shared/message-metadata.js` (if needed)

The `getContentMeta` function in `src/shared/message-metadata.js` determines:
- The final `type` (after fallback heuristics).
- The `contentText` (what appears after `/` in `export-max.txt`).
- Whether `wordCount` / `contentLength` is computed.

If the new type needs special content text or should skip word counting, add a branch in the `if (type === ...)` chain around line 238.

**Example** — add a `game` type with no content text:

```js
} else if (type === 'game') {
  contentText = 'game challenge';
}
```

Also check the `noLengthTypes` set on line 273 and the `timedTypes` set on line 272 to see if the new type should be added there.

---

## 5. Update `src/shared/export-config.json`

Add the new type to the `messageTypes` array. This controls:
- Which types appear in the export header.
- Which types are listed in `export-max.txt` / `export-minimal.txt`.

```json
{
  "method": "server",
  "messageTypes": [
    "audio-call",
    "deleted",
    "game",
    "image",
    ...
  ]
}
```

Types are listed in the order they appear in the header. Place it alphabetically or logically near similar types.

---

## 6. Update `tests/generated-txt-schema.json`

Add the new type to the `messageTypes` array in the test schema. This is used by JSON schema validation to verify that only known types appear in exports.

```json
{
  "messageTypes": [
    "audio-call",
    "deleted",
    "game",
    "image",
    ...
  ]
}
```

Keep the two files (`export-config.json` and `generated-txt-schema.json`) in sync — differences cause test failures in `test-json-schema-validation.js`.

---

## 7. Write a test fixture

Create an HTML file in `data-input-test/` that represents the new message type. This file becomes a message entry in the server build pipeline and drives integration tests.

**Example** — `data-input-test/game.html`:

```html
<div>
  <div aria-label="At 3:30 PM, Alpha: sent a game challenge"
       aria-roledescription="message"
       data-message-id="123@msgr.456">
    sent a game challenge
  </div>
</div>
```

The file name (`game.html`) must match one of the `prefixes` in the rule so `chooseRule` identifies it by file name.

---

## 8. Add unit tests

### 8a. Test `chooseRule` in `tests/test-message-metadata.js`

Add entries to the `chooseRuleAllEntries` test:

```js
{ file: 'game.html', label: '', expected: 'game' },
{ file: '', label: 'sent a game challenge', expected: 'game' },
```

### 8b. Test `getContentMeta` if you changed metadata logic

Add a new test section in `test-message-metadata.js`:

```js
tap.test('getContentMetaGame', (t) => {
  const meta = getContentMeta({
    fileName: 'game.html',
    ariaLabel: 'At 3:30 PM, Alpha: sent a game challenge',
    message: 'sent a game challenge',
  });
  t.equal(meta.type, 'game', 'game type is classified correctly');
  t.equal(meta.text, 'game challenge', 'content text is set');
  t.equal(meta.contentLength, undefined, 'game has no word count');
  t.end();
});
```

### 8c. Run tests

```bash
pnpm test          # full suite
pnpm test -- tests/test-message-metadata.js   # metadata-specific
```

---

## 9. Add integration tests

### 9a. Schema alias (if needed)

If the file name differs from the schema type name (like `call-video.html` maps to `video-call`), add an entry to `schemaAlias` in `src/build-server.cjs` line 116:

```js
const schemaAlias = {
  'call-video': 'video-call',
  'missed-call-audio': 'missed-audio-call',
  'missed-call-video': 'missed-video-call',
};
```

This is only needed when the fixture file name base does not match the canonical message type.

### 9b. Add assertions in `tests/integration/build-server-text-export.test.js`

Add type-specific checks after the generic ones:

```js
t.ok(bodyLinesOn.some((line) => /\bgame\b/.test(line)), 'export-max includes game type line');
t.ok(bodyLinesMinimal.some((line) => /\bgame\b/.test(line)), 'export-minimal includes game type line');
```

### 9c. Run integration tests

```bash
pnpm test -- tests/integration/build-server-text-export.test.js
```

---

## 10. Regenerate golden snapshots

Golden snapshot files in `tests/golden/` record the exact output of `src/build-server.cjs`. After adding a new fixture, the golden files are out of date and tests will fail with a diff.

1. **Build the exports:**

```bash
pnpm build:server
```

2. **Copy the updated files to golden:**

```bash
cp data-output-auto/final-export/*.txt tests/golden/
```

3. **Verify:**

```bash
pnpm test -- tests/integration/build-server-text-export.test.js
pnpm test -- tests/validate-golden.js
pnpm test -- tests/validate-generated-txt.js
```

The golden files use LF line endings, UTF-8 encoding, and no trailing whitespace — `validate-golden.js` enforces these.

---

## Summary of files to touch

| Step | File | Action |
|------|------|--------|
| 2 | `src/shared/rules/message-rules.js` | Add rule entry |
| 3 | `src/shared/constants.js` | Add to group (optional) |
| 4 | `src/shared/message-metadata.js` | Add content text branch (optional) |
| 5 | `src/shared/export-config.json` | Add to messageTypes |
| 6 | `tests/generated-txt-schema.json` | Add to messageTypes |
| 7 | `data-input-test/game.html` | New fixture file |
| 8 | `tests/test-message-metadata.js` | Add unit tests |
| 9 | `tests/integration/build-server-text-export.test.js` | Add integration assertions |
| 9a | `src/build-server.cjs` | Add schemaAlias entry (if needed) |
| 10 | `tests/golden/*.txt` | Regenerate all |

## Commands reference

```bash
pnpm test                                        # full suite
pnpm test -- tests/test-message-metadata.js       # unit tests for rules + metadata
pnpm test -- tests/integration/build-server-text-export.test.js  # integration tests
pnpm build:server                                 # regenerate exports
pnpm test -- tests/validate-golden.js             # golden file quality checks
pnpm test -- tests/validate-generated-txt.js      # schema validation
```
