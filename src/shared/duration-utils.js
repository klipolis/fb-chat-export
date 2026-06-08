const { normalizeLabel } = require('./aria-label-parser');

function formatDurationSeconds(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function normalizeDuration(text) {
  if (!text) return null;
  const normalized = String(text).trim();
  const suffix = normalized.match(/\b(?:am|pm)\b/i);

  const hhmmss = normalized.match(/^(\d+):(\d{2}):(\d{2})(?!\s*(?:am|pm)\b)/i);
  if (hhmmss && !suffix) {
    const totalSeconds = Number(hhmmss[1]) * 3600 + Number(hhmmss[2]) * 60 + Number(hhmmss[3]);
    return formatDurationSeconds(totalSeconds);
  }

  const hhmm = normalized.match(/^(\d+):(\d{2})(?!\s*(?:am|pm)\b)/i);
  if (hhmm && !suffix) {
    const totalSeconds = Number(hhmm[1]) * 60 + Number(hhmm[2]);
    return formatDurationSeconds(totalSeconds);
  }

  const minMatch = normalized.match(/(\d+(?:\.\d+)?)\s*min(?:s)?/i);
  if (minMatch) {
    const totalSeconds = parseFloat(minMatch[1]) * 60;
    return formatDurationSeconds(totalSeconds);
  }

  const secMatch = normalized.match(/(\d+)\s*sec/i);
  if (secMatch) {
    return formatDurationSeconds(parseInt(secMatch[1], 10));
  }

  return null;
}

function extractRawDuration(text) {
  if (!text) return null;
  const normalized = normalizeLabel(text);
  const hhmmss = normalized.match(/(\d+:\d{2}:\d{2})/i);
  if (hhmmss) return hhmmss[1];
  const mmss = normalized.match(/(\d+:\d{2})(?!\s*(?:am|pm)\b)/i);
  if (mmss) return mmss[1];
  const mins = normalized.match(/(\d+(?:\.\d+)?\s*min(?:s)?)/i);
  if (mins) return mins[1];
  const secs = normalized.match(/(\d+\s*sec(?:ond)?s?)/i);
  if (secs) return secs[1];
  return null;
}

function durationToMinutes(duration) {
  const seconds = durationToSeconds(duration);
  return Math.ceil(seconds / 60);
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
  normalizeDuration,
  extractRawDuration,
  formatDurationSeconds,
  durationToMinutes,
  durationToSeconds,
};
