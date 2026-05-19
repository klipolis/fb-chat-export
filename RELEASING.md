# Releasing

## Steps

1. **Confirm tests pass.**
   Run `pnpm test` and verify all tests pass (or confirm any pre-existing failures are known and documented).

2. **Update `CHANGELOG.md`.**
   Add all new entries under the latest unreleased version heading.
   Follow the rules in `AGENTS.md`: active-change entries only, plain user-facing language, no internal names.

3. **Bump the version.**
   Update the `version` field in `package.json` and the version comment at the top of `src/frontend/build.js` (the userscript `@version` tag is derived from this during the build).
   The CHANGELOG release heading date must match today's date.

4. **Rebuild the bundle.**
   ```
   pnpm run build:frontend
   ```
   Confirm that `dist/app.js` and `dist/app.min.js` are updated.

5. **Run validate-dist.**
   ```
   pnpm run validate-dist
   ```
   Confirm both build artifacts match the expected schema.

6. **Commit.**
   Stage `CHANGELOG.md`, `package.json`, `dist/app.js`, `dist/app.min.js`, and any other changed files.
   Use a commit message like `chore: release v5.x.x`.

7. **Tag and push.**
   ```
   git tag v5.x.x
   git push origin main --tags
   ```

## Notes

- The `@version` in the userscript header is set automatically by `src/frontend/build.js` from `package.json`.
- Use `pnpm` (not `npm`) for all package operations — it is managed via Corepack.
- Do not bump the version until all intended changes for the release are committed and passing tests.
