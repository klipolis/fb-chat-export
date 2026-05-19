import { getContentMeta, normalizeDuration } from '../../shared/message-metadata.js';
import { parseAriaLabel, normalizeDateToIso } from '../../shared/aria-label-parser.js';
import { buildSummary } from '../../shared/export-summary.js';
import { formatExportHeader, formatLine } from '../../shared/export-formatter.js';
import {
  parseLocalDate,
  resolveRelativeDate,
  getDisplayPersonName,
  formatExportFileName,
} from '../../shared/frontend-utils.js';
import {
  createButton,
  createCheckboxToggle,
  createCheckboxToggleWithInput,
  createLabelInput,
  createLinkAction,
} from './ui.js';

(function () {
  'use strict';

  const panel = document.createElement('details');
  panel.style.cssText =
    'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #fff; border: 1px solid #ddd; border-radius: 0 0 10px 10px; font-family: sans-serif; font-size: 13px; box-shadow: 0 2px 10px rgba(0,0,0,0.12); min-width: 420px; max-width: calc(100% - 40px);';
  panel.open = localStorage.getItem('fbExportPanelOpen') !== 'false';

  const panelSummary = document.createElement('summary');
  panelSummary.style.cssText =
    'cursor: pointer; padding: 6px 10px; font-size: 12px; color: #555; background: #fafafa; display: flex; align-items: center; gap: 6px; user-select: none;';
  const panelArrow = document.createElement('span');
  panelArrow.textContent = '▲';
  panelArrow.setAttribute('aria-hidden', 'true');
  panelArrow.style.cssText = 'font-size: 10px; color: #aaa;';
  const panelTitle = document.createElement('span');
  panelTitle.textContent = 'Export Chat';
  panelSummary.appendChild(panelArrow);
  panelSummary.appendChild(panelTitle);

  panel.addEventListener('toggle', () => {
    panelArrow.textContent = panel.open ? '▲' : '▼';
    panelSummary.setAttribute('aria-expanded', String(panel.open));
    localStorage.setItem('fbExportPanelOpen', String(panel.open));
    if (!panel.open && actionBtn.dataset.scanning === 'true') {
      stopRequested = true;
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
      setScanState('idle');
      noticeMsg.textContent = 'Scan cancelled.';
    }
  });
  panelSummary.setAttribute('aria-expanded', String(panel.open));

  const instructions = document.createElement('div');
  instructions.style.cssText =
    'padding: 6px 10px; font-size: 11px; color: #666; background: #fafafa;';
  instructions.textContent = 'Start at the bottom of the conversation';

  const notice = document.createElement('div');
  notice.style.cssText = 'padding: 6px 10px; font-size: 12px; color: #333;';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  const noticeMsg = document.createElement('span');
  noticeMsg.textContent = 'Ready.';

  const downloadBtn = createButton('Download .txt', '#27ae60');
  downloadBtn.style.cssText += ' display: none; margin-left: 10px; vertical-align: middle;';

  const saveAgainLink = document.createElement('a');
  saveAgainLink.textContent = 'Save again';
  saveAgainLink.href = '#';
  saveAgainLink.style.cssText = 'display: none; margin-left: 8px; font-size: 11px; color: #27ae60; vertical-align: middle;';

  notice.appendChild(noticeMsg);
  notice.appendChild(downloadBtn);
  notice.appendChild(saveAgainLink);

  // body: inputs + scan button
  const body = document.createElement('div');
  body.style.cssText = 'display: flex; gap: 10px; padding: 8px 10px; align-items: flex-end;';

  // left column: stacked inputs
  const leftCol = document.createElement('div');
  leftCol.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

  const { wrap: fromWrap, input: fromInput } = createLabelInput(
    'From:',
    'YYYY-MM-DD',
    sessionStorage.getItem('fbExportFrom') || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 3);
      return d.toISOString().slice(0, 10);
    })()
  );
  const { wrap: toWrap, input: toInput } = createLabelInput(
    'To:',
    'YYYY-MM-DD',
    sessionStorage.getItem('fbExportTo') || new Date().toISOString().slice(0, 10)
  );

  const actionBtn = createButton('Scan Messages', '#0084ff');

  const rightCol = document.createElement('div');
  rightCol.style.cssText =
    'display: flex; flex-direction: column; gap: 8px; min-width: 160px; padding-left: 10px;';

  const { wrap: includeCallsWrap, input: includeCallsChk } = createCheckboxToggle('Calls');
  const {
    wrap: anonymizeWrap,
    input: anonymizeChk,
    textInput: anonymizeInput,
    textInput2: anonymizeOtherInput,
  } = createCheckboxToggleWithInput('Anonymize', 'Youghurt', 'Alpha');
  const { wrap: summaryWrap, input: summaryChk } = createCheckboxToggle('Summary');
  const { wrap: includeContentWrap, input: includeContentChk } = createCheckboxToggle('Content');
  const { wrap: lengthWrap, input: lengthChk } = createCheckboxToggle('Length');
  function setAllChecked(state) {
    includeCallsChk.checked = state;
    anonymizeChk.checked = state;
    summaryChk.checked = state;
    includeContentChk.checked = state;
    lengthChk.checked = state;
    selectAllLink.textContent = state ? 'Uncheck all' : 'Check all';
  }

  const selectAllLink = createLinkAction('Check all', () => {
    const allChecked =
      includeCallsChk.checked &&
      anonymizeChk.checked &&
      summaryChk.checked &&
      includeContentChk.checked &&
      lengthChk.checked;
    setAllChecked(!allChecked);
  });

  leftCol.appendChild(fromWrap);
  leftCol.appendChild(toWrap);
  leftCol.appendChild(actionBtn);

  rightCol.appendChild(includeCallsWrap);
  rightCol.appendChild(anonymizeWrap);
  rightCol.appendChild(summaryWrap);
  rightCol.appendChild(includeContentWrap);
  rightCol.appendChild(lengthWrap);
  rightCol.appendChild(selectAllLink);

  // Start with full-info mode selected by default.
  setAllChecked(true);

  body.appendChild(leftCol);
  body.appendChild(rightCol);

  panel.appendChild(panelSummary);
  panel.appendChild(instructions);
  panel.appendChild(notice);
  panel.appendChild(body);

  const termsNote = document.createElement('div');
  termsNote.style.cssText = 'padding: 6px 10px 10px; font-size: 11px; color: #777;';
  const termsLabel = document.createTextNode('Terms: ');
  const termsLink = document.createElement('a');
  termsLink.href = 'https://github.com/klipolis/fb-chat-export/blob/main/docs/terms-and-conditions.md';
  termsLink.target = '_blank';
  termsLink.rel = 'noreferrer noopener';
  termsLink.textContent = 'docs/terms-and-conditions.md';
  termsNote.appendChild(termsLabel);
  termsNote.appendChild(termsLink);
  panel.appendChild(termsNote);

  document.body.appendChild(panel);

  function formatDate(raw) {
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  function extractMessageParts(el) {
    const label = el.getAttribute('aria-label') || '';
    const parsedLabel = parseAriaLabel(label);
    const rawDate = parsedLabel.date || '';
    const sender = parsedLabel.sender || '';
    const labelText = parsedLabel.message || '';

    const normalizedText = (labelText || el.innerText).replace(/\s+/g, ' ').trim();
    const normalizedLabel = label.replace(/\s+/g, ' ').trim().toLowerCase();
    const timerEl = el.querySelector('[role="timer"]');
    const hasImage = Boolean(el.querySelector('img'));
    const hasPlayButton = Boolean(el.querySelector('[aria-label="Play"]'));
    const hasLink =
      Boolean(el.querySelector('a[href]')) ||
      /\b(?:https?:\/\/|www\.|\blink\b)/i.test(normalizedText) ||
      /\b(?:https?:\/\/|www\.|\blink\b)/i.test(normalizedLabel);
    const durationText = timerEl ? timerEl.innerText : normalizedText;
    const contentMeta = getContentMeta({
      fileName: '',
      ariaLabel: label,
      message: normalizedText,
      rawMeta: { duration: durationText },
      hasImage,
      hasPlayButton,
      hasLink,
      timerText: durationText,
    });

    return {
      rawDate,
      sender,
      text: contentMeta.text,
      type: contentMeta.type,
      isCall: contentMeta.isCall,
      isImage: contentMeta.isImage,
      duration: contentMeta.duration,
      contentLength: contentMeta.contentLength,
    };
  }

  fromInput.addEventListener('input', () => { fromInput.style.borderColor = '#ccc'; });
  toInput.addEventListener('input', () => { toInput.style.borderColor = '#ccc'; });

  [fromInput, toInput].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') actionBtn.click();
    });
  });

  let downloadRevokeTimeout = null;
  let scrollTimeout = null;
  let downloadHandler = null;
  let stopRequested = false;

  function setScanState(state) {
    if (state === 'scanning') {
      actionBtn.textContent = 'Stop Scan';
      actionBtn.style.background = '#e74c3c';
      actionBtn.dataset.scanning = 'true';
      fromInput.disabled = toInput.disabled = true;
    } else {
      actionBtn.textContent = 'Scan Messages';
      actionBtn.style.background = '#0084ff';
      actionBtn.dataset.scanning = 'false';
      fromInput.disabled = toInput.disabled = false;
    }
  }

  actionBtn.addEventListener('click', () => {
    if (actionBtn.dataset.scanning === 'true') {
      stopRequested = true;
      return;
    }

    const fromDate = fromInput.value.trim() ? parseLocalDate(fromInput.value.trim()) : null;
    const toDate = (() => {
      if (!toInput.value.trim()) return null;
      const d = parseLocalDate(toInput.value.trim());
      if (!isNaN(d)) d.setHours(23, 59, 59);
      return d;
    })();

    if (fromDate !== null && isNaN(fromDate)) {
      fromInput.style.borderColor = 'red';
      noticeMsg.textContent = 'Invalid “From” date — use YYYY-MM-DD format.';
      fromInput.focus();
      return;
    }
    if (toDate !== null && isNaN(toDate)) {
      toInput.style.borderColor = 'red';
      noticeMsg.textContent = 'Invalid "To" date — use YYYY-MM-DD format.';
      toInput.focus();
      return;
    }
    fromInput.style.borderColor = toInput.style.borderColor = '#ccc';

    if (downloadRevokeTimeout !== null) {
      clearTimeout(downloadRevokeTimeout);
      downloadRevokeTimeout = null;
    }
    stopRequested = false;
    sessionStorage.setItem('fbExportFrom', fromInput.value.trim());
    sessionStorage.setItem('fbExportTo', toInput.value.trim());
    setScanState('scanning');
    downloadBtn.style.display = 'none';
    saveAgainLink.style.display = 'none';
    noticeMsg.textContent = 'Scanning: 0';

    const collected = new Map();

    let reachedFromDate = false;

    function collectVisible() {
      const allMessages = document.querySelectorAll('[aria-roledescription="message"]');
      allMessages.forEach((el) => {
        const ariaLabel = el.getAttribute('aria-label');
        const timeEl = el.querySelector('time[datetime]');
        const timeStamp = timeEl ? timeEl.getAttribute('datetime') : '';
        const key = ariaLabel ? `${ariaLabel}|${timeStamp}` : null;
        if (!key || collected.has(key)) return;
        const { rawDate, sender, text, type, isCall, isImage, duration, contentLength } =
          extractMessageParts(el);
        if (!rawDate || !sender) return;

        const resolvedRaw = timeEl ? timeEl.getAttribute('datetime') : resolveRelativeDate(rawDate);
        // Date-only ISO strings (e.g. "2026-05-15") parse as UTC midnight in all browsers.
        // Re-parse them as local midnight to match what parseLocalDate produces.
        const msgDate = /^\d{4}-\d{2}-\d{2}$/.test(resolvedRaw)
          ? (() => { const [y, m, d] = resolvedRaw.split('-').map(Number); return new Date(y, m - 1, d); })()
          : new Date(resolvedRaw);
        const displayDate = formatDate(resolvedRaw);
        const authorLabel = (() => {
          if (!anonymizeChk.checked) return sender;
          const selfName = anonymizeInput.value.trim() || 'Youghurt';
          const otherName = anonymizeOtherInput.value.trim() || 'Alpha';
          const senderLower = String(sender).toLowerCase();
          if (senderLower === 'you') {
            // already the target name — keep as-is
            return selfName.toLowerCase() === 'you' ? sender : selfName;
          }
          // other person — skip if already the target name
          return senderLower === otherName.toLowerCase() ? sender : otherName;
        })();
        const callMinutes = (() => {
          const timer = el.querySelector('[role="timer"], time');
          const src = timer ? (timer.textContent || '') : (el.getAttribute('aria-label') || '');
          const m = src.match(/(\d+)\s*min/i);
          return m ? Number(m[1]) : 0;
        })();

        if (!includeCallsChk.checked && isCall) return;
        if (fromDate && !isNaN(msgDate) && msgDate < fromDate) {
          reachedFromDate = true;
          return;
        }
        if (toDate && !isNaN(msgDate) && msgDate > toDate) return;
        const lineEntry = {
          fileType: type,
          semanticType: type,
          dateText: displayDate,
          sender: authorLabel,
          duration,
          content: text,
          contentLength,
        };
        const finalLine = formatLine(lineEntry, {
          includeContent: includeContentChk.checked,
          includeLength: lengthChk.checked,
        });
        collected.set(key, {
          ts: isNaN(msgDate) ? 0 : msgDate.getTime(),
          sender: authorLabel,
          date: msgDate,
          type,
          isCall,
          isImage,
          callMinutes,
          line: finalLine,
          exportEntry: lineEntry,
        });
      });
    }

    function findScrollContainer() {
      const firstMsg = document.querySelector('[aria-roledescription="message"]');
      if (!firstMsg) return null;
      let el = firstMsg.parentElement;
      while (el) {
        if (el.scrollHeight > el.clientHeight + 10) return el;
        el = el.parentElement;
      }
      return null;
    }

    function getLatestVisibleMessageDate() {
      const dates = Array.from(document.querySelectorAll('[aria-roledescription="message"]'))
        .map((el) => {
          const { rawDate } = extractMessageParts(el);
          const timeEl = el.querySelector('time[datetime]');
          const resolvedRaw = timeEl
            ? timeEl.getAttribute('datetime')
            : resolveRelativeDate(rawDate);
          const date = new Date(resolvedRaw);
          return isNaN(date) ? null : date;
        })
        .filter(Boolean);
      if (!dates.length) return null;
      return new Date(Math.max(...dates.map((d) => d.getTime())));
    }

    collectVisible();
    const scroller = findScrollContainer();

    if (!scroller) {
      noticeMsg.textContent = 'Could not find the message list. Make sure a conversation is open.';
      setScanState('idle');
      return;
    }

    const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    if (toDate) {
      const latestVisible = getLatestVisibleMessageDate();
      if (latestVisible && latestVisible > toDate) {
        scroller.scrollTop = maxScrollTop;
      }
    } else {
      scroller.scrollTop = maxScrollTop;
    }

    const scanStartedAt = Date.now();

    let stableCount = 0;

    function scanStep() {
      try {
      collectVisible();
      const elapsedSec = Math.round((Date.now() - scanStartedAt) / 1000);
      const scrollPct = scroller.scrollHeight > 0
        ? Math.round((1 - scroller.scrollTop / scroller.scrollHeight) * 100)
        : 0;
      noticeMsg.textContent = `Scanning... ${collected.size} collected (${elapsedSec}s, ~${scrollPct}% back).`;

      if (
        stopRequested ||
        reachedFromDate ||
        (scroller.scrollTop <= 0 && stableCount >= 3)
      ) {
        actionBtn.dataset.scanning = 'false';

        const sortedEntries = Array.from(collected.values()).sort((a, b) => a.ts - b.ts);
        const messages = sortedEntries.map((e) => e.line);

        if (messages.length === 0) {
          noticeMsg.textContent = 'No messages found.';
          downloadBtn.style.display = 'none';
          saveAgainLink.style.display = 'none';
          setScanState('idle');
          return;
        }

        const summaryText = summaryChk.checked
          ? buildSummary(sortedEntries, { useMessageLabel: true })
          : '';
        const messageTypes = Array.from(
          new Set(sortedEntries.map((entry) => entry.type).filter(Boolean))
        ).sort();
        const headerText = formatExportHeader({ method: 'browser', messageTypes });

        const blob = new Blob([headerText + summaryText + messages.join('')], {
          type: 'text/plain',
        });
        const fromLabel = fromInput.value.trim() || 'start';
        const toLabel = toInput.value.trim() || 'end';
        const elapsedMs = Date.now() - scanStartedAt;
        const elapsed =
          elapsedMs < 60000
            ? `${(elapsedMs / 1000).toFixed(1)} seconds`
            : `${(elapsedMs / 60000).toFixed(2)} minutes`;
        const displayPersonName = getDisplayPersonName();
        const fileName = formatExportFileName();
        const doneLabel = stopRequested ? 'Stopped' : 'Done';

        function setupDownload(downloadUrl) {
          noticeMsg.textContent = `${doneLabel}: ${messages.length} messages | ${displayPersonName} | ${fromLabel} - ${toLabel} | ${elapsed}`;
          function triggerDownload(url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
          }
          downloadBtn.style.display = '';
          saveAgainLink.style.display = 'none';
          saveAgainLink.onclick = null;
          if (downloadHandler) downloadBtn.removeEventListener('click', downloadHandler);
          downloadHandler = () => {
            if (downloadBtn.getAttribute('aria-disabled') === 'true') return;
            downloadBtn.setAttribute('aria-disabled', 'true');
            downloadBtn.style.opacity = '0.5';
            downloadBtn.style.cursor = 'not-allowed';
            downloadBtn.textContent = 'Downloaded';
            saveAgainLink.style.display = '';
            saveAgainLink.onclick = (e) => { e.preventDefault(); triggerDownload(downloadUrl); };
            triggerDownload(downloadUrl);
            if (downloadUrl.startsWith('blob:')) {
              if (downloadRevokeTimeout) clearTimeout(downloadRevokeTimeout);
              downloadRevokeTimeout = setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
                downloadRevokeTimeout = null;
              }, 60000);
            }
          };
          downloadBtn.addEventListener('click', downloadHandler);
          setScanState('idle');
        }

        try {
          setupDownload(URL.createObjectURL(blob));
        } catch (_) {
          const reader = new FileReader();
          reader.onload = (e) => setupDownload(e.target.result);
          reader.onerror = () => {
            noticeMsg.textContent = 'Could not prepare download.';
            setScanState('idle');
          };
          reader.readAsDataURL(blob);
        }
        return;
      }

      const nextTop = Math.max(0, scroller.scrollTop - Math.max(800, scroller.clientHeight - 100));
      if (Math.abs(nextTop - scroller.scrollTop) < 5) {
        stableCount += 1;
      } else {
        stableCount = 0;
        scroller.scrollTop = nextTop;
      }
      const delay = 500 + Math.random() * 500;
      scrollTimeout = setTimeout(scanStep, delay);
      } catch (err) {
        noticeMsg.textContent = 'An unexpected error occurred. Please try again.';
        setScanState('idle');
        throw err;
      }
    }

    scanStep();
  });
})();
