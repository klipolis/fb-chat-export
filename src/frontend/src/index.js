import sharedConfig from '../../../data-config/frontend_shared.json';
import { getContentMeta, stripTrackingParams } from '../../shared/message-metadata.js';
import { normalizeDuration } from '../../shared/duration-utils.js';
import { parseAriaLabel, normalizeDateToIso, extractNameAfterBy, isValidSender } from '../../shared/aria-label-parser/index.js';
import { buildSummary } from '../../shared/export-summary.js';
import { formatExportHeader, formatLine, durationToMinutes } from '../../shared/export-formatter.js';
import {
  parseLocalDate,
  resolveRelativeDate,
  getDisplayPersonName,
  sanitizeFileNamePart,
  formatExportFileName,
} from '../../shared/frontend-utils.mjs';
import { REUSE_EXACT, REUSE_ALIAS_ONLY, REUSE_NARROWER } from '../../shared/constants.js';
import { canReuseCached, filterEntriesByDateRange } from '../../shared/cache-utils.js';
import {
  createDetailsPanel,
  createButton,
  createCheckboxToggle,
  createAliasRows,
  createLabelInput,
  createLinkAction,
} from './ui.js';
import { applyAliasToText, detectAliasCollisions } from '../../shared/alias-utils.js';
import { stripVariantSelectors } from '../../shared/string-utils.js';

