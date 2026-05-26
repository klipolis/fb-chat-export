# Generated JSON Schema

This document describes the generated preview JSON export contract for `data-output/json-format/*.json`.

## Summary

Each generated preview JSON file is expected to include:

- `title`: string
- `export_date`: string
- `locate`: object with `message`, `label`, and `textContent` selectors
- `data_preview`: object containing:
  - `original_date`: string or null
  - `optimised_date`: string
  - `content`: string or null
  - `content_type`: string
  - `duration`: string (optional, present for timed audio/video/voice previews)
  - `content_link`: string (optional, present for link previews)
  - `content_length`: string (optional, present for timed and text previews)
  - `raw_meta`: object (optional, raw duration/link metadata when available)

## Validation

The authoritative JSON schema is stored in `tests/generated-json-schema.json`.

The `tests/validate-generated-json.js` script loads that schema file and verifies generated previews against the expected preview contract.
