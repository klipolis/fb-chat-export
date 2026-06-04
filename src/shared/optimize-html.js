const { beautifyHtml } = require('./beautify');
const { findMatchingClosingTag, stripAttributes, normalizeTagStrings } = require('./html-utils');

function removeLinkContent(html) {
  return html.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, (_match, content) => {
    const trimmed = content.trim();
    if (/^https?:\/\/\S+$/i.test(trimmed)) return trimmed;
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text || '<a></a>';
  });
}

function removeCallActionNodes(html) {
  return html.replace(
    /<([a-zA-Z0-9]+)[^>]*aria-label="(?:Call back|Call again)"[^>]*>[\s\S]*?<\/\1>/gi,
    ''
  );
}

function removeDuplicateAccessibilityLabels(html) {
  return html.replace(
    /<([a-zA-Z0-9]+)[^>]*aria-label="(?:Message actions|Open Attachment|Enter, Message sent[^"]*)"[^>]*>[\s\S]*?<\/\1>/gi,
    ''
  );
}

function removeTimeNodes(html) {
  return html.replace(/<span[^>]*>\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\s*<\/span>/g, '');
}

function removeSvgNodes(html) {
  return html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '');
}

function normalizeText(text) {
  return text.replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractAriaLabelMessageText(label) {
  const messageMatch = label.match(/^(?:At\s+|Enter,\s*Message sent\s+)[\s\S]*:\s*([\s\S]+)$/i);
  return messageMatch ? normalizeText(messageMatch[1]) : null;
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
    html = html.replace(/<([a-zA-Z0-9]+)([^>]*)>\s*<\/\1>/g, (match, tag, attrs) => {
      if (/aria-roledescription=\s*"?message"?/i.test(attrs)) {
        return match;
      }
      return '';
    });
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
  html = removeSvgNodes(html);
  html = removeDuplicateAriaLabelNodes(html);
  html = removeDataMessageIds(html);
  html = removeEmptyChildren(html);
  html = beautifyHtml(html);
  return html;
}

module.exports = { createOptimizedHtml };
