# Troubleshooting Guide

## Scan hangs at 0% — nothing collected

**Possible causes:**
- The wrong conversation tab is not open.
- The message list panel is not visible on screen.
- The page hasn't finished loading the conversation.

**What to try:**
- Make sure you are on a Facebook Messenger conversation page (not the inbox list).
- Scroll down manually first so the conversation area is visible.
- Wait for the conversation to load fully before clicking Scan Messages.
- If the page was just opened, give it a few seconds for messages to render.

## Wrong names detected for messages

**Possible causes:**
- Facebook's `aria-label` format varies by locale and language setting.
- The name parser may pick up a label that doesn't match the actual sender.

**What to try:**
- Open the Alias panel and map the detected name to the correct name.
- If names differ only by capitalisation, enable the "A-i" (case-insensitive) checkbox.
- Run a scan first with the "Group chat" option to auto-populate detected names, then assign aliases.

## No messages found in date range

**Possible causes:**
- The conversation does not go back as far as the "From" date.
- The date format is incorrect.

**What to try:**
- Use the `YYYY-MM-DD` format (e.g. `2026-01-15`).
- Verify the conversation has messages in the selected range.
- Try a wider date range or leave the fields empty to scan everything.

## Download button not appearing / export not triggering

**Possible causes:**
- Content Security Policy (CSP) headers on the page block blob URLs.
- Browser compatibility issue with `URL.createObjectURL`.

**What to try:**
- Open the browser console (F12) and check for error messages.
- Try a different browser (Chrome or Firefox recommended).
- Make sure you are on the Facebook domain — the script relies on Facebook's page structure.

## Aliases reset on page reload

**Possible causes:**
- Aliases are saved to local storage only after a scan completes.

**What to try:**
- Run a scan first — aliases are persisted when the scan finishes.
- After the scan, the alias map is stored and will be restored on the next page load.

## Scan stops early — seems to miss messages

**Possible causes:**
- The `reachedFromDate` condition triggered before reaching older messages.
- The `stableCount` threshold was reached while messages were still above the scroll position.
- The scan started scrolled to the middle of the conversation.

**What to try:**
- Scroll to the very bottom of the conversation before starting the scan.
- Enable the "Start at bottom" checkbox to let the script scroll down automatically.
- If the "From" date is set, try removing it or setting an earlier date.

## Estimated time remaining seems wrong

**Possible causes:**
- The ETA is extrapolated from scroll progress and message count.
- Message density varies — dense sections take longer to process.

**What to try:**
- The ETA is an approximation and will adjust as the scan progresses.
- Wait for the scan to finish naturally — accuracy improves over time.

## Copy to clipboard button doesn't work

**Possible causes:**
- Browsers restrict the clipboard API to pages served over HTTPS or localhost.
- The `file://` protocol does not support clipboard writes.

**What to try:**
- Make sure the page is served over HTTPS (Facebook always uses HTTPS).
- Use the Download button instead to save the file.
