function stripAttributes(tag, attrs) {
  const keep = ['aria-label', 'aria-roledescription'];
  const lowerTag = tag.toLowerCase();
  if (lowerTag === 'img') return '<img>';
  const cleaned = attrs
    .replace(
      /\s*(id|style|class|tabindex|role|src|href|alt|referrerpolicy|data-[^\s=]+|aria-[^\s=]+)="[^"]*"/gi,
      (m, name) => {
        return keep.includes(name.toLowerCase()) ? m : '';
      }
    )
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned ? `<${tag} ${cleaned}>` : `<${tag}>`;
}

function normalizeTagStrings(html) {
  return html.replace(/<([a-zA-Z0-9]+)([^>]*)>/g, (match, tag, attrs) =>
    stripAttributes(tag, attrs)
  );
}

function findMatchingClosingTag(html, tag, fromIndex) {
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  const closeRe = new RegExp(`</${tag}>`, 'gi');
  openRe.lastIndex = fromIndex;
  closeRe.lastIndex = fromIndex;

  let depth = 0;
  let nextOpen = openRe.exec(html);
  let nextClose = closeRe.exec(html);

  while (nextClose) {
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      openRe.lastIndex = nextOpen.index + nextOpen[0].length;
      nextOpen = openRe.exec(html);
      continue;
    }

    if (depth === 0) {
      closeRe.lastIndex = nextClose.index + nextClose[0].length;
      nextClose = closeRe.exec(html);
      continue;
    }

    depth -= 1;
    if (depth === 0) {
      return nextClose.index;
    }

    closeRe.lastIndex = nextClose.index + nextClose[0].length;
    nextClose = closeRe.exec(html);
  }

  return -1;
}

function cleanXClasses(html) {
  let result = html.replace(/\s+style="[^"]*"/gi, '');
  result = result.replace(/\sclass="([^"]*)"/gi, (_, tokens) => {
    const kept = tokens
      .trim()
      .split(/\s+/)
      .filter((t) => t && !t.startsWith('x'));
    return kept.length ? ` class="${kept.join(' ')}"` : '';
  });
  return result;
}

module.exports = { findMatchingClosingTag, stripAttributes, normalizeTagStrings, cleanXClasses };
