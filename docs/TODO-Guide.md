# How to Add Meaningful Tasks to the TODO System

This guide explains how to write valuable, actionable tasks for the `.TODO/`
queue system. Follow these rules so every task tells a reader what to do,
why it matters, and how to verify it's done.

## 1. One task per bullet

Each bullet describes exactly one change. If you find yourself writing
"and", split it:

**Bad:**

```markdown
- T-099. Refactor the counter module and add unit tests and update docs
```

**Good:**

```markdown
- T-099. Refactor the counter module to use the new store API
- T-100. Add unit tests for the refactored counter module
- T-101. Update Requirements.md with refactored counter architecture
```

## 2. Use a present-action verb, not a past tense or a status

Start with the action you will take:

| Do this                                      | Not this                                     |
| -------------------------------------------- | -------------------------------------------- |
| `Add CI workflow that runs tests on push`    | `Added CI workflow` or `CI should run tests` |
| `Fix label attribute propagation in view.js` | `Label bug is being investigated`            |
| `Bump plugin version to 1.2.0 for release`   | `Release version`                            |

## 3. Include the observable outcome

A task description should answer: "How will I know this is done?" without
needing a separate spec.

**Weak:** `T-102. Improve counter performance`

**Strong:** `T-102. Reduce tick callback runtime by caching DOM queries in
view.js so the counter runs at 60 fps on low-end devices`

## 4. Group by category

The categories in `config.json` define the groups. Every task goes into
exactly one category. Common ones:

- **Build / CI**: tooling, pipeline, deployment, scripts, configs
- **Frontend**: editor UI, block output, view.js, styles, templates
- **Backend**: PHP, REST API, registration, database
- **Cleanup**: renames, removals, doc syncs, deprecation handling
- **Process**: reviews, audits, test execution, releases

## 5. Assign T-numbers and update config.json

```markdown
1. Read `.TODO/config.json` for `nextTaskNumber`
2. Assign T-{nextTaskNumber} to the task
3. Increment `nextTaskNumber` by 1
4. Write the task into the correct TODO file
5. Run `pnpm lint:todos` to validate
```

## 6. Move tasks, don't rewrite them

When a task is done, move it from `TODO-next.md` to `TODO-done.md` keeping
the same T-number. Append a short commit hash reference.

When a task is deferred, move it to `TODO-future.md`.
When a task will never be done, move it to `TODO-ignore.md` with a rationale.

## 7. When to write a task

Write a task when:

- You identify a concrete bug or missing feature
- A user reports a problem that you reproduce
- You see a recurring pattern that should be automated
- A doc, config, or code path is stale or misleading
- A release needs preparation (version bumps, changelog, readme)
- You complete exploratory work and identify follow-ups

Do NOT write a task when:

- The work is already tracked under another T-number
- The change is a typo or trivial fix you can do immediately
- The idea is vague with no clear implementation path
- The task depends on a prerequisite that is itself not tracked

## 8. Review before closing

Before marking a task done, verify:

- [ ] All code changes are committed
- [ ] Tests pass (or were updated)
- [ ] Build verification passes
- [ ] Changelog has an entry for the change
- [ ] Related docs were updated if the change is user-facing
- [ ] Task moved to TODO-done.md with the commit hash
