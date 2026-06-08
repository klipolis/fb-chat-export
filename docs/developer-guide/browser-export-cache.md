# Browser Export Cache Architecture

The browser export panel (`src/frontend/src/index.js`) maintains an in-memory cache (`exportCache`) to avoid re-scanning the DOM when the user makes minor changes to export parameters.

## Cache Structure

The `exportCache` object (set at line 848 of `src/frontend/src/index.js`):

| Field | Type | Description |
|-------|------|-------------|
| `personName` | string | Display name of the conversation partner |
| `fromDate` | string | Raw `from` input value (`YYYY-MM-DD` or empty) |
| `toDate` | string | Raw `to` input value (`YYYY-MM-DD` or empty) |
| `aliasHash` | string | Hash of the current alias map (see `computeAliasHash`) |
| `headerText` | string | Pre-rendered export header block |
| `summaryText` | string | Pre-rendered summary block |
| `messageTypes` | string[] | Sorted unique message type names in the scan |
| `exportOptions` | object | Snapshot of checkbox states (calls, alias, summary, content, rawLink, length) |
| `rawEntries` | object[] | Full per-message data for recomputation (ts, rawSender, text, semanticType, etc.) |
| `messages` | string[] | Pre-rendered message lines (one per entry) |

## Cache Reuse Modes

Determined by `canReuseCached()` (line 422).

### 1. Exact match (`'exact'`)

Same dates **and** same alias hash. The cached `headerText`, `summaryText`, and `messages` arrays are returned directly. No recomputation. Instant export — 0.0 seconds elapsed.

### 2. Alias-only (`'alias-only'`)

Same dates, different alias hash. The message set is identical, so `rawEntries` are reused but aliases are re-applied:
- `headerText` is regenerated with the new alias map.
- `summaryText` is rebuilt from `rawEntries` (aliases are baked into summary senders).
- Each `rawEntry` is re-mapped through `lookupAlias` and `applyAliasToText`.

This avoids re-scanning the DOM and re-parsing all messages.

### 3. Narrower date (`'narrower'`)

Date range is a subset of the cached range (both `fromDate >= cached.fromDate` and `toDate <= cached.toDate`). Only `rawEntries` are reused:
- Filtered by timestamp using `parseLocalDate`.
- `headerText` and `summaryText` are fully recomputed from the filtered subset.
- Each filtered entry is re-mapped through aliases as in alias-only mode.

This avoids re-scanning because the cache already contains all messages in the wider range.

## Cache Invalidation

The cache is invalidated (set to `null` or replaced) in these cases:

| Scenario | Mechanism | Line |
|----------|-----------|------|
| Different person (new conversation) | `canReuseCached` returns `null` | 423 |
| Expanded date range (wider than cached) | `canReuseCached` returns `null` | 433-434 |
| New scan starts | `cleanupExport()` clears UI; `exportCache` replaced at end of new scan | 499, 848 |
| First scan (no cache) | `exportCache` starts as `null` | 324 |

Expanded dates returns `null` because the cache doesn't have entries outside the original range, so a new DOM scan is required.

## Why In-Memory (not localStorage)

1. **Blob URLs** — The download uses `URL.createObjectURL(blob)` (line 883, 600). Blob URLs are tied to the document lifetime and cannot be serialized or restored after page reload.
2. **Non-serializable objects** — `rawEntries` contains `Date` objects and HTML-derived data. Serializing them would require a structured clone algorithm and add complexity.
3. **Session lifetime** — The cache only matters within a single browser session. There is no benefit to persisting across page loads because the DOM state would have changed.

## The `cleanupExport` Function

```js
function cleanupExport() { /* line 327 */ }
```

Called before a new scan starts (line 499) or when the panel closes. It:

1. **Revokes the Blob URL** — calls `URL.revokeObjectURL(downloadCleanup.url)` to free memory.
2. **Hides download UI** — hides the Download button, Copy button, "Save again" link, preview, and progress bar.
3. **Resets scan state** — calls `setScanState('idle')` so the action button returns to "Scan Messages".

The `downloadCleanup` object (line 364) holds the blob URL, file name, and full export text for the current export. It persists between download clicks so "Save again" can re-trigger the same download without re-scanning.

When `cleanupPending` is detected in `sessionStorage` (line 27-33), the stored form inputs (`exportFrom`, `exportTo`, `exportFileName`) are cleared. This handles the case where the user navigates away mid-scan and returns.
