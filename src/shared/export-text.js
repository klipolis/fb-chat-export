const path = require('path');
const { getContentMeta } = require('./message-metadata');
const { normalizeDuration } = require('./duration-utils');
const { parseAriaLabel, normalizeDateToIso, normalizeLabel } = require('./aria-label-parser');
const {
  formatExportHeader,
  buildExportText,
  formatDate,
  formatLine,
  formatSummarySection,
} = require('./export-formatter');

function normalizeExportSender(sender) {
  if (sender === 'You') return 'Youghurt';
  return sender || 'Unknown';
}

function formatServerExportFileName(mode = 'export-max', { fromDate, toDate } = {}) {
  const from = fromDate ? String(fromDate).slice(0, 10) : '';
  const to = toDate ? String(toDate).slice(0, 10) : '';
  const range = from || to ? `${from || 'start'}–${to || 'end'}` : '';
  const base = range ? `export-${range}` : mode === 'export-minimal' ? 'export-minimal' : 'export-max';
  const suffix = range ? (mode === 'export-minimal' ? '-minimal' : '-max') : '';
  return `${base}${suffix}.txt`;
}

function extractMessageEntry(el, fileName, referenceDate) {
  const ariaLabel = el.getAttribute('aria-label') || '';
  const parsedLabel = parseAriaLabel(ariaLabel);
  const rawDate = parsedLabel.date || '';
  const sender = parsedLabel.sender || '';
  const labelText = parsedLabel.message || '';

  const normalizedText = normalizeLabel(labelText || el.textContent || '');
  const normalizedLabel = normalizeLabel(ariaLabel).toLowerCase();
  const timerEl = el.querySelector('[role="timer"]');
  const linkEl = el.querySelector('a[href]');
  const imageEls = Array.from(el.querySelectorAll('img'));
  const imageCount = imageEls.reduce((count, img) => {
    const altText = normalizeLabel(img.getAttribute('alt') || '');
    const isPersonName = /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/.test(altText);
    return count + (altText && isPersonName ? 0 : 1);
  }, 0);
  const hasImage = imageCount > 0;
  const hasPlayButton = Boolean(el.querySelector('[aria-label="Play"]'));
  // Only treat as link if there is a real URL or <a href>, not just the word 'link'
  const hasLink =
    Boolean(linkEl) ||
    /https?:\/\/|www\./i.test(normalizedText) ||
    /https?:\/\/|www\./i.test(normalizedLabel);
  const timerText = timerEl ? normalizeLabel(timerEl.textContent) : '';
  const normalizedDuration = normalizeDuration(timerText);

  const contentMeta = getContentMeta({
    fileName,
    ariaLabel,
    message: normalizedText,
    rawMeta: {
      duration: normalizedDuration || undefined,
      link: linkEl ? linkEl.getAttribute('href') || undefined : undefined,
    },
    hasImage,
    imageCount,
    hasPlayButton,
    hasLink,
    timerText,
  });

  let resolvedDate;
  try {
    resolvedDate = normalizeDateToIso(rawDate, referenceDate) || rawDate;
  } catch (err) {
    console.warn('export-text: normalizeDateToIso failed for', rawDate, err);
    resolvedDate = rawDate;
  }
  const timestamp = Number.isFinite(Date.parse(resolvedDate)) ? Date.parse(resolvedDate) : 0;

  const isRedundantVoiceText =
    contentMeta.type === 'voice-note' &&
    /^voice(?:[- ]message|[- ]note)$/i.test(contentMeta.text);
  const isRedundantLinkText = contentMeta.type === 'link' && /^link$/i.test(contentMeta.text);
  const body = isRedundantVoiceText
    ? ''
    : isRedundantLinkText
      ? 'link'
      : contentMeta.text === contentMeta.type
        ? ''
        : contentMeta.text;
  const fileType = path.parse(fileName).name;

  return {
    ts: Number.isFinite(timestamp) && !Number.isNaN(timestamp) ? timestamp : 0,
    fileType,
    semanticType: contentMeta.type,
    dateText: formatDate(rawDate, referenceDate),
    rawDate: rawDate || '',
    sender: normalizeExportSender(sender),
    content: body,
    duration: contentMeta.duration,
    contentLength: contentMeta.contentLength,
    imageCount: contentMeta.imageCount,
    words: contentMeta.words,
  };
}

function buildEntriesFromDocument(document, fileName, referenceDate) {
  const entries = [];
  document.querySelectorAll('[aria-roledescription="message"]').forEach((el) => {
    const entry = extractMessageEntry(el, fileName, referenceDate);
    if (entry && entry.semanticType) {
      entries.push(entry);
    }
  });

  const seen = new Set();
  return entries
    .sort((a, b) => a.ts - b.ts)
    .filter((entry) => {
      const key = `${entry.ts}|${entry.fileType}|${entry.sender}|${entry.content}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

module.exports = {
  formatDate,
  formatServerExportFileName,
  formatExportHeader,
  normalizeExportSender,
  extractMessageEntry,
  buildEntriesFromDocument,
  buildExportText,
  formatSummarySection,
  formatLine,
};
