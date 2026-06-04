function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceWholeWord(text, name, replacement) {
  const escaped = escapeRegExp(name);
  const pattern = new RegExp(`(^|[^\\p{L}])${escaped}(?=[^\\p{L}]|$)`, 'giu');
  return String(text || '').replace(pattern, (match, prefix) => {
    const originalWord = match.slice(prefix.length);
    if (name.toLowerCase() === 'you' && originalWord === 'you') {
      return match;
    }
    return `${prefix}${replacement}`;
  });
}

module.exports = { escapeRegExp, replaceWholeWord };
