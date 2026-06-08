# Project Reproduction Prompts

Use these prompts to capture work that rebuilds or updates the project consistently.

## Example prompts

- `create a new AI interaction docs folder with separate user and assistant guidance for this project`
- `add a prompt examples folder that documents how to request repo changes and reproduce project behavior`
- `update the documentation so every AI interaction is recorded as a trace for future review`
- `document the repo workflow for hooks, changelog, and build scripts without referencing exact file paths`

## How to use these prompts

1. State the intended outcome clearly.
2. Mention that this is for the current repository and that the result should be educational.
3. Avoid low-level file paths unless necessary for a specific documentation target.
4. Include the scope: docs, code, or both.

## Batch task execution

For large batches of independent tasks, dispatch one sub-agent per task group. Group tasks by the files they touch — frontend features in one agent, schema in another, etc. Each agent reads its own files and verifies its own tests. The main agent handles inter-group conflicts (e.g. test fixture updates, bug fixes from regressions).

Example prompt:
```
Dispatch 4 agents in parallel for (T-325+T-326+T-328), (T-329+T-330), (T-334+T-335+T-336), and the remaining five tasks. Each agent reads target files first, implements changes, runs tests, reports results.
```

## Why these prompts help

These prompts reduce ambiguity and help the assistant produce clean changes that match the project style. They are designed to be useful for reproducing the repository's workflow and documentation structure.
