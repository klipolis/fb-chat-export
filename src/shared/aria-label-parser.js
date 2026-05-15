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

  const timeMatch = text.match(/^([A-Za-z]+)\s+(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (timeMatch) {
    let [, day, hour, minute, meridiem] = timeMatch;
    hour = Number(hour);
    if (meridiem) {
      if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
    return `${day} ${String(hour).padStart(2, '0')}:${minute}`;
  }

  return text;
}

module.exports = {
  parseAriaLabel,
  normalizeDateToSimple,
  normalizeLabel
};
