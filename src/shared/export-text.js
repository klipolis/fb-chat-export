const path = require('path');
const { getContentMeta, normalizeDuration } = require('./message-metadata');
const { parseAriaLabel, normalizeDateToIso } = require('./aria-label-parser');
const { buildUserscriptSummary, buildUserscriptSummaryData } = require('./userscript-summary');

function normalizeLabel(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function normalizeExportSender(sender) {
  if (sender === 'You' || sender === 'Yoghurt') return 'Youghurt';
  return sender || 'Unknown';
}

function formatDate(raw) {
  let dateValue = raw;
  if (typeof raw === 'string') {
    try {
      dateValue = normalizeDateToIso(raw) || raw;
    } catch {
      dateValue = raw;
    }
  }
  const date = new Date(dateValue);
  if (isNaN(date)) return String(raw || '');
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function formatExportFileName(mode = 'content-on') {
  return mode === 'content-off' ? 'fb-chats-export-content-off.txt' : 'fb-chats-export-content-on.txt';
}

function formatExportHeader({ method, messageTypes }) {
  const types = messageTypes.map(type => `- ${type}`).join('\n');
  return `Method: ${method}\nMessage types:\n${types}\n---\n\n`;
}

function extractMessageEntry(el, fileName) {
  const ariaLabel = el.getAttribute('aria-label') || '';
  const parsedLabel = parseAriaLabel(ariaLabel);
  const rawDate = parsedLabel.date || '';
  const sender = parsedLabel.sender || '';
  const labelText = parsedLabel.message || '';

  const normalizedText = normalizeLabel(labelText || (el.textContent || ''));
  const normalizedLabel = normalizeLabel(ariaLabel).toLowerCase();
  const timerEl = el.querySelector('[role="timer"]');
  const linkEl = el.querySelector('a[href]');
  const hasImage = Boolean(el.querySelector('img'));
  const hasPlayButton = Boolean(el.querySelector('[aria-label="Play"]'));
  // Only treat as link if there is a real URL or <a href>, not just the word 'link'
  const hasLink = Boolean(linkEl)
    || /https?:\/\/|www\./i.test(normalizedText)
    || /https?:\/\/|www\./i.test(normalizedLabel);
  const timerText = timerEl ? normalizeLabel(timerEl.textContent) : '';
  const normalizedDuration = normalizeDuration(timerText);

  const contentMeta = getContentMeta({
    fileName,
    ariaLabel,
    message: normalizedText,
    rawMeta: {
      duration: normalizedDuration || undefined,
      link: linkEl ? linkEl.getAttribute('href') || undefined : undefined
    },
    hasImage,
    hasPlayButton,
    hasLink,
    timerText
  });

  let resolvedDate;
  try {
    resolvedDate = normalizeDateToIso(rawDate) || rawDate;
  } catch {
    resolvedDate = rawDate;
  }
  const timestamp = Number.isFinite(Date.parse(resolvedDate)) ? Date.parse(resolvedDate) : 0;

  const isRedundantVoiceText = contentMeta.type === 'voice-message' && /^voice(?:[- ]message|[- ]note)$/i.test(contentMeta.text);
  const isRedundantLinkText = contentMeta.type === 'link' && /^link$/i.test(contentMeta.text);
  const body = isRedundantVoiceText ? '' : (isRedundantLinkText ? 'link' : contentMeta.text === contentMeta.type ? '' : contentMeta.text);
  const fileType = path.parse(fileName).name;

  return {
    ts: Number.isFinite(timestamp) && !Number.isNaN(timestamp) ? timestamp : 0,
    fileType,
    semanticType: contentMeta.type,
    dateText: formatDate(rawDate),
    sender: normalizeExportSender(sender),
    content: body,
    duration: contentMeta.duration,
    contentLength: contentMeta.contentLength
  };
}

function buildEntriesFromDocument(document, fileName) {
  const entries = [];
  document.querySelectorAll('[aria-roledescription="message"]').forEach(el => {
    const entry = extractMessageEntry(el, fileName);
    if (entry && entry.semanticType) {
      entries.push(entry);
    }
  });

  const seen = new Set();
  return entries
    .sort((a, b) => a.ts - b.ts)
    .filter(entry => {
      const key = `${entry.ts}|${entry.fileType}|${entry.sender}|${entry.content}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildExportText(lines, headerLines = '') {
  return `${headerLines}${lines.join('')}`;
}

function durationToMinutes(duration) {
  if (!duration) return 0;
  const normalized = normalizeDuration(duration) || duration;
  const hms = String(normalized).match(/^(\d+):(\d{2}):(\d{2})\s+mins$/i);
  const ms = String(normalized).match(/^(\d+):(\d{2})\s+mins$/i);
  const mins = String(normalized).match(/^(\d+)\s+mins$/i);
  if (hms) {
    return (Number(hms[1]) * 60) + Number(hms[2]) + Math.ceil(Number(hms[3]) / 60);
  }
  if (ms) {
    return Number(ms[1]) + Math.ceil(Number(ms[2]) / 60);
  }
  if (mins) {
    return Number(mins[1]);
  }
  return 0;
}

function formatSummarySection(entries = []) {
  const summaryEntries = entries.map(entry => {
    const fileType = String(entry.fileType || '').toLowerCase();
    const isCall = ['audio-call', 'video-call', 'voice-note', 'missed-audio-call', 'missed-video-call'].includes(fileType);
    const isTimedCall = ['audio-call', 'video-call', 'voice-note'].includes(fileType);
    return {
      sender: entry.sender,
      date: Number.isFinite(entry.ts) ? new Date(entry.ts) : new Date(NaN),
      type: fileType,
      isCall,
      isImage: fileType === 'image',
      callMinutes: isTimedCall ? durationToMinutes(entry.duration) : 0
    };
  });

  return buildUserscriptSummary(summaryEntries, { fixedParticipants: ['Alpha', 'Youghurt'] });
}

function buildSummaryData(entries = []) {
  const summaryEntries = entries.map(entry => {
    const fileType = String(entry.fileType || '').toLowerCase();
    const isCall = ['audio-call', 'video-call', 'voice-note', 'missed-audio-call', 'missed-video-call'].includes(fileType);
    const isTimedCall = ['audio-call', 'video-call', 'voice-note'].includes(fileType);
    return {
      sender: entry.sender,
      date: Number.isFinite(entry.ts) ? new Date(entry.ts) : new Date(NaN),
      type: fileType,
      isCall,
      isImage: fileType === 'image',
      callMinutes: isTimedCall ? durationToMinutes(entry.duration) : 0
    };
  });

  return buildUserscriptSummaryData(summaryEntries, { fixedParticipants: ['Alpha', 'Youghurt'] });
}

function formatLine(entry, options = {}) {
  const includeContent = options.includeContent !== false;
  const includeLength = options.includeLength !== false;
  const dateText = entry.dateText || 'unknown';
  const sender = entry.sender || 'Unknown';
  const parts = [entry.fileType];
  // Always ensure duration is normalized to standardized format (e.g., "3:20 mins", "31 mins")
  if (entry.duration) {
    const ensureNormalized = normalizeDuration(entry.duration) || entry.duration;
    parts.push(ensureNormalized);
  }
  if (includeLength && entry.contentLength) parts.push(entry.contentLength);
  const base = `[${dateText}] ${sender}: ${parts.join(' ')}`;
  const contentTypes = new Set(['text', 'link']);
  const shouldShowTextContent = includeContent && contentTypes.has(entry.semanticType) && entry.content;
  if (shouldShowTextContent) {
    return `${base} / ${entry.content}\n`;
  }
  return `${base}\n`;
}

module.exports = {
  formatDate,
  formatExportFileName,
  formatExportHeader,
  extractMessageEntry,
  buildEntriesFromDocument,
  buildExportText,
  formatSummarySection,
  buildSummaryData,
  formatLine
};
