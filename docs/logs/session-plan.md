# Session Plan

Reverse-chronological log of user request summaries and resulting commits. Each entry stands alone with its own date-time. This is not a precise AI interaction log — it records the gist of what the user asked for, not the exact prompt.

## Format

```
- YYYY-MM-DD HH:MM – User request summary → commits (if any)
```

---

- 2026-06-05 12:00 – Restructure AI-interaction docs: rename prompts folder to prompts-collection, create dedicated ai-logs folder, clarify logs purpose. → (committed 7de1cd3, pending this)
- 2026-06-05 11:00 – Add .todo/plan.md session history file → (committed f44d73f)
- 2026-06-05 09:00 – Node engine constraint >=26, remove worker_threads fallback → (cf4ef2d, 5d25d80, cccf06a)
- 2026-06-05 08:00 – Word count edge cases, Unicode integration tests, update TODO → (5197685, 4c62eba, 3fc7c02, 19ea27d, 739a379)
- 2026-06-04 22:00 – Add data_raw.name and data_preview.name fields, Unicode name support, word count consistency → (db73f35, 7731e11, 3902d07, 3a5426e)
- 2026-06-04 18:00 – Worker fallback, onlyFiles test, consolidate ensureDir/extractLink/normalizeExportSender, validateExportConfig → (252b531, 81c14bd)
- 2026-06-04 12:00 – Parallel worker pool, incremental build cache, stale cleanup → (f96d773, 0adb916, feae95d, 99017e0, 503d098, 0205824)
- 2026-06-04 09:00 – Build-time JSON schema validation, consolidate shared code into dedicated modules, shared module tests → (0d01301, 36f7f81, 487238b, 4c427d3, 512f5c0)
- 2026-06-03 19:00 – Structure fixes, server structure, dead code cleanup, link-text fix → (c4b59ce, 3adbbed, cc7b8a3, 3e31f9d, 5972a43)
- 2026-06-02 23:00 – Fix alias names, dates, duration → (9ad105b, 152b844)
- 2026-05-29 09:00 – Fix summary word counts → (9b0e601)
- 2026-05-27 15:00 – Fix multiple image posts, numeric suffixes, image total count → (33f600b, dca7975, c72ef35, a5d913a)
- 2026-05-26 21:00 – Validation self-healing, documentation references → (5727dfb, b0d576e)
- 2026-05-25 21:00 – Normalize changelog wording, enforce rules, centralize path resolution → (bfb30e5, 9cdc6bd)
- 2026-05-24 18:00 – Changelog and TODO cross-validation → (92dedf7)
- 2026-05-23 11:00 – Organize folder structure, tests, dataset → (5f3d235)
- 2026-05-22 23:00 – Full test coverage, link and summary, multi-person names → (e5b3a35)
- 2026-05-21 23:00 – Fix duration, date, multi-sender → (162a6b4)
- 2026-05-20 23:00 – Fix summary counts → (828ac67, 48633bf)
- 2026-05-19 22:00 – Calendar date parsing without "At" prefix, more message types → (e5b3a35)
- 2026-05-18 17:00 – Accessible panel, dev testing, todo management → (f491034, 990decb, 27da1bb, 1aa5005)
- 2026-05-17 18:00 – GitHub Actions, repo structure, CI workflow → (78c8657, 358e572, aefd67a, 5e9e2de)
- 2026-05-16 23:00 – Multi-person chat summaries, reactions, image counts → (9ad105b, 152b844, a82a805, a5d913a, 9b0e601)
- 2026-05-15 19:00 – Messenger HTML export tool with summary, panel options → (a490a14, a5f5d7f, 2911db4, 00d3aef, a5d8c4d, 98c14c9)
