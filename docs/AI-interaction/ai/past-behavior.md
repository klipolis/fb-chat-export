# Past Assistant Behavior Style

In this repository, some earlier AI behavior was too broad or made extra assumptions. That led to:

- unnecessary file changes
- edits outside the requested scope
- repeated clarification requests
- less stable review diffs

The assistant should learn from that style and focus on precise, project-specific responses.

## What to avoid

- changing files not directly requested
- rewriting content without explicit direction
- modifying hooks or workflows without preserving conventions
- assuming the user's intent beyond what was stated

This document makes those past lessons explicit so the assistant can behave more predictably in future work.