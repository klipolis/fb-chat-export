# Releasing

## Steps

1. **Confirm tests pass.**
   Run `pnpm test` and verify all tests pass (or confirm any pre-existing failures are known and documented).

2. **Update `CHANGELOG.md`.**
   Rename the `## [Unreleased]` heading to the new version with today's date (e.g. `## v5.5.0 (2026-05-21)`).
   Follow the rules in `AGENTS.md`: active-change entries only, plain user-facing language, no internal names.
   Create a fresh empty `## [Unreleased]` section above the new versioned heading for subsequent work.

3. **Bump the version.**
   Update the `version` field in `package.json` and the version placeholder in `data-config/userscript/header.txt` (the userscript `@version` tag is derived from this during the build).
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

- The `@version` in the userscript header template is set automatically from `data-config/userscript/header.txt` by `src/frontend/build.cjs`.
- Use `pnpm` (not `npm`) for all package operations — it is managed via Corepack.
- Do not bump the version until all intended changes for the release are committed and passing tests.
