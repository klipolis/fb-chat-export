const { normalizeDuration } = require('./message-metadata');
const { normalizeDateToIso } = require('./aria-label-parser');
const { buildSummary, buildDetailedSummary, buildSummaryData } = require('./export-summary');

function formatExportHeader({ method, messageTypes, exportOptions = {}, aliasMap = {} }) {
  const types = messageTypes.map((type) => `- ${type}`).join('\n');
  const optionKeys = Object.keys(exportOptions).sort();
  const activeOptions = optionKeys.filter((key) => exportOptions[key]);
  const inactiveOptions = optionKeys.filter((key) => !exportOptions[key]);
  const aliasLines = Object.entries(aliasMap)
    .filter(([key]) => key && aliasMap[key])
    .map(([key, value]) => `  ${key} : ${value}`)
    .join('\n');

  let header = `Method: ${method}\nMessage types:\n${types}\n\n`;
  if (optionKeys.length) {
    header += `Options: ${activeOptions.length ? activeOptions.join(', ') : 'none'}\n`;
    header += `Unused: ${inactiveOptions.length ? inactiveOptions.join(', ') : 'none'}\n\n`;
  }
  if (aliasLines) {
    header += `Aliases:\n${aliasLines}\n\n`;
  }
  return `${header}---\n\n`;
}

function buildExportText(lines, headerLines = '') {
  return `${headerLines}${lines.join('')}`;
}

function formatDate(raw, referenceDate) {
  let dateValue = raw;
  if (typeof raw === 'string') {
    try {
      dateValue = normalizeDateToIso(raw, referenceDate) || raw;
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
  const includeContent = options.includeContent === true;
  const includeLength = options.includeLength !== false;
  const includeRawDate = options.includeRawDate === true;
  const dateText = entry.dateText || 'unknown';
  const sender = entry.sender || 'Unknown';
  const displayType = /^image(?:-\d+)?$/i.test(entry.fileType || '')
    ? 'image'
    : entry.fileType;
  const parts = [displayType];

  if (entry.duration) {
    const ensureNormalized = normalizeDuration(entry.duration) || entry.duration;
    parts.push(ensureNormalized);
  }
  if (includeLength && entry.contentLength) parts.push(entry.contentLength);

  const rawDatePart = includeRawDate && entry.rawDate ? ` (${entry.rawDate})` : '';
  const base = `[${dateText}]${rawDatePart} ${sender}: ${parts.join(' ')}`;
  const contentTypes = new Set(['text', 'link', 'reaction']);
  const shouldShowTextContent =
    includeContent && contentTypes.has(entry.semanticType) && entry.content;
  if (shouldShowTextContent) {
    return `${base} / ${entry.content}\n`;
  }
  return `${base}\n`;
}

function buildEntryFromEntry(entry) {
  const semanticType = String(entry.semanticType || entry.fileType || '').toLowerCase();
  const isTimedCall = ['audio-call', 'video-call', 'voice-note'].includes(semanticType);
  const contentText = String(entry.content || '').trim();
  const textWords = contentText
    ? contentText.split(/\s+/).filter(Boolean).length
    : 0;
  const callSeconds = isTimedCall ? durationToSeconds(entry.duration) : 0;
  return {
    sender: entry.sender,
    date: Number.isFinite(entry.ts) ? new Date(entry.ts) : new Date(NaN),
    type: semanticType,
    isCall: ['audio-call', 'video-call', 'voice-note', 'missed-call', 'missed-audio-call', 'missed-video-call'].includes(semanticType),
    isImage: semanticType === 'image',
    callSeconds,
    wordCount: isTimedCall || semanticType === 'image' ? 0 : (entry.words || textWords),
    imageCount: Number(entry.imageCount || 0),
  };
}

function formatSummarySection(entries = [], options = {}) {
  const summaryEntries = entries.map(buildEntryFromEntry);

  if (options.detailed) {
    return buildDetailedSummary(summaryEntries, {
      fixedParticipants: options.fixedParticipants || null,
      useMessageLabel: Boolean(options.useMessageLabel),
    });
  }

  return buildSummary(summaryEntries, {
    fixedParticipants: options.fixedParticipants || null,
    useMessageLabel: Boolean(options.useMessageLabel),
  });
}

function durationToMinutes(duration) {
  if (!duration) return 0;
  const normalized = normalizeDuration(duration) || duration;
  const hms = String(normalized).match(/^(\d+):(\d{2}):(\d{2})$/);
  if (hms) {
    return Number(hms[1]) * 60 + Number(hms[2]) + Math.ceil(Number(hms[3]) / 60);
  }
  return 0;
}

function durationToSeconds(duration) {
  if (!duration) return 0;
  const normalized = normalizeDuration(duration) || duration;
  const hms = String(normalized).match(/^(\d+):(\d{2}):(\d{2})$/);
  if (hms) {
    return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]);
  }
  return 0;
}

module.exports = {
  formatExportHeader,
  buildExportText,
  formatDate,
  formatLine,
  formatSummarySection,
  buildSummaryData,
  durationToMinutes,
  durationToSeconds,
};
