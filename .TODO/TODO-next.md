# TODO — Next tasks


Process note: use T-prefixed IDs from `.todo/config.json`, keep one task per bullet, group tasks by category, and write task descriptions that describe the desired outcome rather than a specific tool or implementation.

## Links

- [TODO-done.md](TODO-done.md)
- [TODO-ignore.md](TODO-ignore.md)
- [TODO-future.md](TODO-future.md)
- [.todo/config.json](../.todo/config.json)

---

## Build

- T-215. Add support for incremental builds by tracking file modification times and only rebuilding changed components.
- T-216. Implement parallel processing in the build server to utilize multiple CPU cores for faster HTML optimization and JSON generation.
- T-217. Add build artifact size reporting to help identify bloated output files and optimization opportunities.
- T-218. Create a build cache mechanism to avoid reprocessing unchanged files during development iterations.

## CI/CD

- T-222. Add a GitHub Action test step for the generated userscript bundle contents.

## Documentation

- T-206. Add comprehensive inline documentation to complex utility functions in shared modules explaining their purpose, parameters, and return values.
- T-207. Create a developer onboarding guide that explains the project architecture, build process, and contribution guidelines.
- T-208. Add JSDoc comments to all public functions in shared modules to enable IDE autocomplete and type checking.
- T-209. Document the expected format and structure of input HTML files for the chat exporter to process correctly.


## Test coverage

- T-225. Add tests for the shared HTML sanitization utilities to ensure proper handling of malformed HTML.
- T-226. Add tests for the shared constants module to verify all message type mappings are correct.
- T-227. Add tests for build-time JSON schema validation to catch structural issues early.
- T-228. Add tests for incremental build functionality to ensure only changed files are processed.
- T-229. Add tests for parallel processing in the build server to verify correct utilization of CPU cores.
- T-230. Add tests for build cache mechanism to verify it correctly avoids reprocessing unchanged files.
- T-231. Add tests for GitHub Action validation of userscript bundle contents.

## Process improvements

- T-233. Implement automated dependency updates using tools like Dependabot or Renovate to keep project dependencies current.
- T-235. Create contributing guidelines that clearly explain how to submit bug fixes, features, and improvements.
- T-236. Add issue templates for bug reports, feature requests, and questions to standardize issue reporting.
- T-237. Implement semantic versioning automation that detects breaking changes, features, and fixes to suggest version bumps.


