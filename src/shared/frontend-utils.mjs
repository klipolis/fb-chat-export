import { normalizeDateToIso } from './aria-label-parser.js';

export function parseLocalDate(str) {
  if (!str) return NaN;
  const s = str.trim();
  // YYYY-MM-DD or YYYY/MM/DD
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY (year at end)
  const dmy = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  return NaN;
}

export function resolveRelativeDate(raw) {
  return normalizeDateToIso(raw) || raw;
}

export function sanitizeFileNamePart(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.slice(0, 40) || 'chat';
}

export function getConversationName() {
  const title = document.title || '';
  const cleaned = title
    .replace(/\s*[|\-•]\s*messenger.*$/i, '')
    .replace(/\s*messenger\s*$/i, '')
    .trim();
  if (cleaned) return cleaned;
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent.trim()) return h1.textContent.trim();
  return 'chat';
}

export function getDisplayPersonName() {
  const name = getConversationName();
  const parts = name
    .split(/\s*(?:,|&|\band\b|\+|\/)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
  const firstNonYou = parts.find((part) => !/^you$/i.test(part));
  if (firstNonYou) return firstNonYou;

  const withoutYou = name
    .replace(/\byou\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return withoutYou || 'chat';
}

export function formatExportFileName(mode, { fromDate, toDate } = {}) {
  const conversationName = getConversationName();
  const base = sanitizeFileNamePart(conversationName);
  const shortName = base
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 3)
    .padEnd(3, '_');
  if (fromDate || toDate) {
    const from = (fromDate || '').slice(0, 10).replace(/-/g, '');
    const to = (toDate || '').slice(0, 10).replace(/-/g, '');
    const range = `${from || 'start'}--${to || 'end'}`;
    return `chat-export-${range}-${shortName}.txt`;
  }
  return `chat-export-${shortName}.txt`;
}
