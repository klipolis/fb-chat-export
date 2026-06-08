# Cache Append Strategy

When the date range narrows (shrink mode), the browser export does not rescan the DOM.
Instead, existing cached messages are filtered by the new date range.

## How it works

1. On cache hit with narrower date range, `canReuseCached` returns `{ canReuse: true, reuseMode: 'narrower' }`
2. The scan function receives the reuse mode and applies date filtering to the cached entries
3. Messages outside the new date range are excluded from the export
4. No DOM access is needed — all filtering happens on cached data

## When it triggers

- User selects a date range that is a subset of the previously cached range
- The alias map has not changed (alias-only mode has its own reuse path)
- The chat HTML is the same page (same conversation)

## Edge cases

- Expanding the date range: triggers a full DOM rescan (cache invalidated)
- Changing aliases: triggers alias-only reuse (same cached messages, re-applied aliases)
- Cache TTL expiration: triggers full rescan even if range matches