(function () {
  const style = document.createElement('style');
  style.textContent = `
.pe-hdr { font-size:12px;color:#555;background:#fafafa;padding:6px 10px; }
.pe-label { color:#555;font-size:12px; }
.pe-label-dull { color:#777;font-size:12px; }
.pe-input { border:1px solid #ccc;border-radius:4px;padding:4px 8px;font-size:12px;outline:none; }
.pe-input-sm { width:100px; }
.pe-btn { color:#fff;border:none;padding:6px 12px;border-radius:5px;font-size:12px;cursor:pointer; }
.pe-link { color:#0084ff;text-decoration:underline;font-size:12px;cursor:pointer; }
.pe-chk { cursor:pointer; }
.pe-chk-label { display:flex;align-items:center;gap:6px;color:#555;font-size:12px;cursor:pointer; }
.pe-flex-row { display:flex;align-items:center;gap:6px; }
.pe-flex-row-4 { display:flex;align-items:center;gap:4px; }
.pe-flex-col { display:flex;flex-direction:column;gap:6px; }
`;
  document.head.appendChild(style);
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

  const noticeStatus = document.createElement('div');
  noticeStatus.style.cssText = 'word-break: break-word;';
  const noticeMsg = document.createElement('span');
  noticeMsg.textContent = 'Ready.';
  const cacheIndicator = document.createElement('span');
  cacheIndicator.style.cssText = 'display:inline-block; width:12px; height:12px; border-radius:50%; background:gray; margin-left:8px; vertical-align:middle;';
  cacheIndicator.title = 'Served from cache';
  cacheIndicator.style.display = 'none';
  noticeStatus.appendChild(noticeMsg);
  noticeStatus.appendChild(cacheIndicator);

  function setCacheIndicator(hit) {
    cacheIndicator.style.display = hit ? 'inline-block' : 'none';
    cacheIndicator.style.background = hit ? '#27ae60' : 'gray';
  }

  const noticeActions = document.createElement('div');
  noticeActions.style.cssText = 'margin-top: 4px;';

  const downloadBtn = createButton('Download .txt', '#27ae60');
  downloadBtn.style.cssText += ' display: none; margin-right: 8px; vertical-align: middle;';

  const copyBtn = createButton('Copy', '#555');
  copyBtn.title = 'Copy export text to clipboard';
  copyBtn.style.cssText += ' display: none; margin-right: 8px; vertical-align: middle;';

  const saveAgainLink = document.createElement('a');
  saveAgainLink.textContent = 'Save again';
  saveAgainLink.href = '#';
  saveAgainLink.style.cssText = 'display: none; font-size: 11px; color: #27ae60; vertical-align: middle;';

  noticeActions.appendChild(downloadBtn);
  noticeActions.appendChild(copyBtn);
  noticeActions.appendChild(saveAgainLink);

  notice.appendChild(noticeStatus);
  notice.appendChild(noticeActions);

  const progressBar = document.createElement('progress');
  progressBar.style.cssText = 'width: 100%; height: 4px; margin-top: 4px; border-radius: 2px;';
  progressBar.max = 100;
  progressBar.value = 0;
  progressBar.style.display = 'none';
  notice.appendChild(progressBar);

  // body: inputs + scan button
  const body = document.createElement('div');
  body.style.cssText = 'display: flex; gap: 10px; padding: 8px 10px; align-items: flex-end;';

  // left column: stacked inputs
  const leftCol = document.createElement('div');
  leftCol.className = 'pe-flex-col';

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
  const builtinAliases = sharedConfig.aliasNames || { You: 'Youghurt', any: 'Alpha' };
  let persistedAliases = {};
  try { const p = JSON.parse(localStorage.getItem('chatExportAliases') || '{}'); if (typeof p === 'object' && !Array.isArray(p)) persistedAliases = p; } catch (_) { /* ignore */ }
  const aliasDefaults = { ...builtinAliases, ...persistedAliases };
  const { wrap: aliasWrap, input: aliasChk, getAliasMap, validateAll: validateAliasRows, setDetectedNames, groupChatChk, addRow: addAliasRow, showCollisions, caseInsensitiveChk } = createAliasRows(aliasDefaults);
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
  const aliasActions = document.createElement('div');
  aliasActions.style.cssText = 'display: flex; gap: 8px; padding-left: 22px;';
  const exportAliasLink = createLinkAction('Export aliases', () => {
    const map = getAliasMap();
    const jsonStr = JSON.stringify(map, null, 2);
    const url = URL.createObjectURL(new Blob([jsonStr], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aliases.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  const importAliasLink = createLinkAction('Import aliases', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid format');
          Array.from(aliasWrap.querySelectorAll('.alias-row')).forEach((row) => {
            const inputs = row.querySelectorAll('input[type="text"]');
            if (inputs.length >= 2 && !inputs[0].disabled) {
              row.remove();
            }
          });
          Object.entries(data).forEach(([orig, alias]) => {
            const exists = Array.from(aliasWrap.querySelectorAll('.alias-row')).some((row) => {
              const inputs = row.querySelectorAll('input[type="text"]');
              return inputs.length >= 2 && inputs[0].value.trim() === orig;
            });
            if (!exists) {
              addAliasRow(orig, alias, false);
            }
          });
        } catch (err) {
          noticeMsg.textContent = 'Invalid aliases file.';
        }
      };
      reader.readAsText(file);
    });
    fileInput.click();
  });
  aliasActions.appendChild(exportAliasLink);
  aliasActions.appendChild(importAliasLink);
  aliasWrap.appendChild(aliasActions);
  rightCol.appendChild(summaryWrap);
  rightCol.appendChild(includeContentWrap);
  rightCol.appendChild(rawLinkWrap);
  rightCol.appendChild(lengthWrap);
  rightCol.appendChild(selectAllLink);

  // Message type filter
  const typeFilterTypes = ['text', 'link', 'pinned-location', 'image', 'reaction', 'audio-call', 'video-call', 'voice-note', 'sticker', 'poll'];
  const typeFilterState = {};
  const typeFilterDetails = document.createElement('details');
  typeFilterDetails.style.cssText = 'font-size: 12px;';
  const typeFilterSummary = document.createElement('summary');
  typeFilterSummary.textContent = 'Filter types';
  typeFilterSummary.style.cssText = 'cursor: pointer; color: #555; font-size: 12px;';
  typeFilterDetails.appendChild(typeFilterSummary);
  typeFilterTypes.forEach((type) => {
    const { wrap, input } = createCheckboxToggle(type);
    input.checked = true;
    typeFilterState[type] = true;
    input.addEventListener('change', () => {
      typeFilterState[type] = input.checked;
    });
    wrap.style.paddingLeft = '14px';
    typeFilterDetails.appendChild(wrap);
  });
  rightCol.insertBefore(typeFilterDetails, rightCol.firstChild);

  // Start with full-info mode selected by default.
  setAllChecked(true);

  try {
    const saved = JSON.parse(sessionStorage.getItem('photoMeetExportOptions'));
    if (saved) {
      if (typeof saved.includeContent === 'boolean') {
        includeContentChk.checked = saved.includeContent;
        includeContentChk.dispatchEvent(new Event('change'));
      }
      if (typeof saved.includeLength === 'boolean') lengthChk.checked = saved.includeLength;
      if (typeof saved.alias === 'boolean') {
        aliasChk.checked = saved.alias;
        aliasChk.dispatchEvent(new Event('change'));
      }
      if (saved.messageTypeFilter && typeof saved.messageTypeFilter === 'object') {
        Object.keys(saved.messageTypeFilter).forEach((type) => {
          if (Object.prototype.hasOwnProperty.call(typeFilterState, type)) {
            typeFilterState[type] = saved.messageTypeFilter[type];
          }
        });
        typeFilterDetails.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
          const label = chk.closest('label');
          if (label) {
            const textSpan = label.querySelector('span');
            if (textSpan && Object.prototype.hasOwnProperty.call(typeFilterState, textSpan.textContent)) {
              chk.checked = typeFilterState[textSpan.textContent];
            }
          }
        });
      }
    }
  } catch (_) { /* ignore */ }

  body.appendChild(leftCol);
  body.appendChild(rightCol);

  panel.appendChild(panelSummary);
  panel.appendChild(notice);
  panel.appendChild(body);

  const previewWrap = document.createElement('div');
  previewWrap.style.cssText = 'display: none; padding: 4px 10px 8px;';
  const previewEl = document.createElement('pre');
  previewEl.style.cssText = 'max-height: 160px; overflow-y: auto; font-size: 11px; line-height: 1.4; background: #f5f5f5; padding: 6px 8px; margin: 0; border-radius: 4px; border: 1px solid #e0e0e0; white-space: pre-wrap; word-break: break-all;';
  previewWrap.appendChild(previewEl);
  panel.appendChild(previewWrap);

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

    // Detect replied-to message
    let repliedTo = null;
    let repliedType = null;
    const replyHeader = el.querySelector('h3 span');
    const isReply = replyHeader && /\breplied to\b/i.test(replyHeader.textContent);
    if (isReply) {
      const quotedEl = el.querySelector('[aria-label="Go to replied message"]');
      if (quotedEl) {
        const imgInQuote = quotedEl.querySelector('img');
        if (imgInQuote) {
          repliedType = 'image';
          repliedTo = imgInQuote.getAttribute('alt') || '[image]';
        } else {
          repliedType = 'text';
          const textSpan = quotedEl.querySelector('span[dir="auto"]');
          repliedTo = textSpan ? textSpan.textContent.replace(/\s+/g, ' ').trim() : null;
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
      repliedTo,
      repliedType,
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

  let exportCache = null;
  let downloadCleanup = null;

  function cleanupExport() {
    if (downloadCleanup) {
      if (downloadCleanup.url && downloadCleanup.url.startsWith('blob:')) {
        URL.revokeObjectURL(downloadCleanup.url);
      }
      downloadCleanup = null;
    }
    downloadBtn.style.display = 'none';
    copyBtn.style.display = 'none';
    saveAgainLink.style.display = 'none';
    saveAgainLink.onclick = null;
    previewWrap.style.display = 'none';
    progressBar.style.display = 'none';
    setScanState('idle');
  }

  function triggerDownload(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }

  function setupDownload(downloadUrl, info) {
    noticeMsg.textContent = `${info.doneLabel}: ${info.messages.length} messages | ${info.personName} | ${info.fromLabel} - ${info.toLabel} | ${info.elapsed}`;

    downloadBtn.style.display = '';
    downloadBtn.removeAttribute('aria-disabled');
    downloadBtn.style.opacity = '';
    downloadBtn.style.cursor = '';
    downloadBtn.textContent = 'Download';
    copyBtn.style.display = '';
    copyBtn.onclick = null;
    saveAgainLink.style.display = 'none';
    saveAgainLink.onclick = null;
    if (downloadHandler) downloadBtn.removeEventListener('click', downloadHandler);

    downloadCleanup = { url: downloadUrl, fileName: info.fileName, text: info.exportText };

    downloadHandler = () => {
      if (downloadBtn.getAttribute('aria-disabled') === 'true') return;
      triggerDownload(downloadUrl, info.fileName);
      downloadBtn.setAttribute('aria-disabled', 'true');
      downloadBtn.style.opacity = '0.5';
      downloadBtn.style.cursor = 'not-allowed';
      downloadBtn.textContent = 'Downloaded';
      saveAgainLink.style.display = '';
      saveAgainLink.onclick = (e) => {
        e.preventDefault();
        triggerDownload(downloadUrl, info.fileName);
      };
    };

    copyBtn.onclick = () => {
      if (!downloadCleanup) return;
      navigator.clipboard.writeText(downloadCleanup.text).then(() => {
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      }).catch(() => {
        copyBtn.textContent = 'Failed';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      });
    };

    if (info.messages.length > 0) {
      previewEl.textContent = info.messages.slice(0, 20).join('');
      previewWrap.style.display = '';
    }

    downloadBtn.addEventListener('click', downloadHandler);
    setScanState('idle');
  }

  function lookupAlias(sender, aliasMap) {
    if (!caseInsensitiveChk.checked) {
      return aliasMap[sender] || aliasMap[sender.toLowerCase()] || aliasMap[sender.toUpperCase()] || aliasMap.any || sender;
    }
    const lower = String(sender).toLowerCase();
    for (const key of Object.keys(aliasMap)) {
      if (key.toLowerCase() === lower) return aliasMap[key];
    }
    return aliasMap.any || sender;
  }

  function computeAliasHash(aliasMap) {
    const sorted = Object.keys(aliasMap).sort().map((k) => `${k}:${aliasMap[k]}`).join('|');
    if (!sorted) return '';
    let hash = 0;
    for (let i = 0; i < sorted.length; i++) {
      hash = ((hash << 5) - hash) + sorted.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && actionBtn.dataset.scanning === 'true') {
      stopRequested = true;
    }
  });

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

    cleanupExport();
    setCacheIndicator(false);

    const personName = getDisplayPersonName();
    const fromVal = fromInput.value.trim();
    const toVal = toInput.value.trim();
    const aliasMap = aliasChk.checked ? getAliasMap() : {};
    const aliasHash = computeAliasHash(aliasMap);

    if (aliasChk.checked) {
      showCollisions(detectAliasCollisions(aliasMap));
    }

    if (downloadRevokeTimeout !== null) {
      clearTimeout(downloadRevokeTimeout);
      downloadRevokeTimeout = null;
    }
    stopRequested = false;
    sessionStorage.setItem('exportFrom', fromVal);
    sessionStorage.setItem('exportTo', toVal);
    sessionStorage.setItem('photoMeetExportOptions', JSON.stringify({
      includeContent: includeContentChk.checked,
      includeLength: lengthChk.checked,
      alias: aliasChk.checked,
      messageTypeFilter: typeFilterState,
    }));

    const reuseMode = canReuseCached(exportCache, personName, fromVal, toVal, aliasHash, parseLocalDate);
    if (reuseMode) {
      const cached = exportCache;
      let headerText = cached.headerText;
      let summaryText = cached.summaryText;
      let messages = cached.messages;

      if (reuseMode === REUSE_ALIAS_ONLY) {
        headerText = formatExportHeader({
          method: 'browser',
          messageTypes: cached.messageTypes,
          exportOptions: cached.exportOptions,
          aliasMap,
        });
        summaryText = buildSummary(cached.rawEntries, { useMessageLabel: true });
        messages = cached.rawEntries.map((e) => {
          const aliasedSender = aliasChk.checked
            ? lookupAlias(e.rawSender, aliasMap)
            : e.rawSender;
          const aliasedContent = aliasChk.checked
            ? applyAliasToText(e.text, aliasMap, e.rawSender)
            : e.text;
          const lineEntry = {
            fileType: e.displayType,
            semanticType: e.semanticType,
            dateText: e.dateText,
            sender: aliasedSender,
            duration: e.duration,
            content: aliasedContent,
            contentLength: e.contentLength,
          };
          return formatLine(lineEntry, {
            includeContent: includeContentChk.checked,
            includeLength: lengthChk.checked,
          });
        });
      } else if (reuseMode === REUSE_NARROWER) {
        const filtered = filterEntriesByDateRange(cached.rawEntries, fromVal, toVal, parseLocalDate);
        headerText = formatExportHeader({
          method: 'browser',
          messageTypes: cached.messageTypes,
          exportOptions: cached.exportOptions,
          aliasMap,
        });
        const displayEntries = filtered.map((e) => ({
          ts: e.ts, sender: e.rawSender, date: new Date(e.ts),
          type: e.semanticType, isCall: e.isCall, isImage: e.isImage,
          callMinutes: e.callMinutes, wordCount: e.wordCount,
        }));
        summaryText = buildSummary(displayEntries, { useMessageLabel: true });
        messages = filtered.map((e) => {
          const aliasedSender = aliasChk.checked
            ? lookupAlias(e.rawSender, aliasMap)
            : e.rawSender;
          const aliasedContent = aliasChk.checked
            ? applyAliasToText(e.text, aliasMap, e.rawSender)
            : e.text;
          const lineEntry = {
            fileType: e.displayType,
            semanticType: e.semanticType,
            dateText: e.dateText,
            sender: aliasedSender,
            duration: e.duration,
            content: aliasedContent,
            contentLength: e.contentLength,
          };
          return formatLine(lineEntry, {
            includeContent: includeContentChk.checked,
            includeLength: lengthChk.checked,
          });
        });
      }

      const cacheFromLabel = fromVal || 'start';
      const cacheToLabel = toVal || 'end';
      const cacheElapsed = '0.0 seconds';
      const cacheFileName = customFileName || formatExportFileName(undefined, { fromDate: fromVal, toDate: toVal });

      const blob = new Blob([headerText + summaryText + messages.join('')], { type: 'text/plain' });
      const downloadUrl = URL.createObjectURL(blob);
      localStorage.setItem('chatExportAliases', JSON.stringify(aliasChk.checked ? getAliasMap() : {}));
      setupDownload(downloadUrl, {
        doneLabel: 'Done',
        messages,
        exportText: headerText + summaryText + messages.join(''),
        personName,
        fromLabel: cacheFromLabel,
        toLabel: cacheToLabel,
        elapsed: cacheElapsed,
        fileName: cacheFileName,
      });
      setCacheIndicator(true);
      return;
    }

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
          repliedTo,
          repliedType,
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
          return lookupAlias(sender, aliasMap);
        })();
        const callMinutes = durationToMinutes(duration);

        if (!includeCallsChk.checked && isCall) return;
        const typeFiltered = type ? String(type).toLowerCase() : '';
        if (typeFiltered && typeFilterState[typeFiltered] === false) return;
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
          repliedTo,
          repliedType,
        };
        const finalLine = formatLine(lineEntry, {
          includeContent: includeContentChk.checked,
          includeLength: lengthChk.checked,
        });
        collected.set(key, {
          ts: isNaN(msgDate) ? 0 : msgDate.getTime(),
          sender: authorLabel,
          rawSender: sender,
          rawText: text,
          date: msgDate,
          type,
          isCall,
          isImage,
          callMinutes,
          wordCount: isCall || isImage ? 0 : (text ? stripVariantSelectors(text).split(/\s+/).filter(Boolean).length : 0),
          line: finalLine,
          exportEntry: lineEntry,
          repliedTo,
          repliedType,
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
        progressBar.style.display = '';
        progressBar.value = scrollPct;
        if (scrollPct > 5) {
          const estimateTotal = Math.round(collected.size / (scrollPct / 100));
          let eta = '';
          if (collected.size > 5 && elapsedSec > 2) {
            const rate = collected.size / elapsedSec;
            const remaining = Math.max(0, estimateTotal - collected.size);
            const remainingSec = rate > 0 ? Math.round(remaining / rate) : 0;
            if (remainingSec > 0) eta = `, ~${remainingSec}s left`;
          }
          noticeMsg.textContent = `Scanning... ${collected.size} / ~${estimateTotal} messages (${elapsedSec}s, ~${scrollPct}% back${eta})`;
        } else {
          noticeMsg.textContent = `Scanning... ${collected.size} collected (${elapsedSec}s)`;
        }

        if (
          stopRequested ||
          reachedFromDate ||
          (scroller.scrollTop <= 0 && stableCount >= 3)
        ) {
          actionBtn.dataset.scanning = 'false';

          if (aliasChk.checked && groupChatChk.checked) {
            setDetectedNames(detectedSenders);
          }

          if (aliasChk.checked) {
            showCollisions(detectAliasCollisions(getAliasMap()));
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

          exportCache = {
            timestamp: Date.now(),
            personName: displayPersonName,
            fromDate: fromInput.value.trim(),
            toDate: toInput.value.trim(),
            aliasHash: computeAliasHash(aliasChk.checked ? getAliasMap() : {}),
            headerText,
            summaryText,
            messageTypes,
            exportOptions: {
              calls: includeCallsChk.checked,
              alias: aliasChk.checked,
              summary: summaryChk.checked,
              content: includeContentChk.checked,
              rawLink: rawLinkChk.checked,
              length: lengthChk.checked,
            },
            rawEntries: sortedEntries.map((e) => ({
              ts: e.ts,
              rawSender: e.rawSender,
              text: e.rawText || '',
              semanticType: e.type,
              displayType: e.exportEntry.fileType,
              dateText: e.exportEntry.dateText,
              duration: e.exportEntry.duration,
              contentLength: e.exportEntry.contentLength,
              isCall: e.isCall,
              isImage: e.isImage,
              callMinutes: e.callMinutes,
              wordCount: e.wordCount,
              repliedTo: e.repliedTo,
              repliedType: e.repliedType,
            })),
            messages,
          };

          try {
            localStorage.setItem('chatExportAliases', JSON.stringify(aliasChk.checked ? getAliasMap() : {}));
            setupDownload(URL.createObjectURL(blob), {
              doneLabel,
              messages,
              exportText: headerText + summaryText + messages.join(''),
              personName: displayPersonName,
              fromLabel,
              toLabel,
              elapsed,
              fileName,
            });
          } catch (_) {
            const reader = new FileReader();
            reader.onload = (e) => setupDownload(e.target.result, {
              doneLabel,
              messages,
              exportText: headerText + summaryText + messages.join(''),
              personName: displayPersonName,
              fromLabel,
              toLabel,
              elapsed,
              fileName,
            });
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
