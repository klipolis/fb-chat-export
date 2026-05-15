const { beautifyHtml } = require('./beautify');

function stripAttributes(tag, attrs) {
  const keep = ['aria-label', 'aria-roledescription'];
  const lowerTag = tag.toLowerCase();
  if (lowerTag === 'img') return '<img>';
  const cleaned = attrs
    .replace(/\s*(id|style|class|tabindex|role|src|href|alt|referrerpolicy|data-[^\s=]+|aria-[^\s=]+)="[^"]*"/gi, (m, name) => {
      return keep.includes(name.toLowerCase()) ? m : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned ? `<${tag} ${cleaned}>` : `<${tag}>`;
}

function normalizeTagStrings(html) {
  return html.replace(/<([a-zA-Z0-9]+)([^>]*)>/g, (match, tag, attrs) => stripAttributes(tag, attrs));
}

function removeLinkContent(html) {
  return html.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, '<a></a>');
}

function removeCallActionNodes(html) {
  return html.replace(/<([a-zA-Z0-9]+)[^>]*aria-label="(?:Call back|Call again)"[^>]*>[\s\S]*?<\/\1>/gi, '');
}

function removeDuplicateAccessibilityLabels(html) {
  return html.replace(/<([a-zA-Z0-9]+)[^>]*aria-label="(?:Message actions|Open Attachment|Enter, Message sent[^\"]*)"[^>]*>[\s\S]*?<\/\1>/gi, '');
}

function removeTimeNodes(html) {
  return html.replace(/<span[^>]*>\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\s*<\/span>/g, '');
}

function normalizeText(text) {
  return text
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractAriaLabelMessageText(label) {
  const messageMatch = label.match(/^(?:At\s+|Enter,\s*Message sent\s+)[\s\S]*:\s*([\s\S]+)$/i);
  return messageMatch ? normalizeText(messageMatch[1]) : null;
}

function findMatchingClosingTag(html, tag, fromIndex) {
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  const closeRe = new RegExp(`</${tag}>`, 'gi');
  openRe.lastIndex = fromIndex;
  closeRe.lastIndex = fromIndex;

  let depth = 1;
  let nextOpen = openRe.exec(html);
  let nextClose = closeRe.exec(html);

  while (nextClose) {
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      openRe.lastIndex = nextOpen.index + nextOpen[0].length;
      nextOpen = openRe.exec(html);
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

function removeDuplicateAriaLabelNodes(html) {
  const ariaLabelTagRe = /<([a-zA-Z0-9]+)([^>]*)\saria-label="([^"]+)"([^>]*)>/gi;
  let result = '';
  let lastIndex = 0;
  let match;
  const seenMessages = new Set();

  while ((match = ariaLabelTagRe.exec(html)) !== null) {
    const [fullMatch, tag, attrsBefore, label] = match;
    const normalized = extractAriaLabelMessageText(label);
    const openEnd = match.index + fullMatch.length;
    const closeStart = findMatchingClosingTag(html, tag, openEnd);
    if (closeStart === -1) {
      continue;
    }

    const closeTag = `</${tag}>`;
    const closeEnd = closeStart + closeTag.length;
    const isMessageNode = !!normalized;
    const shouldSkip = !isMessageNode || /message actions|open attachment/i.test(label);

    if (!shouldSkip) {
      if (seenMessages.has(normalized)) {
        result += html.slice(lastIndex, match.index);
        lastIndex = closeEnd;
        ariaLabelTagRe.lastIndex = closeEnd;
        continue;
      }
      seenMessages.add(normalized);
    }
  }

  if (lastIndex === 0) {
    return html;
  }

  result += html.slice(lastIndex);
  return result;
}

function removeEmptyChildren(html) {
  let prev;
  do {
    prev = html;
    html = html.replace(/<([a-zA-Z0-9]+)><\/\1>/g, '');
    html = html.replace(/<([a-zA-Z0-9]+)>\s*<\/\1>/g, '');
  } while (html !== prev);
  return html;
}

function removeDataMessageIds(html) {
  return html.replace(/\s*data-message-id="[^"]*"/gi, '');
}

function createOptimizedHtml(rawHtml) {
  let html = rawHtml;
  html = normalizeTagStrings(html);
  html = removeLinkContent(html);
  html = removeCallActionNodes(html);
  html = removeDuplicateAccessibilityLabels(html);
  html = removeTimeNodes(html);
  html = removeDuplicateAriaLabelNodes(html);
  html = removeDataMessageIds(html);
  html = removeEmptyChildren(html);
  html = beautifyHtml(html);
  return html;
}

module.exports = { createOptimizedHtml };
