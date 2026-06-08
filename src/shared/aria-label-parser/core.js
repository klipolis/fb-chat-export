const { isValidSender, SENDER_PATTERN_SOURCE } = require('../sender-constants');
const { extractNameAfterBy } = require('./sender-utils');
const { findValidDatePrefix, normalizeDateToIso, isValidDateCandidate } = require('./date-utils');

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

function parseAriaLabel(ariaLabel) {
  const label = normalizeLabel(ariaLabel).replace(/\s*,\s*/g, ', ');
  let match;

  match = label.match(/^At\s+(.+?),\s*([\p{L}]+(?:\s+[\p{L}]+){0,2})\s+[-–—]\s*([\s\S]*)$/iu);
  if (match) {
    let sender = match[2].trim();
    let message = match[3].trim();
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

  {
    const labelParts = label.split(',');
    for (let i = 1; i < labelParts.length; i++) {
      let datePart = labelParts.slice(0, i).join(',').trim();
      const senderRest = labelParts.slice(i).join(',').trim();
      const byInDate = datePart.search(/\s+by\s+/i);
      if (byInDate >= 0) datePart = datePart.slice(0, byInDate).trim();
      if (!datePart) continue;
      if (datePart.search(/^At\s+/i) === 0) datePart = datePart.slice(3).trim();
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

module.exports = {
  normalizeLabel,
  parseAriaLabel,
};
