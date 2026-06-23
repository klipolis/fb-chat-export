import { normalizeDateToIso, isValidSender } from './aria-label-parser/index.js';

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
  const iso = normalizeDateToIso(raw);
  if (iso) return iso;
  const timeOnly = String(raw || '')
    .trim()
    .match(/^(?:\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)$/i);
  if (timeOnly) {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [timePart, meridiem] = timeOnly[0].trim().split(/\s+/);
    const parts = timePart.split(':').map(Number);
    let hour = parts[0];
    const minute = parts[1] || 0;
    const second = parts[2] || 0;
    if (meridiem) {
      const m = meridiem.toLowerCase();
      if (m === 'pm' && hour < 12) hour += 12;
      if (m === 'am' && hour === 12) hour = 0;
    }
    date.setHours(hour, minute, second, 0);
    return date.toISOString();
  }
  return raw;
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

export function detectCurrentUserName() {
  const candidates = [];

  const profileImg = document.querySelector('[data-pagelet="LeftSidebar"] img[alt], [role="navigation"] img[alt], [aria-label*="Profile" i] img[alt], [aria-label*="Account" i] img[alt]');
  if (profileImg) {
    const alt = (profileImg.getAttribute('alt') || '').trim();
    if (alt && isValidSender(alt)) candidates.push(alt);
  }

  const profileEl = document.querySelector('[aria-label*="Profile" i]');
  if (profileEl) {
    const label = profileEl.getAttribute('aria-label') || '';
    const cleaned = label.replace(/^(your\s+)?profile\s*/i, '').trim();
    if (cleaned && isValidSender(cleaned) && cleaned.toLowerCase() !== 'you') candidates.push(cleaned);
  }

  const pagelet = document.querySelector('[data-pagelet*="Profile" i]');
  if (pagelet) {
    const text = pagelet.textContent.trim();
    if (text && isValidSender(text)) candidates.push(text);
  }

  const sidebarImgs = document.querySelectorAll('[role="navigation"] img[alt], [data-pagelet="LeftSidebar"] img[alt]');
  sidebarImgs.forEach((img) => {
    const alt = (img.getAttribute('alt') || '').trim();
    if (alt && isValidSender(alt) && !candidates.includes(alt)) candidates.push(alt);
  });

  return candidates.find((name) => name.toLowerCase() !== 'you') || null;
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
