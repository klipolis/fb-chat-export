# Past User Behavior Style

In this repository, early interactions were sometimes too broad or vague. That often caused:

- edits in unrelated files
- overly large change sets
- unclear review scope
- repeated back-and-forth to clarify intent

The better pattern is to keep user requests narrowly focused and project-specific. That helps the assistant produce clean, predictable changes and keeps review feedback fast.

## What slowed things down before

- requests like `fix docs` or `update stuff`
- missing file names or folder names
- not saying whether the change was docs-only or code-related
- not stating the current repository conventions (hooks, changelog, build scripts)

This guide captures that history so future requests are more precise and the assistant can act with confidence.