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

function stripVariantSelectors(text) {
  return String(text || '').replace(/\uFE0F/g, '').replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
}

module.exports = { escapeRegExp, replaceWholeWord, stripVariantSelectors };
