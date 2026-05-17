function normalizeLabel(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAriaLabel(ariaLabel) {
  const label = normalizeLabel(ariaLabel).replace(/\s*,\s*/g, ', ');
  let match;

  const isValidSender = (value) => /^[A-Za-z][A-Za-z .'-]{0,80}$/i.test(value) && !/\d/.test(value);

  const splitSenderAndMessage = (value) => {
    const text = normalizeLabel(value);
    const firstWordMatch = text.match(/^([A-Za-z][A-Za-z .'-]{0,80}?)(?:\s+([\s\S]*))?$/);
    if (!firstWordMatch) return null;
    const sender = normalizeLabel(firstWordMatch[1]);
    const message = normalizeLabel(firstWordMatch[2] || '');
    if (!isValidSender(sender)) return null;
    return { sender, message };
  };

  const findValidDatePrefix = (text) => {
    const parts = text
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    let candidate = '';
    for (let i = 0; i < Math.min(parts.length, 3); i += 1) {
      candidate = candidate ? `${candidate}, ${parts[i]}` : parts[i];
      if (normalizeDateToIso(candidate)) return candidate;
    }
    return null;
  };

  match = label.match(/^At\s+(.+?),\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+[-–—]\s*([\s\S]*)$/i);
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
      if (isValidSender(maybeSender)) {
        return {
          date: maybeDate.trim(),
          sender: maybeSender.trim(),
          message: '',
        };
      }
    }

    if (tailParts.length >= 2) {
      const maybeDate = tailParts[0];
      const senderAndMessage = splitSenderAndMessage(tailParts.slice(1).join(', '));
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

  match = label.match(/^(.+?),\s*([^:]+):\s*([\s\S]*)$/i);
  if (match && isValidSender(match[2])) {
    return {
      date: match[1].trim(),
      sender: match[2].trim(),
      message: match[3].trim(),
    };
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

  const colonIndex = label.indexOf(':');
  return {
    date: null,
    sender: null,
    message: colonIndex >= 0 ? label.slice(colonIndex + 1).trim() : label,
  };
}

function normalizeDateToSimple(dateString) {
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

  const now = new Date();
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

function normalizeDateToIso(dateString) {
  if (!dateString) return null;
  const normalized = normalizeDateToSimple(dateString);
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

module.exports = {
  parseAriaLabel,
  normalizeDateToSimple,
  normalizeDateToIso,
  normalizeLabel,
};
