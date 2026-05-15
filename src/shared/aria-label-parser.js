function normalizeLabel(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function parseAriaLabel(ariaLabel) {
  const label = normalizeLabel(ariaLabel).replace(/\s*,\s*/g, ', ');
  let match;

  match = label.match(/^At\s+(.+),\s*([^:]+):\s*([\s\S]*)$/i);
  if (match) {
    return {
      date: match[1].trim(),
      sender: match[2].trim(),
      message: match[3].trim()
    };
  }

  match = label.match(/^Enter,\s*Message sent\s+(.+?)\s+by\s+([^:]+):\s*([\s\S]*)$/i);
  if (match) {
    return {
      date: match[1].trim(),
      sender: match[2].trim(),
      message: match[3].trim()
    };
  }

  match = label.match(/^At\s+(.+),\s*([^:]+)$/i);
  if (match) {
    return {
      date: match[1].trim(),
      sender: match[2].trim(),
      message: ''
    };
  }

  match = label.match(/^Enter,\s*Message sent\s+(.+?)\s+by\s+([^:]+)$/i);
  if (match) {
    return {
      date: match[1].trim(),
      sender: match[2].trim(),
      message: ''
    };
  }

  const colonIndex = label.indexOf(':');
  return {
    date: null,
    sender: null,
    message: colonIndex >= 0 ? label.slice(colonIndex + 1).trim() : label
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

  const dayOfWeekMatch = text.match(/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:\s+(\d{1,2}):(\d{2})\s*(am|pm)?)?$/i);
  if (dayOfWeekMatch) {
    const [, dayName, hourPart = '0', minute = '00', meridiem] = dayOfWeekMatch;
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
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

  const fullMatch = text.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4}),\s*(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
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

module.exports = {
  parseAriaLabel,
  normalizeDateToSimple,
  normalizeLabel
};
