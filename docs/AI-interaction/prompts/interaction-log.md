# AI Interaction Log

This document records each AI interaction session for continuity and learning.

## Session Template

Each session should record:

- **Date**: YYYY-MM-DD
- **Tasks completed**: List of completed T-numbered tasks
- **Tasks pending**: List of still-pending T-numbered tasks
- **Key changes**: Summary of files modified
- **Blockers**: Any issues that prevented progress
- **Next steps**: Recommended follow-up work

## Sessions

<!-- Sessions are recorded below this line -->

### 2026-06-04 - Unicode name recognition and JSON export fields

- **Tasks completed**: T-246, T-247, T-248, T-249, T-250
- **Tasks pending**: T-244, T-245, T-251, T-252
- **Key changes**:
  - Fixed Unicode name recognition in sender detection (Ötves, Csaba)
  - Added data_raw.name and data_preview.name fields with alias mapping
  - Changed body content length from chars to words count
  - Added test coverage for Unicode names and word count consistency
  - Updated JSON schema documentation
- **Commit**: 7731e11
- **Next steps**: Implement worker_threads fallback, add more tests for create-nodes.js