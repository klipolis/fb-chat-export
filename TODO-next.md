# TODO — Next tasks

Tasks grouped by area. Each is self-contained and can be instructed individually.

---

Add a CI/local bootstrap check to enforce pnpm@11.1.2 via Corepack or a preinstall script.


The v5.2.0 block has three separate ### Changed and one ### Fixed section — this happens when entries were added incrementally. They should be consolidated into a single ### Changed block per release.

Want me to apply these — consolidate duplicate sections in v5.2.0, remove internal tooling entries, and rewrite the user-visible items in plain language?


AGENTS.md is thin — it references the build entry and pnpm but doesn't cover test conventions, the golden snapshot contract, or how version is derived from the changelog heading. Those are non-obvious for new contributors or AI agents.

No CHANGELOG.md linter — the rules you just added aren't enforced automatically. A small script (similar to release:check) that flags passive phrases ("kept", "preserved", "continued") or entries missing a verb would catch violations at CI time.

Plan.md vs. CHANGELOG.md overlap — planning docs tend to drift out of sync with actual release notes. Consider keeping Plan.md for roadmap/intent only, and treating CHANGELOG.md as the sole source of truth for what shipped.

demo artifacts in git — if demo contains raw or generated chat data, it's a privacy and repo-size risk over time. Consider .gitignore-ing generated output under demo and keeping only a sanitized fixture for testing.

dist in git — shipping built output in version control means every rebuild creates a diff. If users install via script tag or download, a GitHub Release asset is cleaner than tracking app.js in the tree.

No engines.node in package.json — you pin pnpm version but not Node. Adding "engines": { "node": ">=22" } (matching .nvmrc) prevents silent failures on older runtimes.


Add a lint:changelog script — a small Node script that greps for passive phrases (kept, preserved, retained, unchanged) and fails CI if found. Enforces the new changelog rules automatically.
.nvmrc auto-switch — add a .node-version file alongside .nvmrc for tools that prefer that format (Volta, fnm), since both read the same version string.
No LICENSE check in CI — nothing currently verifies the SPDX header or that LICENSE matches what's declared in package.json. A one-line license-checker run would catch drift.
pnpm audit not in default test script — audit is a standalone script but not wired into pnpm test or build:ci. A moderate-severity finding would silently pass CI.


notice.innerHTML with template strings — [notice.innerHTML = ](http://_vscodecontentref_/28)Scanning... <b>${collected.size}</b>...`is safe today (only a number), but usingtextContent + a <b>` element built in JS would be safer long-term if the contents ever include user-derived values.
No aria-live region on the scan status notice — screen readers won't announce scan progress. Adding role="status" and aria-live="polite" to the notice element would make it accessible.
selectAllLink.click() at init fires a synthetic click — it works, but it's fragile. Explicitly calling the options setter function or a named setAllChecked(true) would be more readable and testable.
No unit tests for ui.js — createCheckboxToggle, createLabelInput etc. are pure DOM factories that could be tested with jsdom snapshots, the same way run-tests.js tests the shared modules.


downloadBtn.onclick as a scan artifact — the download button handler closes over the url and fileName from the most recent scan, which is correct. But if the panel is somehow reused across page navigations, the stale blob URL reference won't be cleaned up. A WeakRef-based or explicit URL.revokeObjectURL on scan start would guard against this.
No keyboard navigation for the panel <summary> — the <details>/<summary> is natively keyboard-accessible, but the panelArrow span is decorative and should get aria-hidden="true" so screen readers don't read "▲ Export Chat".
innerText vs textContent — several places still use innerText to set labels (e.g. panelTitle.innerText, actionBtn.innerText). For static text nodes there's no difference, but textContent is faster and avoids layout triggers.
Date validation UX — when fromDate or toDate is invalid, only the border turns red with no message. A short error label would be more accessible.


termsNote.innerHTML with a hardcoded anchor — currently the only remaining innerHTML in index.js. It's safe (hardcoded string, no user input), but could be replaced with document.createElement('a') for full consistency
downloadBtn is created once but appended/re-appended to notice on every scan — notice.appendChild(downloadBtn) appears ~5 times. Extracting a helper like appendDownloadBtn() or keeping the button always in the DOM (hidden/shown via CSS) would reduce repetition
No @downloadURL/@updateURL in the userscript header — Tampermonkey auto-update requires these; adding a DIST_BASE_URL env option in build.js would let the CI build inject them for releases
app.min.js is not referenced in validate-release.js — if app.min.js ever needs to be the primary release artifact, the release validation should also verify it


Scan button text and state managed in two places — actionBtn.textContent, .style.background, and .dataset.scanning are set in ~4 different spots. A small setScanState('scanning'|'idle'|'stopped') helper would centralize this and prevent drift
downloadBtn.onclick is replaced on each completed scan — if the user scans twice, the old handler is discarded but any in-flight timeout from the first download could still fire. Clearing the previous timeout on new scan start would guard against this
No CSP check before URL.createObjectURL — on Facebook's strict CSP, createObjectURL can throw. Wrapping in try/catch with a fallback data: URI (for small exports) would improve resilience
fromInput/toInput border color reset only on valid submit — if the user fixes an invalid date but doesn't submit, the red border stays. Clearing on input event would give immediate feedback

scrollTimeout is set but never cleared — if the user closes the panel or navigates away mid-scan, the pending setTimeout will still fire. Storing it and clearing on panel toggle (when closed) would be safer
downloaded state is reset after 10 seconds even if the file never downloaded — if the user dismisses the download prompt, the button still re-enables. This is probably fine, but a.click() is fire-and-forget; there is no way to detect download completion in the browser
actionBtn.dataset.stopped = 'true' sets a string, compared with === 'true' — correct but fragile; a closure boolean flag (let stopRequested = false) would be more type-safe
No visual indication of scan progress percent — the counter shows raw count but the user has no sense of progress; showing elapsed time alongside the count would help

