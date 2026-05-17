// ==UserScript==
// @name         Messenger Chat Exporter
// @namespace    http://tampermonkey.net/
// @version      5.0.4
// @description  Export Messenger chats to text file
// @match        https://www.facebook.com/messages/*
// @grant        none
// ==/UserScript==

import { getContentMeta, normalizeDuration } from '../../shared/message-metadata.js';
import { parseAriaLabel, normalizeDateToIso } from '../../shared/aria-label-parser.js';
import { buildUserscriptSummary } from '../../shared/userscript-summary.js';
import { formatExportHeader, formatLine } from '../../shared/export-formatter.js';
import {
  parseLocalDate,
  resolveRelativeDate,
  getDisplayPersonName,
  formatExportFileName,
} from '../../shared/frontend-utils.js';

(function () {
  'use strict';

  const panel = document.createElement('details');
  panel.style.cssText =
    'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #fff; border: 1px solid #ddd; border-radius: 0 0 10px 10px; font-family: sans-serif; font-size: 13px; box-shadow: 0 2px 10px rgba(0,0,0,0.12); min-width: 420px; max-width: calc(100% - 40px);';
  panel.open = true;

  const panelSummary = document.createElement('summary');
  panelSummary.style.cssText =
    'cursor: pointer; padding: 6px 10px; font-size: 12px; color: #555; background: #fafafa; display: flex; align-items: center; gap: 6px; user-select: none;';
  const panelArrow = document.createElement('span');
  panelArrow.innerText = '▲';
  panelArrow.style.cssText = 'font-size: 10px; color: #aaa;';
  const panelTitle = document.createElement('span');
  panelTitle.innerText = 'Export Messages';
  panelSummary.appendChild(panelArrow);
  panelSummary.appendChild(panelTitle);

  panel.addEventListener('toggle', () => {
    panelArrow.innerText = panel.open ? '▲' : '▼';
  });

  const instructions = document.createElement('div');
  instructions.style.cssText =
    'padding: 6px 10px; font-size: 11px; color: #666; background: #fafafa;';
  instructions.innerText = 'Start at the bottom of the conversation';

  const notice = document.createElement('div');
  notice.style.cssText = 'padding: 6px 10px; font-size: 12px; color: #333;';
  notice.innerHTML = 'Ready.';

  const buttonStyle =
    'color: #fff; border: none; padding: 6px 12px; border-radius: 5px; font-size: 12px; cursor: pointer;';
  const downloadBtn = document.createElement('button');
  downloadBtn.innerText = 'Download .txt';
  downloadBtn.style.cssText = `${buttonStyle} background: #27ae60; display: none; margin-left: 10px; vertical-align: middle;`;

  // body: inputs + scan button
  const body = document.createElement('div');
  body.style.cssText = 'display: flex; gap: 10px; padding: 8px 10px; align-items: flex-end;';

  // left column: stacked inputs
  const leftCol = document.createElement('div');
  leftCol.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

  function labeledInput(labelText, placeholder, value) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display: flex; align-items: center; gap: 6px;';
    const lbl = document.createElement('span');
    lbl.innerText = labelText;
    lbl.style.cssText = 'color: #777; font-size: 12px; width: 32px;';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = placeholder;
    inp.value = value;
    inp.style.cssText =
      'border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 12px; width: 100px; outline: none;';
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    return { wrap, inp };
  }

  const { wrap: fromWrap, inp: fromInput } = labeledInput(
    'From:',
    'YYYY-MM-DD',
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 3);
      return d.toISOString().slice(0, 10);
    })()
  );
  const { wrap: toWrap, inp: toInput } = labeledInput(
    'To:',
    'YYYY-MM-DD',
    new Date().toISOString().slice(0, 10)
  );

  const actionBtn = document.createElement('button');
  actionBtn.innerText = 'Scan Messages';
  actionBtn.style.cssText = `${buttonStyle} background: #0084ff;`;

  const rightCol = document.createElement('div');
  rightCol.style.cssText =
    'display: flex; flex-direction: column; gap: 8px; min-width: 160px; padding-left: 10px;';

  function settingToggle(labelText) {
    const wrap = document.createElement('label');
    wrap.style.cssText =
      'display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px; cursor: pointer;';
    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.checked = false;
    inp.style.cssText = 'cursor: pointer;';
    const text = document.createElement('span');
    text.innerText = labelText;
    wrap.appendChild(inp);
    wrap.appendChild(text);
    return { wrap, inp };
  }

  function settingToggleWithInput(labelText, inputValue) {
    const wrap = document.createElement('div');
    wrap.style.cssText =
      'display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px;';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer;';
    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.checked = false;
    inp.style.cssText = 'cursor: pointer;';
    const text = document.createElement('span');
    text.innerText = labelText;
    checkboxLabel.appendChild(inp);
    checkboxLabel.appendChild(text);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = inputValue;
    textInput.placeholder = inputValue;
    textInput.style.cssText =
      'border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 12px; width: 110px; outline: none;';

    wrap.appendChild(checkboxLabel);
    wrap.appendChild(textInput);
    return { wrap, inp, textInput };
  }

  const { wrap: includeCallsWrap, inp: includeCallsChk } = settingToggle('Include calls');
  const {
    wrap: anonymizeWrap,
    inp: anonymizeChk,
    textInput: anonymizeInput,
  } = settingToggleWithInput('Anonymize as', 'Youghurt');
  const { wrap: summaryWrap, inp: summaryChk } = settingToggle('Summary');
  const { wrap: includeContentWrap, inp: includeContentChk } = settingToggle('Include content');
  const { wrap: lengthWrap, inp: lengthChk } = settingToggle('Length');
  const selectAllBtn = document.createElement('button');
  selectAllBtn.innerText = 'All';
  selectAllBtn.style.cssText =
    'background: #f1f1f1; color: #333; border: 1px solid #ccc; padding: 4px 10px; border-radius: 5px; font-size: 12px; cursor: pointer;';
  selectAllBtn.addEventListener('click', () => {
    includeCallsChk.checked = true;
    anonymizeChk.checked = true;
    summaryChk.checked = true;
    includeContentChk.checked = true;
    lengthChk.checked = true;
  });

  leftCol.appendChild(fromWrap);
  leftCol.appendChild(toWrap);
  leftCol.appendChild(actionBtn);

  rightCol.appendChild(includeCallsWrap);
  rightCol.appendChild(anonymizeWrap);
  rightCol.appendChild(summaryWrap);
  rightCol.appendChild(includeContentWrap);
  rightCol.appendChild(lengthWrap);
  rightCol.appendChild(selectAllBtn);

  // Start with full-info mode selected by default.
  selectAllBtn.click();

  body.appendChild(leftCol);
  body.appendChild(rightCol);

  panel.appendChild(panelSummary);
  panel.appendChild(instructions);
  panel.appendChild(notice);
  panel.appendChild(body);
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

  actionBtn.addEventListener('click', () => {
    if (actionBtn.dataset.scanning === 'true') {
      actionBtn.dataset.stopped = 'true';
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
      return;
    }
    if (toDate !== null && isNaN(toDate)) {
      toInput.style.borderColor = 'red';
      return;
    }
    fromInput.style.borderColor = toInput.style.borderColor = '#ccc';

    fromInput.disabled = toInput.disabled = true;
    actionBtn.innerText = 'Stop Scan';
    actionBtn.style.background = '#e74c3c';
    actionBtn.dataset.scanning = 'true';
    actionBtn.dataset.stopped = 'false';
    downloadBtn.style.display = 'none';
    notice.innerHTML = 'Scanning: <b>0</b>';
    notice.appendChild(downloadBtn);

    const collected = new Map();

    let reachedFromDate = false;

    function collectVisible() {
      document.querySelectorAll('[aria-roledescription="message"]').forEach((el) => {
        const key = el.getAttribute('aria-label');
        if (!key || collected.has(key)) return;
        const { rawDate, sender, text, type, isCall, isImage, duration, contentLength } =
          extractMessageParts(el);
        if (!rawDate || !sender) return;

        const timeEl = el.querySelector('time[datetime]');
        const resolvedRaw = timeEl ? timeEl.getAttribute('datetime') : resolveRelativeDate(rawDate);
        const msgDate = new Date(resolvedRaw);
        const displayDate = formatDate(resolvedRaw);
        const authorLabel =
          anonymizeChk.checked && String(sender).toLowerCase() === 'you'
            ? anonymizeInput.value.trim() || 'Youghurt'
            : sender;
        const callMinutes = (() => {
          const m = el.innerText.match(/(\d+)\s*min/i);
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
      notice.innerHTML = 'Could not find the message list. Make sure a conversation is open.';
      actionBtn.innerText = 'Scan Messages';
      actionBtn.style.background = '#0084ff';
      actionBtn.dataset.scanning = 'false';
      fromInput.disabled = toInput.disabled = false;
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

    let prevScrollTop = -1;
    let stableCount = 0;
    let scrollTimeout = null;

    function scanStep() {
      collectVisible();
      notice.innerHTML = `Scanning... <b>${collected.size}</b> messages collected.`;
      notice.appendChild(downloadBtn);

      if (
        actionBtn.dataset.stopped === 'true' ||
        reachedFromDate ||
        (scroller.scrollTop <= 0 && stableCount >= 3)
      ) {
        actionBtn.dataset.scanning = 'false';

        const sortedEntries = Array.from(collected.values()).sort((a, b) => a.ts - b.ts);
        const messages = sortedEntries.map((e) => e.line);

        if (messages.length === 0) {
          notice.innerHTML = 'No messages found.';
          notice.appendChild(downloadBtn);
          actionBtn.innerText = 'Scan Messages';
          actionBtn.style.background = '#0084ff';
          fromInput.disabled = toInput.disabled = false;
          return;
        }

        const summaryText = summaryChk.checked
          ? buildUserscriptSummary(sortedEntries, { useMessageLabel: true })
          : '';
        const messageTypes = Array.from(
          new Set(sortedEntries.map((entry) => entry.type).filter(Boolean))
        ).sort();
        const headerText = formatExportHeader({ method: 'browser', messageTypes });

        const blob = new Blob([headerText + summaryText + messages.join('')], {
          type: 'text/plain',
        });
        const url = URL.createObjectURL(blob);

        const fromLabel = fromInput.value.trim() || 'start';
        const toLabel = toInput.value.trim() || 'end';
        const elapsedMs = Date.now() - scanStartedAt;
        const elapsed =
          elapsedMs < 60000
            ? `${(elapsedMs / 1000).toFixed(1)} seconds`
            : `${(elapsedMs / 60000).toFixed(2)} minutes`;
        const displayPersonName = getDisplayPersonName();
        const fileName = formatExportFileName();
        notice.textContent = `Done: ${messages.length} messages | ${displayPersonName} | ${fromLabel} - ${toLabel} | ${elapsed}`;
        notice.appendChild(downloadBtn);
        downloadBtn.style.display = '';
        downloadBtn.onclick = () => {
          if (downloadBtn.disabled) return;
          downloadBtn.disabled = true;
          downloadBtn.style.opacity = '0.5';
          downloadBtn.style.cursor = 'not-allowed';
          const originalLabel = downloadBtn.innerText;
          downloadBtn.innerText = 'Downloaded';
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
            downloadBtn.style.cursor = 'pointer';
            downloadBtn.innerText = originalLabel;
          }, 10000);
        };

        actionBtn.innerText = 'Scan Messages';
        actionBtn.style.background = '#0084ff';
        fromInput.disabled = toInput.disabled = false;
        return;
      }

      const nextTop = Math.max(0, scroller.scrollTop - Math.max(800, scroller.clientHeight - 100));
      if (Math.abs(nextTop - scroller.scrollTop) < 5) {
        stableCount += 1;
      } else {
        stableCount = 0;
        scroller.scrollTop = nextTop;
      }
      prevScrollTop = scroller.scrollTop;
      const delay = 500 + Math.random() * 500;
      scrollTimeout = setTimeout(scanStep, delay);
    }

    scanStep();
  });
})();
