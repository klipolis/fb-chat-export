import { normalizeDateToIso } from './aria-label-parser.js';

export function parseLocalDate(str) {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : NaN;
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
  return normalized.slice(0, 20) || 'chat';
}

export function getConversationName() {
  const title = document.title || '';
  const cleaned = title
    .replace(/\s*[|\-•]\s*messenger.*$/i, '')
    .replace(/\s*messenger\s*$/i, '')
    .trim();
  return cleaned || 'chat';
}

export function getDisplayPersonName() {
  const name = getConversationName();
  const parts = name
    .split(/\s*(?:,|&|\band\b|\+|\/)\s*/i)
    .map(part => part.trim())
    .filter(Boolean);
  const firstNonYou = parts.find(part => !/^you$/i.test(part));
  if (firstNonYou) return firstNonYou;

  const withoutYou = name.replace(/\byou\b/ig, '').replace(/\s{2,}/g, ' ').trim();
  return withoutYou || 'chat';
}

export function formatExportFileName() {
  const base = sanitizeFileNamePart(getConversationName());
  const shortName = base.replace(/[^a-z0-9]/g, '').slice(0, 3).padEnd(3, '_');
  return `fb-chats-export-${shortName}.txt`;
}
