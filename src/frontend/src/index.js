import sharedConfig from '../../../data-config/frontend_shared.json';
import { getContentMeta, stripTrackingParams } from '../../shared/message-metadata.js';
import { normalizeDuration } from '../../shared/duration-utils.js';
import { parseAriaLabel, normalizeDateToIso, extractNameAfterBy, isValidSender } from '../../shared/aria-label-parser.js';
import { buildSummary } from '../../shared/export-summary.js';
import { formatExportHeader, formatLine, durationToMinutes } from '../../shared/export-formatter.js';
import {
  parseLocalDate,
  resolveRelativeDate,
  getDisplayPersonName,
  sanitizeFileNamePart,
  formatExportFileName,
} from '../../shared/frontend-utils.mjs';
import {
  createDetailsPanel,
  createButton,
  createCheckboxToggle,
  createAliasRows,
  createLabelInput,
  createLinkAction,
} from './ui.js';
import { applyAliasToText } from '../../shared/alias-utils.js';

(function () {
  'use strict';

  const cleanupPending = sessionStorage.getItem('cleanupPending');
  if (cleanupPending === 'true') {
    sessionStorage.removeItem('exportFrom');
    sessionStorage.removeItem('exportTo');
    sessionStorage.removeItem('exportFileName');
    sessionStorage.removeItem('cleanupPending');
  }

  const { panel, summary: panelSummary, arrow: panelArrow } = createDetailsPanel('Export Chat');
  panel.open = localStorage.getItem('chatExportPanelOpen') !== 'false';
  panelSummary.setAttribute('aria-expanded', String(panel.open));

  panel.addEventListener('toggle', () => {
    panelArrow.textContent = panel.open ? '▲' : '▼';
    panelSummary.setAttribute('aria-expanded', String(panel.open));
    localStorage.setItem('chatExportPanelOpen', String(panel.open));
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

  const cleanupLine = document.createElement('div');
  cleanupLine.style.cssText = 'display: none; margin-top: 4px; font-size: 11px; color: #888;';

  notice.appendChild(noticeMsg);
  notice.appendChild(downloadBtn);
  notice.appendChild(saveAgainLink);
  notice.appendChild(cleanupLine);

  // body: inputs + scan button
  const body = document.createElement('div');
  body.style.cssText = 'display: flex; gap: 10px; padding: 8px 10px; align-items: flex-end;';

  // left column: stacked inputs
  const leftCol = document.createElement('div');
  leftCol.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

  const { wrap: fromWrap, input: fromInput } = createLabelInput(
    'From:',
    'YYYY-MM-DD',
    sessionStorage.getItem('exportFrom') || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 3);
      return d.toISOString().slice(0, 10);
    })()
  );
  const { wrap: toWrap, input: toInput } = createLabelInput(
    'To:',
    'YYYY-MM-DD',
    sessionStorage.getItem('exportTo') || new Date().toISOString().slice(0, 10)
  );

  const { wrap: fileNameWrap, input: fileNameInput } = createLabelInput(
    'File:',
    'Optional custom name',
    sessionStorage.getItem('exportFileName') || ''
  );

  const { wrap: startAtBottomWrap, input: startAtBottomChk } = createCheckboxToggle('Start at bottom');
  startAtBottomChk.checked = true;

  const actionBtn = createButton('Scan Messages', '#0084ff');

  const rightCol = document.createElement('div');
  rightCol.style.cssText =
    'display: flex; flex-direction: column; gap: 8px; min-width: 160px; padding-left: 10px;';

  const { wrap: includeCallsWrap, input: includeCallsChk } = createCheckboxToggle('Calls');
  const aliasDefaults = sharedConfig.aliasNames || { You: 'Youghurt', any: 'Alpha' };
  const { wrap: aliasWrap, input: aliasChk, getAliasMap, validateAll: validateAliasRows, setDetectedNames, groupChatChk } = createAliasRows(aliasDefaults);
  const { wrap: summaryWrap, input: summaryChk } = createCheckboxToggle('Summary');
  const { wrap: includeContentWrap, input: includeContentChk } = createCheckboxToggle('Content');
  const { wrap: rawLinkWrap, input: rawLinkChk } = createCheckboxToggle('Raw link');
  const { wrap: lengthWrap, input: lengthChk } = createCheckboxToggle('Length');
  function setAllChecked(state) {
    includeCallsChk.checked = state;
    aliasChk.checked = state;
    summaryChk.checked = state;
    includeContentChk.checked = state;
    rawLinkChk.checked = state;
    lengthChk.checked = state;
    selectAllLink.textContent = state ? 'Uncheck all' : 'Check all';
  }

  const selectAllLink = createLinkAction('Check all', () => {
    const allChecked =
      includeCallsChk.checked &&
      aliasChk.checked &&
      summaryChk.checked &&
      includeContentChk.checked &&
      rawLinkChk.checked &&
      lengthChk.checked;
    setAllChecked(!allChecked);
  });

  leftCol.appendChild(fromWrap);
  leftCol.appendChild(toWrap);
  leftCol.appendChild(fileNameWrap);
  leftCol.appendChild(startAtBottomWrap);
  leftCol.appendChild(actionBtn);

  rightCol.appendChild(includeCallsWrap);
  rightCol.appendChild(aliasWrap);
  rightCol.appendChild(summaryWrap);
  rightCol.appendChild(includeContentWrap);
  rightCol.appendChild(rawLinkWrap);
  rightCol.appendChild(lengthWrap);
  rightCol.appendChild(selectAllLink);

  // Start with full-info mode selected by default.
  setAllChecked(true);

  body.appendChild(leftCol);
  body.appendChild(rightCol);

  panel.appendChild(panelSummary);
  panel.appendChild(notice);
  panel.appendChild(body);

  const termsNote = document.createElement('div');
  termsNote.style.cssText = 'padding: 6px 10px 10px; font-size: 11px; color: #777;';
  const termsLabel = document.createTextNode('Terms: ');
  const termsLink = document.createElement('a');
  termsLink.href = 'https://github.com/klipolis/fb-chat-export/blob/main/docs/user-guide/terms-and-conditions.md';
  termsLink.target = '_blank';
  termsLink.rel = 'noreferrer noopener';
  termsLink.textContent = 'docs/user-guide/terms-and-conditions.md';
  termsNote.appendChild(termsLabel);
  termsNote.appendChild(termsLink);
  panel.appendChild(termsNote);

  document.body.appendChild(panel);
  document.body.appendChild(instructions);

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
    let sender = parsedLabel.sender || '';
    const labelText = parsedLabel.message || '';

    // DOM-based name fallback: if parser didn't find a sender,
    // look for "by X" in child element aria-labels or img alt text.
    if (!sender) {
      const byEl = el.querySelector('[aria-label*="* by " i]');
      if (byEl) {
        const byLabel = byEl.getAttribute('aria-label');
        const byName = extractNameAfterBy(byLabel);
        if (byName && byName !== byLabel && isValidSender(byName)) {
          sender = byName;
        }
      }
      if (!sender) {
        const imgEl = el.querySelector('img[alt]');
        if (imgEl) {
          const alt = imgEl.getAttribute('alt').trim();
          const firstWord = alt.split(/\s+/)[0];
          if (firstWord && isValidSender(firstWord)) {
            sender = firstWord;
          }
        }
      }
    }

    const normalizedText = (labelText || el.innerText).replace(/\s+/g, ' ').trim();
    const normalizedLabel = label.replace(/\s+/g, ' ').trim().toLowerCase();
    const timerEl = el.querySelector('[role="timer"]');
    const timerText = timerEl ? timerEl.innerText : '';
    const hasImage = Boolean(el.querySelector('img'));
    const hasPlayButton = Boolean(el.querySelector('[aria-label="Play"]'));
    const anchor = el.querySelector('a[href]');
    const originalHref = anchor ? anchor.getAttribute('href') : null;
    const hasLink =
      Boolean(originalHref) ||
      /https?:\/\/|www\./i.test(normalizedText) ||
      /https?:\/\/|www\./i.test(normalizedLabel);
    const contentMeta = getContentMeta({
      fileName: '',
      ariaLabel: label,
      message: normalizedText,
      rawMeta: { duration: timerText || normalizedText, link: originalHref },
      hasImage,
      hasPlayButton,
      hasLink,
      timerText,
    });

    return {
      rawDate,
      sender,
      text: contentMeta.text,
      link: contentMeta.link,
      originalHref,
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

  includeContentChk.addEventListener('change', () => {
    rawLinkChk.disabled = !includeContentChk.checked;
    rawLinkChk.checked = rawLinkChk.checked && includeContentChk.checked;
    rawLinkWrap.style.opacity = includeContentChk.checked ? '1' : '0.6';
  });
  rawLinkChk.disabled = !includeContentChk.checked;
  rawLinkWrap.style.opacity = includeContentChk.checked ? '1' : '0.6';

  fileNameInput.addEventListener('input', () => {
    fileNameInput.style.borderColor = '#ccc';
  });

  let downloadRevokeTimeout = null;
  let scrollTimeout = null;
  let downloadHandler = null;
  let stopRequested = false;
  let countdownInterval = null;
  let cleanupCountdownInterval = null;

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
    if (aliasChk.checked && !validateAliasRows()) {
      noticeMsg.textContent = 'Alias fields contain invalid names.';
      return;
    }

    const customBaseName = fileNameInput.value.trim();
    let customFileName = '';
    if (customBaseName) {
      const sanitized = sanitizeFileNamePart(customBaseName);
      customFileName = `${sanitized}.txt`;
      sessionStorage.setItem('exportFileName', customBaseName);
    }

    fromInput.style.borderColor = toInput.style.borderColor = '#ccc';

    if (downloadRevokeTimeout !== null) {
      clearTimeout(downloadRevokeTimeout);
      downloadRevokeTimeout = null;
    }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    if (cleanupCountdownInterval) { clearInterval(cleanupCountdownInterval); cleanupCountdownInterval = null; }
    stopRequested = false;
    sessionStorage.setItem('exportFrom', fromInput.value.trim());
    sessionStorage.setItem('exportTo', toInput.value.trim());
    setScanState('scanning');
    downloadBtn.style.display = 'none';
    saveAgainLink.style.display = 'none';
    noticeMsg.textContent = 'Scanning: 0';

    const collected = new Map();
    const detectedSenders = new Set();

    let reachedFromDate = false;

    function collectVisible() {
      const allMessages = document.querySelectorAll('[aria-roledescription="message"]');
      allMessages.forEach((el) => {
        const ariaLabel = el.getAttribute('aria-label');
        const timeEl = el.querySelector('time[datetime]');
        const timeStamp = timeEl ? timeEl.getAttribute('datetime') : '';
        const key = ariaLabel ? `${ariaLabel}|${timeStamp}` : null;
        if (!key || collected.has(key)) return;
        const {
          rawDate,
          sender,
          text,
          link,
          originalHref,
          type,
          isCall,
          isImage,
          duration,
          contentLength,
        } = extractMessageParts(el);
        if (!rawDate || !sender) return;
        detectedSenders.add(sender);

        const resolvedRaw = timeEl ? timeEl.getAttribute('datetime') : resolveRelativeDate(rawDate);
        // Date-only ISO strings (e.g. "2026-05-15") parse as UTC midnight in all browsers.
        // Re-parse them as local midnight to match what parseLocalDate produces.
        const msgDate = /^\d{4}-\d{2}-\d{2}$/.test(resolvedRaw)
          ? (() => { const [y, m, d] = resolvedRaw.split('-').map(Number); return new Date(y, m - 1, d); })()
          : new Date(resolvedRaw);
        const displayDate = formatDate(resolvedRaw);
        const authorLabel = (() => {
          if (!aliasChk.checked) return sender;
          const aliasMap = getAliasMap();
          const normalizedSender = String(sender).trim();
          return (
            aliasMap[normalizedSender] ||
            aliasMap[normalizedSender.toLowerCase()] ||
            aliasMap[normalizedSender.toUpperCase()] ||
            aliasMap.any ||
            sender
          );
        })();
        const callMinutes = durationToMinutes(duration);

        if (!includeCallsChk.checked && isCall) return;
        if (fromDate && !isNaN(msgDate) && msgDate < fromDate) {
          reachedFromDate = true;
          return;
        }
        if (toDate && !isNaN(msgDate) && msgDate > toDate) return;
        const aliasMap = aliasChk.checked ? getAliasMap() : {};
        const aliasedText = aliasChk.checked ? applyAliasToText(text, aliasMap, sender) : text;
        const aliasedContent = aliasChk.checked
          ? applyAliasToText(
            includeContentChk.checked
              ? rawLinkChk.checked && type === 'link'
                ? stripTrackingParams(link || originalHref || aliasedText) || aliasedText
                : originalHref || aliasedText
              : aliasedText,
            aliasMap,
            sender
          )
          : includeContentChk.checked
            ? rawLinkChk.checked && type === 'link'
              ? stripTrackingParams(link || originalHref || text) || text
              : originalHref || text
            : text;

        const displayType = type === 'reaction' && text ? 'text' : type;
        const lineEntry = {
          fileType: displayType,
          semanticType: type,
          dateText: displayDate,
          sender: authorLabel,
          duration,
          content: aliasedContent,
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
          wordCount: isCall || isImage ? 0 : (text ? text.split(/\s+/).filter(Boolean).length : 0),
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

    if (startAtBottomChk.checked) {
      const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      if (toDate) {
        const latestVisible = getLatestVisibleMessageDate();
        if (latestVisible && latestVisible > toDate) {
          scroller.scrollTop = maxScrollTop;
        }
      } else {
        scroller.scrollTop = maxScrollTop;
      }
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

          if (aliasChk.checked && groupChatChk.checked) {
            setDetectedNames(detectedSenders);
          }

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
          const headerText = formatExportHeader({
            method: 'browser',
            messageTypes,
            exportOptions: {
              calls: includeCallsChk.checked,
              alias: aliasChk.checked,
              summary: summaryChk.checked,
              content: includeContentChk.checked,
              rawLink: rawLinkChk.checked,
              length: lengthChk.checked,
            },
            aliasMap: getAliasMap(),
          });

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
          const fileName = customFileName || formatExportFileName(undefined, {
            fromDate: fromInput.value.trim() || '',
            toDate: toInput.value.trim() || '',
          });
          const doneLabel = stopRequested ? 'Stopped' : 'Done';

          function setupDownload(downloadUrl) {
            noticeMsg.textContent = `${doneLabel}: ${messages.length} messages | ${displayPersonName} | ${fromLabel} - ${toLabel} | ${elapsed}`;

            let downloadedOnce = false;
            let cleanupCountdown = 180;

            function triggerDownload(url) {
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              a.click();
            }

            function cleanupExport() {
              if (downloadUrl && downloadUrl.startsWith('blob:')) {
                URL.revokeObjectURL(downloadUrl);
              }
              downloadUrl = null;
              if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
              saveAgainLink.style.display = 'none';
              downloadBtn.style.display = 'none';
              cleanupLine.style.display = 'none';
              noticeMsg.textContent = 'Ready.';
              if (downloadHandler) downloadBtn.removeEventListener('click', downloadHandler);
              downloadHandler = null;
              setScanState('idle');
            }

            downloadBtn.style.display = '';
            downloadBtn.removeAttribute('aria-disabled');
            downloadBtn.style.opacity = '';
            downloadBtn.style.cursor = '';
            downloadBtn.textContent = 'Download';
            saveAgainLink.style.display = 'none';
            saveAgainLink.onclick = null;
            cleanupLine.style.display = '';
            if (downloadHandler) downloadBtn.removeEventListener('click', downloadHandler);

            if (countdownInterval) clearInterval(countdownInterval);
            countdownInterval = setInterval(() => {
              cleanupCountdown--;
              if (cleanupCountdown <= 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                cleanupLine.textContent = 'Cleaning...';
                setTimeout(cleanupExport, 800);
              } else {
                cleanupLine.textContent = `Cleanup in ${cleanupCountdown}s`;
              }
            }, 1000);

            downloadHandler = () => {
              if (downloadBtn.getAttribute('aria-disabled') === 'true') return;
              downloadBtn.setAttribute('aria-disabled', 'true');
              downloadBtn.style.opacity = '0.5';
              downloadBtn.style.cursor = 'not-allowed';
              downloadBtn.textContent = 'Downloaded';
              triggerDownload(downloadUrl);

              if (!downloadedOnce) {
                downloadedOnce = true;
                if (cleanupCountdown > 70) cleanupCountdown = 70;
              } else {
                if (cleanupCountdown > 60) cleanupCountdown = 60;
              }

              saveAgainLink.style.display = '';
              saveAgainLink.textContent = 'Download again';
              saveAgainLink.onclick = (e) => {
                e.preventDefault();
                triggerDownload(downloadUrl);
                if (cleanupCountdown > 60) cleanupCountdown = 60;
                saveAgainLink.textContent = 'Download again';
              };
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
        console.error(err);
      }
    }

    scanStep();
  });
})();
