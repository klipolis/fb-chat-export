function _normalizeLabel(text) {
  return require('./core').normalizeLabel(text);
}

let sharedRelativeDateRules = [];
try {
  sharedRelativeDateRules = require('../../../data-config/frontend_shared.json').relativeDateRules || [];
} catch (err) {
  console.warn('aria-label-parser: failed to load shared relative date rules', err);
  sharedRelativeDateRules = [];
}

function isValidDateCandidate(text) {
  if (!text) return false;
  const words = text.trim().split(/\s+/);
  if (words.length > 6) return false;
  return /^[\p{L}\p{N}\s,\-:]+$/u.test(text.trim());
}

function findValidDatePrefix(text, referenceDate) {
  const byIdx = text.search(/\s+by\s+/i);
  const searchText = byIdx >= 0 ? text.slice(0, byIdx) : text;
  const parts = searchText
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  let candidate = '';
  for (let i = 0; i < Math.min(parts.length, 3); i += 1) {
    candidate = candidate ? `${candidate}, ${parts[i]}` : parts[i];
    if (isValidDateCandidate(candidate) && normalizeDateToIso(candidate, referenceDate)) return candidate;
  }
  return null;
}

function parseRelativeRuleMatch(match, ruleName, now) {
  if (!match) return null;
  if (ruleName === 'relativeDay') {
    const [, when, hourPart, minute, meridiem] = match;
    const date = new Date(now);
    if (when.toLowerCase() === 'yesterday') date.setDate(date.getDate() - 1);
    let hour = Number(hourPart);
    if (meridiem) {
      if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
    date.setHours(hour, Number(minute), 0, 0);
    return date;
  }
  if (ruleName === 'weekday') {
    const [, dayName, hourPart = '0', minute = '00', meridiem] = match;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDow = days.indexOf(dayName.toLowerCase());
    if (targetDow < 0) return null;
    const diff = (now.getDay() - targetDow + 7) % 7;
    const date = new Date(now);
    date.setDate(date.getDate() - diff);
    let hour = Number(hourPart);
    if (meridiem) {
      if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
    date.setHours(hour, Number(minute), 0, 0);
    return date;
  }
  if (ruleName === 'timeOnly') {
    const [, hourPart, minute, meridiem] = match;
    const date = new Date(now);
    let hour = Number(hourPart);
    if (meridiem) {
      if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
    date.setHours(hour, Number(minute), 0, 0);
    return date;
  }
  return null;
}

function normalizeSharedRelativeDate(text, referenceDate) {
  if (!Array.isArray(sharedRelativeDateRules) || sharedRelativeDateRules.length === 0) {
    return null;
  }
  const now = parseReferenceDate(referenceDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const rule of sharedRelativeDateRules) {
    if (!rule || !rule.pattern) continue;
    const regex = new RegExp(rule.pattern, 'i');
    const match = text.match(regex);
    if (!match) continue;
    const date = parseRelativeRuleMatch(match, rule.name, today);
    if (!date) continue;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  }
  return null;
}

function parseReferenceDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})$/);
    if (match) {
      return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        0,
        0
      );
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function normalizeDateToSimple(dateString, referenceDate = new Date()) {
  if (!dateString) return null;
  let text = _normalizeLabel(dateString).replace(/^At\s+/i, '');
  const parsed = Date.parse(text);
  if (!isNaN(parsed)) {
    const date = new Date(parsed);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  }

  const sharedNormalized = normalizeSharedRelativeDate(text, referenceDate);
  if (sharedNormalized) return sharedNormalized;

  const now = parseReferenceDate(referenceDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const relativeMatch = text.match(/^(today|yesterday)(?:\s+at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (relativeMatch) {
    const [, when, hourPart, minute, meridiem] = relativeMatch;
    const date = new Date(today);
    if (when.toLowerCase() === 'yesterday') date.setDate(date.getDate() - 1);
    let hour = Number(hourPart);
    if (meridiem) {
      if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
    date.setHours(hour, Number(minute), 0, 0);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minute}`;
  }

  const dayOfWeekMatch = text.match(
    /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:\s+(\d{1,2}):(\d{2})\s*(am|pm)?)?$/i
  );
  if (dayOfWeekMatch) {
    const [, dayName, hourPart = '0', minute = '00', meridiem] = dayOfWeekMatch;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDow = days.indexOf(dayName.toLowerCase());
    const diff = (today.getDay() - targetDow + 7) % 7;
    const date = new Date(today);
    date.setDate(date.getDate() - diff);
    let hour = Number(hourPart);
    if (meridiem) {
      if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
    date.setHours(hour, Number(minute), 0, 0);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minute}`;
  }

  const timeOnlyMatch = text.match(/^(?:at\s*)?(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (timeOnlyMatch) {
    const [, hourPart, minute, meridiem] = timeOnlyMatch;
    const date = new Date(today);
    let hour = Number(hourPart);
    if (meridiem) {
      if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
    date.setHours(hour, Number(minute), 0, 0);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minute}`;
  }

  const fullMatch = text.match(
    /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4}),\s*(\d{1,2}):(\d{2})\s*(am|pm)?$/i
  );
  if (fullMatch) {
    const [, monthName, day, year, hourPart, minute, meridiem] = fullMatch;
    let hour = Number(hourPart);
    if (meridiem) {
      if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
    return `${year}.${String(monthIndex).padStart(2, '0')}.${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${minute}`;
  }

  return text;
}

function normalizeDateToIso(dateString, referenceDate) {
  if (!dateString) return null;
  const normalized = normalizeDateToSimple(dateString, referenceDate);
  if (!normalized) return null;

  const [dayPart, timePart] = normalized.split(' ');
  if (!dayPart || !timePart) return null;

  const [year, month, day] = dayPart.split('.').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeDateToIsoSafe(dateString, referenceDate, sourceLabel) {
  try {
    return normalizeDateToIso(dateString, referenceDate) || dateString;
  } catch (err) {
    console.warn(`${sourceLabel}: normalizeDateToIso failed for`, dateString, err);
    return dateString;
  }
}

module.exports = {
  parseReferenceDate,
  normalizeDateToSimple,
  normalizeDateToIso,
  normalizeDateToIsoSafe,
  findValidDatePrefix,
  isValidDateCandidate,
};
