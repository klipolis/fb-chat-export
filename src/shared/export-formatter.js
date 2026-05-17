const { normalizeDuration } = require('./message-metadata');
const { normalizeDateToIso } = require('./aria-label-parser');
const { buildUserscriptSummary, buildUserscriptSummaryData } = require('./userscript-summary');

function formatExportHeader({ method, messageTypes }) {
  const types = messageTypes.map(type => `- ${type}`).join('\n');
  return `Method: ${method}\nMessage types:\n${types}\n---\n\n`;
}

function buildExportText(lines, headerLines = '') {
  return `${headerLines}${lines.join('')}`;
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

function formatLine(entry, options = {}) {
  const includeContent = options.includeContent !== false;
  const includeLength = options.includeLength !== false;
  const dateText = entry.dateText || 'unknown';
  const sender = entry.sender || 'Unknown';
  const parts = [entry.fileType];

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

function formatSummarySection(entries = [], options = {}) {
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

  return buildUserscriptSummary(summaryEntries, {
    fixedParticipants: ['Alpha', 'Youghurt'],
    useMessageLabel: Boolean(options.useMessageLabel)
  });
}

function buildSummaryData(entries = [], options = {}) {
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

  return buildUserscriptSummaryData(summaryEntries, {
    fixedParticipants: ['Alpha', 'Youghurt'],
    useMessageLabel: Boolean(options.useMessageLabel)
  });
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

module.exports = {
  formatExportHeader,
  buildExportText,
  formatDate,
  formatLine,
  formatSummarySection,
  buildSummaryData
};
