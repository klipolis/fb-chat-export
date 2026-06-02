# TODO — Next tasks

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

## Cleanup

- T145. Remove dead code branches: `type === 'gif'` and `type === 'video-link'` in `message-metadata.js:299-300,306-307` are unreachable because `chooseRule` maps both to `'link'`/`'reaction'` types.

## Test coverage

- T146. Add export-level test for emoji reaction content — verify `🥳` and `👍` appear in the generated TXT output, not just the JSON preview.

## Refactoring

- T147. Deduplicate `chooseRule` — the same function lives in both `message-metadata.js` and `create-nodes.js`; extract to a shared module.
