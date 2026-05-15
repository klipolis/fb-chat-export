// ==UserScript==
// @name         Messenger Chat Exporter
// @namespace    http://tampermonkey.net/
// @version      2.12.0
// @description  Export Messenger chats to text file
// @match        https://www.facebook.com/messages/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const panel = document.createElement('details');
    panel.style.cssText = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #fff; border: 1px solid #ddd; border-radius: 0 0 10px 10px; font-family: sans-serif; font-size: 13px; box-shadow: 0 2px 10px rgba(0,0,0,0.12); min-width: 420px; max-width: calc(100% - 40px);';
    panel.open = true;

    const panelSummary = document.createElement('summary');
    panelSummary.style.cssText = 'cursor: pointer; padding: 6px 10px; font-size: 12px; color: #555; background: #fafafa; display: flex; align-items: center; gap: 6px; user-select: none;';
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
    instructions.style.cssText = 'padding: 6px 10px; font-size: 11px; color: #666; background: #fafafa;';
    instructions.innerText = 'Start at the bottom of the conversation';

    const notice = document.createElement('div');
    notice.style.cssText = 'padding: 6px 10px; font-size: 12px; color: #333;';
    notice.innerHTML = 'Ready.';

    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Download .txt';
    downloadBtn.style.cssText = 'background: #27ae60; color: #fff; border: none; padding: 3px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; display: none; margin-left: 10px; vertical-align: middle;';

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
        inp.style.cssText = 'border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 12px; width: 100px; outline: none;';
        wrap.appendChild(lbl);
        wrap.appendChild(inp);
        return { wrap, inp };
    }

    const { wrap: fromWrap, inp: fromInput } = labeledInput('From:', 'YYYY-MM-DD', (() => { const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString().slice(0, 10); })());
    const { wrap: toWrap, inp: toInput } = labeledInput('To:', 'YYYY-MM-DD', new Date().toISOString().slice(0, 10));

    const actionBtn = document.createElement('button');
    actionBtn.innerText = 'Scan Messages';
    actionBtn.style.cssText = 'background: #0084ff; color: #fff; border: none; padding: 6px 12px; border-radius: 5px; font-size: 12px; cursor: pointer;';

    const rightCol = document.createElement('div');
    rightCol.style.cssText = 'display: flex; flex-direction: column; gap: 8px; min-width: 160px; padding-left: 10px;';

    function settingToggle(labelText) {
        const wrap = document.createElement('label');
        wrap.style.cssText = 'display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px; cursor: pointer;';
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
        wrap.style.cssText = 'display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px;';

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
        textInput.style.cssText = 'border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 12px; width: 110px; outline: none;';

        wrap.appendChild(checkboxLabel);
        wrap.appendChild(textInput);
        return { wrap, inp, textInput };
    }

    const { wrap: ignoreCallsWrap, inp: ignoreCallsChk } = settingToggle('Ignore calls');
    const { wrap: anonymizeWrap, inp: anonymizeChk, textInput: anonymizeInput } = settingToggleWithInput('Anonymize as', 'You');
    const { wrap: summaryWrap, inp: summaryChk } = settingToggle('Summary');
    const { wrap: typeOnlyWrap, inp: typeOnlyChk } = settingToggle('Type only');
    const { wrap: lengthWrap, inp: lengthChk } = settingToggle('Length');
    const selectAllBtn = document.createElement('button');
    selectAllBtn.innerText = 'All';
    selectAllBtn.style.cssText = 'background: #f1f1f1; color: #333; border: 1px solid #ccc; padding: 3px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;';
    selectAllBtn.addEventListener('click', () => {
        ignoreCallsChk.checked = true;
        anonymizeChk.checked = true;
        summaryChk.checked = true;
        typeOnlyChk.checked = true;
        lengthChk.checked = true;
    });

    leftCol.appendChild(fromWrap);
    leftCol.appendChild(toWrap);
    leftCol.appendChild(actionBtn);

    rightCol.appendChild(ignoreCallsWrap);
    rightCol.appendChild(anonymizeWrap);
    rightCol.appendChild(summaryWrap);
    rightCol.appendChild(typeOnlyWrap);
    rightCol.appendChild(lengthWrap);
    rightCol.appendChild(selectAllBtn);

    body.appendChild(leftCol);
    body.appendChild(rightCol);

    panel.appendChild(panelSummary);
    panel.appendChild(instructions);
    panel.appendChild(notice);
    panel.appendChild(body);
    document.body.appendChild(panel);

    function parseLocalDate(str) {
        const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return m ? new Date(+m[1], +m[2] - 1, +m[3]) : NaN;
    }

    function resolveRelativeDate(raw) {
        const lower = raw.trim().toLowerCase();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let resolvedDay = null;
        if (lower.startsWith('today')) {
            resolvedDay = new Date(today);
        } else if (lower.startsWith('yesterday')) {
            resolvedDay = new Date(today); resolvedDay.setDate(today.getDate() - 1);
        } else {
            const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
            const matchedDay = days.find(day => lower.startsWith(day));
            if (matchedDay) {
                const targetDow = days.indexOf(matchedDay);
                const diff = (today.getDay() - targetDow + 7) % 7 || 7;
                resolvedDay = new Date(today); resolvedDay.setDate(today.getDate() - diff);
            }
        }

        if (!resolvedDay) return raw;

        // extract time, e.g. "9:27am", "9:27 AM", "at 9:27 AM"
        const timeMatch = raw.match(/(?:at\s+)?(\d{1,2}:\d{2})\s*(am|pm)/i);
        if (timeMatch) {
            let [, time, meridiem] = timeMatch;
            let [h, min] = time.split(':').map(Number);
            if (meridiem.toLowerCase() === 'pm' && h !== 12) h += 12;
            if (meridiem.toLowerCase() === 'am' && h === 12) h = 0;
            resolvedDay.setHours(h, min, 0, 0);
        }

        return resolvedDay.toISOString();
    }

    function formatDate(raw) {
        const d = new Date(raw);
        if (isNaN(d)) return raw;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} - ${hh}:${min}`;
    }

    function sanitizeFileNamePart(value) {
        const normalized = String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return normalized.slice(0, 20) || 'chat';
    }

    function getConversationName() {
        const title = document.title || '';
        const cleaned = title
            .replace(/\s*[|\-•]\s*messenger.*$/i, '')
            .replace(/\s*messenger\s*$/i, '')
            .trim();
        return cleaned || 'chat';
    }

    function formatExportFileName(count, fromLabel, toLabel) {
        const base = sanitizeFileNamePart(getConversationName());
        const shortName = base.replace(/[^a-z0-9]/g, '').slice(0, 3).padEnd(3, '_');
        const fromPart = sanitizeFileNamePart(fromLabel || 'start');
        const toPart = sanitizeFileNamePart(toLabel || 'end');
        return `fb-chats-${shortName}-${count}-${fromPart}-${toPart}.txt`;
    }

    function extractMessageParts(el) {
        const label = el.getAttribute('aria-label') || '';
        let rawDate = '';
        let sender = '';
        let text = '';

        const fullMatch = label.match(/^At (.+?), ([^:]+):\s*(.+)$/s);
        if (fullMatch) {
            rawDate = fullMatch[1];
            sender = fullMatch[2];
            text = fullMatch[3].trim();
        } else {
            const enterMatch = label.match(/^Enter, Message sent\s+(.+?)\s+by\s+([^:]+):\s*(.+)$/s);
            if (enterMatch) {
                rawDate = enterMatch[1];
                sender = enterMatch[2];
                text = enterMatch[3].trim();
            } else {
                const fallback = label.match(/^At (.+?),\s*(.+)$/);
                if (fallback) {
                    rawDate = fallback[1];
                    sender = fallback[2];
                }
                text = el.innerText.replace(/\s+/g, ' ').replace(/\bCall again\b/gi, '').trim();
            }
        }

        const normalizedText = text.replace(/\s+/g, ' ').trim();
        const normalizedLabel = label.replace(/\s+/g, ' ').trim().toLowerCase();
        const timerEl = el.querySelector('[role="timer"]');
        const hasImage = Boolean(el.querySelector('img'));
        const hasPlayButton = Boolean(el.querySelector('[aria-label="Play"]'));
        const hasLink = Boolean(el.querySelector('a[href]')) || /\b(?:https?:\/\/|www\.|\blink\b)/i.test(normalizedText) || /\b(?:https?:\/\/|www\.|\blink\b)/i.test(normalizedLabel);
        const hasReply = /\breplied to\b/i.test(normalizedText) || /\breply\b/i.test(normalizedText) || /\breply\b/i.test(normalizedLabel);
        const hasUnsent = /\bunsent\b/i.test(normalizedText) || /\bunsent\b/i.test(normalizedLabel);
        const callMatch = normalizedText.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i) || normalizedLabel.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i);
        const voiceMatch = normalizedText.match(/\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i) || normalizedLabel.match(/\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i) || Boolean(timerEl) || hasPlayButton;
        const durationSource = timerEl ? timerEl.innerText : normalizedText;
        const durationMatch = durationSource.match(/(\d+)\s*min/i) || durationSource.match(/(\d+):(\d+)/);
        const durationLength = durationMatch
            ? (durationMatch[2] ? `${Number(durationMatch[1]) + (Number(durationMatch[2]) > 0 ? 1 : 0)} min` : `${Number(durationMatch[1])} min`)
            : null;
        let isCall = false;
        let isImage = false;
        let contentType = 'text';
        let contentText = normalizedText;

        if (hasUnsent) {
            contentType = 'unsent';
            contentText = 'message unsent';
        } else if (callMatch) {
            isCall = true;
            contentType = callMatch[0].toLowerCase().trim();
            contentText = contentType;
        } else if (voiceMatch) {
            contentType = 'voice message';
            contentText = 'voice message';
        } else if (hasImage) {
            isImage = true;
            contentType = 'image';
            contentText = 'image sent';
        } else if (hasLink) {
            contentType = 'link';
            contentText = 'link';
        } else if (hasReply) {
            contentType = 'text';
            contentText = normalizedText;
        } else if (/\b(image|photo|picture|gallery)\b/i.test(normalizedText)) {
            isImage = true;
            contentType = 'image';
            contentText = 'image sent';
        }

        return {
            rawDate,
            sender,
            text: contentText,
            type: contentType,
            isCall,
            isImage,
            contentLength: (isCall || voiceMatch) ? (durationLength || '0 min') : normalizedText.length
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

        if (fromDate !== null && isNaN(fromDate)) { fromInput.style.borderColor = 'red'; return; }
        if (toDate !== null && isNaN(toDate)) { toInput.style.borderColor = 'red'; return; }
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
            document.querySelectorAll('[aria-roledescription="message"]').forEach(el => {
                const key = el.getAttribute('aria-label');
                if (!key || collected.has(key)) return;
                const { rawDate, sender, text, type, isCall, isImage, contentLength } = extractMessageParts(el);
                if (!rawDate || !sender) return;

                const timeEl = el.querySelector('time[datetime]');
                const resolvedRaw = timeEl ? timeEl.getAttribute('datetime') : resolveRelativeDate(rawDate);
                const msgDate = new Date(resolvedRaw);
                const displayDate = formatDate(resolvedRaw);
                const authorLabel = sender === 'You' && anonymizeChk.checked ? (anonymizeInput.value.trim() || '[    ]') : sender;
                const callMinutes = (() => {
                    const m = el.innerText.match(/(\d+)\s*min/i);
                    return m ? Number(m[1]) : 0;
                })();

                if (ignoreCallsChk.checked && isCall) return;
                if (fromDate && !isNaN(msgDate) && msgDate < fromDate) {
                    reachedFromDate = true;
                    return;
                }
                if (toDate && !isNaN(msgDate) && msgDate > toDate) return;
                let finalText = text;
                const lengthLabel = typeof contentLength === 'number' ? `${contentLength} chars` : contentLength;
                if (typeOnlyChk.checked) {
                    finalText = (type === 'image' || type === 'unsent' || type === 'link') ? type : `${type} (${lengthLabel})`;
                } else if (lengthChk.checked && type !== 'image' && type !== 'unsent' && type !== 'link') {
                    finalText = `${text} (${lengthLabel})`;
                }
                collected.set(key, {
                    ts: isNaN(msgDate) ? 0 : msgDate.getTime(),
                    sender: authorLabel,
                    date: msgDate,
                    isCall,
                    isImage,
                    callMinutes,
                    line: `[${displayDate}] ${authorLabel}: ${finalText}\n`
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
                .map(el => {
                    const { rawDate } = extractMessageParts(el);
                    const timeEl = el.querySelector('time[datetime]');
                    const resolvedRaw = timeEl ? timeEl.getAttribute('datetime') : resolveRelativeDate(rawDate);
                    const date = new Date(resolvedRaw);
                    return isNaN(date) ? null : date;
                })
                .filter(Boolean);
            if (!dates.length) return null;
            return new Date(Math.max(...dates.map(d => d.getTime())));
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

            if (actionBtn.dataset.stopped === 'true' || reachedFromDate || (scroller.scrollTop <= 0 && stableCount >= 3)) {
                actionBtn.dataset.scanning = 'false';

                const sortedEntries = Array.from(collected.values())
                    .sort((a, b) => a.ts - b.ts);
                const messages = sortedEntries.map(e => e.line);

                if (messages.length === 0) {
                    notice.innerHTML = 'No messages found.';
                    notice.appendChild(downloadBtn);
                    actionBtn.innerText = 'Scan Messages';
                    actionBtn.style.background = '#0084ff';
                    fromInput.disabled = toInput.disabled = false;
                    return;
                }

                const summaryText = summaryChk.checked ? (() => {
                    const first = sortedEntries[0];
                    const last = sortedEntries[sortedEntries.length - 1];
                    const exportFrom = formatDate(first.date);
                    const exportTo = formatDate(last.date);
                    const totals = new Map();
                    const allDays = new Set();
                    sortedEntries.forEach(entry => {
                        const key = entry.sender;
                        const dateKey = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}-${String(entry.date.getDate()).padStart(2, '0')}`;
                        allDays.add(dateKey);
                        const data = totals.get(key) || { count: 0, days: new Set(), calls: 0, minutes: 0, images: 0 };
                        data.count += 1;
                        data.days.add(dateKey);
                        if (entry.isCall) {
                            data.calls += 1;
                            data.minutes += entry.callMinutes;
                        }
                        if (entry.isImage) {
                            data.images += 1;
                        }
                        totals.set(key, data);
                    });
                    let allText = 0;
                    let allCalls = 0;
                    let allMinutes = 0;
                    let allImages = 0;
                    totals.forEach(data => {
                        allText += Math.max(0, data.count - data.calls - data.images);
                        allCalls += data.calls;
                        allMinutes += data.minutes;
                        allImages += data.images;
                    });
                    const detailLines = [
                        'Summary',
                        `${sortedEntries.length} ${sortedEntries.length === 1 ? 'message' : 'messages'} / ${allDays.size} ${allDays.size === 1 ? 'day' : 'days'}`,
                        `${allText} text / ${allImages} images / ${allCalls} calls (${allMinutes} mins)`,
                        ''
                    ];
                    let index = 0;
                    totals.forEach((data, key) => {
                        index += 1;
                        const textOnly = Math.max(0, data.count - data.calls - data.images);
                        detailLines.push(`Person ${index} (${key})`);
                        detailLines.push(`  ${data.count} ${data.count === 1 ? 'message' : 'messages'} / ${data.days.size} ${data.days.size === 1 ? 'day' : 'days'}`);
                        detailLines.push(`  ${textOnly} text / ${data.images} images / ${data.calls} calls (${data.minutes} mins)`);
                        detailLines.push('');
                    });
                    detailLines.push('---');
                    return detailLines.join('\n') + '\n';
                })() : '';

                const blob = new Blob([summaryText + messages.join('')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);

                const fromLabel = fromInput.value.trim() || 'start';
                const toLabel = toInput.value.trim() || 'end';
                const elapsedMs = Date.now() - scanStartedAt;
                const elapsed = elapsedMs < 60000
                    ? `${(elapsedMs / 1000).toFixed(1)} seconds`
                    : `${(elapsedMs / 60000).toFixed(2)} minutes`;
                const fileName = formatExportFileName(messages.length, fromLabel, toLabel);
                notice.innerHTML = `Done: <b>${messages.length}</b> messages, ${fromLabel} – ${toLabel} (in ${elapsed})`;
                notice.appendChild(downloadBtn);
                downloadBtn.style.display = '';
                downloadBtn.onclick = () => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    a.click();
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
