const { isValidSender, SENDER_PATTERN_SOURCE } = require('./sender-constants');

function normalizeLabel(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

const SENDER_LAZY_RE = new RegExp(`^(${SENDER_PATTERN_SOURCE}?)(?:\\s+([\\s\\S]*))?$`, 'u');
const SENDER_COLON_INLINE_RE = new RegExp(`^${SENDER_PATTERN_SOURCE}:\\s`, 'u');
const SENDER_COLON_CAPTURE_RE = new RegExp(`^(${SENDER_PATTERN_SOURCE}):\\s*([\\s\\S]*)$`, 'u');

function splitSenderAndMessage(value) {
  const text = normalizeLabel(value);
  const firstWordMatch = text.match(SENDER_LAZY_RE);
  if (!firstWordMatch) return null;
  let sender = normalizeLabel(firstWordMatch[1]);
  const message = normalizeLabel(firstWordMatch[2] || '');
  sender = extractNameAfterBy(sender);
  if (!isValidSender(sender)) return null;
  return { sender, message };
}

// Extracts the name after "by" if the string contains " by [Name]".
// Returns the cleaned name or the original string.
function extractNameAfterBy(text) {
  const byIndex = text.lastIndexOf(' by ');
  if (byIndex < 0) return text;
  const candidate = text.slice(byIndex + 4).trim();
  if (isValidSender(candidate) && !/^(sent|message|by)$/i.test(candidate)) {
    return candidate;
  }
  return text;
}

let sharedRelativeDateRules = [];
try {
  sharedRelativeDateRules = require('../../data-config/frontend_shared.json').relativeDateRules || [];
} catch (err) {
  console.warn('aria-label-parser: failed to load shared relative date rules', err);
  sharedRelativeDateRules = [];
}

function isValidDateCandidate(text) {
  if (!text) return false;
  const words = text.trim().split(/\s+/);
  if (words.length > 6) return false;
  // Reject text with unusual characters — only letters, digits, spaces, commas, colons, dashes allowed
  return /^[\p{L}\p{N}\s,\-:]+$/u.test(text.trim());
}

function findValidDatePrefix(text, referenceDate) {
  // If " by " appears in text, try up to the first " by " as date
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

function parseAriaLabel(ariaLabel) {
  const label = normalizeLabel(ariaLabel).replace(/\s*,\s*/g, ', ');
  let match;

  match = label.match(/^At\s+(.+?),\s*([\p{L}]+(?:\s+[\p{L}]+){0,2})\s+[-–—]\s*([\s\S]*)$/iu);
  if (match) {
    let sender = match[2].trim();
    let message = match[3].trim();
    // Handle labels like "Alpha Yep — ..." where "Yep" belongs to message text.
    const conversationalToken = sender.match(/\s(Yep|Yes|No|Ok|Okay)$/i);
    if (conversationalToken) {
      sender = sender.slice(0, -conversationalToken[0].length).trim();
      message = `${conversationalToken[1]} - ${message}`;
    }
    return {
      date: match[1].trim(),
      sender,
      message,
    };
  }

  const atPrefix = label.match(/^At\s+([\s\S]*)$/i);
  if (atPrefix) {
    const tailParts = atPrefix[1]
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (tailParts.length >= 3) {
      const maybeSender = tailParts[tailParts.length - 1];
      const maybeDate = tailParts.slice(0, -1).join(', ');
      // Skip last-part-as-sender when a middle part looks like "Sender: message"
      // (the real sender is inline; the last part is trailing context, e.g. conversation name).
      const hasInlineSenderColon = tailParts
        .slice(1, -1)
        .some((p) => SENDER_COLON_INLINE_RE.test(p));
      if (!hasInlineSenderColon) {
        const normalizedSender = extractNameAfterBy(maybeSender.trim());
        if (isValidSender(normalizedSender)) {
          return {
            date: maybeDate.trim(),
            sender: normalizedSender,
            message: '',
          };
        }
      }
    }

    if (tailParts.length >= 2) {
      const maybeDate = tailParts[0];
      const rest = tailParts.slice(1).join(', ');
      // Handle inline "Sender: message" colon format that splitSenderAndMessage cannot parse.
      const inlineMatch = rest.match(SENDER_COLON_CAPTURE_RE);
      if (inlineMatch) {
        const matchedSender = extractNameAfterBy(inlineMatch[1].trim());
        if (isValidSender(matchedSender)) {
          return {
            date: maybeDate.trim(),
            sender: matchedSender,
            message: inlineMatch[2].trim(),
          };
        }
      }
      // "by X" fallback: extract name after " by " from the rest text
      // checked before splitSenderAndMessage because "by" signals the sender
      const byIndex = rest.lastIndexOf(' by ');
      if (byIndex >= 0) {
        const bySender = rest.slice(byIndex + 4).trim();
        const colonIdx = bySender.indexOf(':');
        const nameEnd = colonIdx >= 0 ? colonIdx : bySender.length;
        const potentialBySender = bySender.slice(0, nameEnd).trim();
        if (isValidSender(potentialBySender)) {
          return {
            date: maybeDate.trim(),
            sender: potentialBySender,
            message: colonIdx >= 0 ? bySender.slice(colonIdx + 1).trim() : '',
          };
        }
      }

      const senderAndMessage = splitSenderAndMessage(rest);
      if (senderAndMessage) {
        return {
          date: maybeDate.trim(),
          sender: senderAndMessage.sender,
          message: senderAndMessage.message,
        };
      }
    }
  }

  match = label.match(/^At\s+(.+),\s*([^:]+):\s*([\s\S]*)$/i);
  if (match) {
    const dateValue = match[1].trim();
    const normalizedDate = normalizeDateToIso(dateValue);
    if (normalizedDate || findValidDatePrefix(dateValue)) {
      return {
        date: dateValue,
        sender: match[2].trim(),
        message: match[3].trim(),
      };
    }
  }

  // Iterate through each comma position to find the first valid date/sender boundary.
  // This handles formats like "Month DD, YYYY, H:MM AM, Sender: message" where the
  // lazy-quantifier approach would pick the wrong split (e.g. sender="2026, 7").
  {
    const labelParts = label.split(',');
    for (let i = 1; i < labelParts.length; i++) {
      let datePart = labelParts.slice(0, i).join(',').trim();
      const senderRest = labelParts.slice(i).join(',').trim();
      // Truncate date at " by " if present — date could end before " by "
      const byInDate = datePart.search(/\s+by\s+/i);
      if (byInDate >= 0) datePart = datePart.slice(0, byInDate).trim();
      if (!datePart) continue;
      const colonIdx = senderRest.indexOf(':');
      if (colonIdx < 0) continue;
      if (!isValidDateCandidate(datePart)) continue;
      const potentialSender = extractNameAfterBy(senderRest.slice(0, colonIdx).trim());
      if (isValidSender(potentialSender)) {
        return {
          date: datePart,
          sender: potentialSender,
          message: senderRest.slice(colonIdx + 1).trim(),
        };
      }
    }
  }

  // General "by X" pattern — extract sender name after "by"
  // Handles: "At [date], [Message] sent by [Name]: message"
  {
    const byMatch = label.match(/^At\s+(.+?),\s*(?:Message\s+)?sent\s+by\s+(\p{L}[\p{L} .'\-_]*?)\s*:\s*([\s\S]*)$/iu);
    if (byMatch) {
      const potentialSender = byMatch[2].trim();
      if (isValidSender(potentialSender)) {
        return {
          date: byMatch[1].trim(),
          sender: potentialSender,
          message: byMatch[3].trim(),
        };
      }
    }
  }

  // Fallback: extract any name after " by " in the remaining part of the label
  // This catches unusual phrasing where sender is preceded by "by"
  {
    const pos = label.search(/\bby\s+/i);
    if (pos >= 0) {
      const afterBy = label.slice(pos + 3).trim();
      const colonIdx = afterBy.indexOf(':');
      const nameEnd = colonIdx >= 0 ? colonIdx : afterBy.length;
      const potentialSender = afterBy.slice(0, nameEnd).trim();
      if (isValidSender(potentialSender)) {
        return {
          date: label.slice(0, pos).trim(),
          sender: potentialSender,
          message: colonIdx >= 0 ? afterBy.slice(colonIdx + 1).trim() : '',
        };
      }
    }
  }

  match = label.match(/^Enter,\s*([^:]+?)\s+sent\s+(.+?)\s+by\s+([^:]+):\s*([\s\S]*)$/i);
  if (match) {
    return {
      date: match[2].trim(),
      sender: match[3].trim(),
      message: match[4].trim(),
    };
  }

  match = label.match(/^At\s+(.+),\s*([^:]+)$/i);
  if (match) {
    const senderAndMessage = splitSenderAndMessage(match[2]);
    if (senderAndMessage) {
      return {
        date: match[1].trim(),
        sender: senderAndMessage.sender,
        message: senderAndMessage.message,
      };
    }
    return {
      date: match[1].trim(),
      sender: match[2].trim(),
      message: '',
    };
  }

  match = label.match(/^Enter,\s*([^:]+?)\s+sent\s+(.+?)\s+by\s+([^:]+)$/i);
  if (match) {
    return {
      date: match[2].trim(),
      sender: match[3].trim(),
      message: '',
    };
  }

  // Handle "date:sender" format where colon directly precedes sender (no space)
  {
    const parts = label.split(':');
    const potentialSender = parts.pop().trim();
    if (isValidSender(potentialSender)) {
      const datePart = parts.join(':').trim();
      if (normalizeDateToIso(datePart) || findValidDatePrefix(datePart)) {
        return { date: datePart, sender: potentialSender, message: '' };
      }
    }
  }

  const colonIndex = label.indexOf(':');
  return {
    date: null,
    sender: null,
    message: colonIndex >= 0 ? label.slice(colonIndex + 1).trim() : label,
  };
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
  let text = normalizeLabel(dateString).replace(/^At\s+/i, '');
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
  parseAriaLabel,
  parseReferenceDate,
  normalizeDateToSimple,
  normalizeDateToIso,
  normalizeDateToIsoSafe,
  normalizeLabel,
  isValidSender,
  findValidDatePrefix,
  extractNameAfterBy,
  isValidDateCandidate,
};
