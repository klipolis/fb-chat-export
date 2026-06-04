# Hot Input: userscript

Place userscript-captured HTML files here for export processing.

Unlike `data-input-test/` (cold test fixtures), files in this directory are
**modifiable** — add, remove, or edit them freely during development or
one-off exports. They bypass golden validation and are not tracked in git.

See `src/frontend/build.cjs` and `src/build-server.cjs` for how hot and cold
input paths are resolved.
