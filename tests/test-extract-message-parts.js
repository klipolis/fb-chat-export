const tap = require('tap');
const { parseAriaLabel, extractNameAfterBy, isValidSender } = require('../src/shared/aria-label-parser');
const { getContentMeta } = require('../src/shared/message-metadata');

class MockElement {
  constructor({ tag = 'div', attrs = {}, text = '', children = [] } = {}) {
    this.tag = tag;
    this.attrs = { ...attrs };
    this.innerText = text;
    this.children = children;
  }
  getAttribute(name) {
    return this.attrs[name] !== undefined ? this.attrs[name] : null;
  }
  querySelector(selector) {
    for (const child of this.children) {
      if (this._match(child, selector)) return child;
    }
    return null;
  }
  _match(el, selector) {
    const tagMatch = selector.match(/^(\w+)/);
    if (tagMatch && tagMatch[1] !== el.tag) return false;
    const bracketMatch = selector.match(/\[([^\]]+)\]/);
    if (!bracketMatch) return true;
    const expr = bracketMatch[1];
    const exact = expr.match(/^([\w-]+)=["'](.+?)["']$/);
    if (exact) return el.getAttribute(exact[1]) === exact[2];
    const containsI = expr.match(/^([\w-]+)\*=["'](.+?)["']\s*i$/i);
    if (containsI) {
      const val = (el.getAttribute(containsI[1]) || '').toLowerCase();
      return val.includes(containsI[2].toLowerCase());
    }
    const attrOnly = expr.match(/^([\w-]+)$/);
    if (attrOnly) return el.getAttribute(attrOnly[1]) !== null;
    return false;
  }
}

function extractMessageParts(el) {
  const label = el.getAttribute('aria-label') || '';
  const parsedLabel = parseAriaLabel(label);
  const rawDate = parsedLabel.date || '';
  let sender = parsedLabel.sender || '';
  const labelText = parsedLabel.message || '';

  if (!sender) {
    const byEl = el.querySelector('[aria-label*="* by " i]');
    if (byEl) {
      const byLabel = byEl.getAttribute('aria-label');
      const byName = extractNameAfterBy(byLabel);
      if (byName && byName !== byLabel && isValidSender(byName)) {
        sender = byName;
      }
    }
    if (!sender) {
      const imgEl = el.querySelector('img[alt]');
      if (imgEl) {
        const alt = imgEl.getAttribute('alt').trim();
        const firstWord = alt.split(/\s+/)[0];
        if (firstWord && isValidSender(firstWord)) {
          sender = firstWord;
        }
      }
    }
  }

  const normalizedText = (labelText || el.innerText).replace(/\s+/g, ' ').trim();
  const normalizedLabel = label.replace(/\s+/g, ' ').trim().toLowerCase();
  const timerEl = el.querySelector('[role="timer"]');
  const timerText = timerEl ? timerEl.innerText : '';
  const hasImage = Boolean(el.querySelector('img'));
  const hasPlayButton = Boolean(el.querySelector('[aria-label="Play"]'));
  const anchor = el.querySelector('a[href]');
  const originalHref = anchor ? anchor.getAttribute('href') : null;
  const hasLink =
    Boolean(originalHref) ||
    /https?:\/\/|www\./i.test(normalizedText) ||
    /https?:\/\/|www\./i.test(normalizedLabel);
  const contentMeta = getContentMeta({
    fileName: '',
    ariaLabel: label,
    message: normalizedText,
    rawMeta: { duration: timerText || normalizedText, link: originalHref },
    hasImage,
    hasPlayButton,
    hasLink,
    timerText,
  });

  return {
    rawDate,
    sender,
    text: contentMeta.text,
    link: contentMeta.link,
    originalHref,
    type: contentMeta.type,
    isCall: contentMeta.isCall,
    isImage: contentMeta.isImage,
    duration: contentMeta.duration,
    contentLength: contentMeta.contentLength,
  };
}

tap.test('extractMessageParts', (t) => {
  t.test('extracts date, sender, message from standard aria-label', (t) => {
    const el = new MockElement({
      attrs: { 'aria-label': 'At June 8, 2026, 10:30 AM, Alice: Hello world' },
      text: 'Hello world',
    });
    const result = extractMessageParts(el);
    t.ok(result.rawDate.includes('June 8'), 'has date');
    t.equal(result.sender, 'Alice', 'has sender');
    t.equal(result.text, 'Hello world', 'has message text');
    t.end();
  });

  t.test('handles empty aria-label', (t) => {
    const el = new MockElement({ attrs: { 'aria-label': '' }, text: '' });
    const result = extractMessageParts(el);
    t.equal(result.rawDate, '', 'no date');
    t.equal(result.sender, '', 'no sender');
    t.equal(result.text, '', 'no text');
    t.end();
  });

  t.test('falls back to by element for sender', (t) => {
    const byChild = new MockElement({
      tag: 'span',
      attrs: { 'aria-label': 'Sent * by Bob' },
    });
    const el = new MockElement({
      attrs: { 'aria-label': '' },
      text: 'How are you?',
      children: [byChild],
    });
    const result = extractMessageParts(el);
    t.equal(result.sender, 'Bob', 'sender from by element');
    t.equal(result.text, 'How are you?', 'message from innerText');
    t.end();
  });

  t.test('falls back to img alt for sender', (t) => {
    const imgChild = new MockElement({
      tag: 'img',
      attrs: { alt: 'Charlie profile pic' },
    });
    const el = new MockElement({
      attrs: { 'aria-label': '' },
      text: 'Hey there',
      children: [imgChild],
    });
    const result = extractMessageParts(el);
    t.equal(result.sender, 'Charlie', 'sender from img alt');
    t.equal(result.text, 'Hey there', 'message text');
    t.end();
  });

  t.test('detects link content', (t) => {
    const el = new MockElement({
      attrs: { 'aria-label': 'At June 8, 2026, 10:30 AM, Dave: Check https://example.com' },
      text: 'Check https://example.com',
    });
    const result = extractMessageParts(el);
    t.equal(result.sender, 'Dave', 'has sender');
    t.match(result.type, 'link', 'type is link');
    t.ok(result.link, 'has a link');
    t.equal(result.originalHref, null, 'no original href (link from text)');
    t.end();
  });

  t.test('detects image content', (t) => {
    const imgChild = new MockElement({ tag: 'img', attrs: { alt: 'photo' } });
    const el = new MockElement({
      attrs: { 'aria-label': 'At June 8, 2026, 10:30 AM, Eve: photo sent' },
      text: 'photo sent',
      children: [imgChild],
    });
    const result = extractMessageParts(el);
    t.equal(result.isImage, true, 'isImage is true');
    t.equal(result.text, 'image sent', 'text is "image sent"');
    t.equal(result.type, 'image', 'type is image');
    t.end();
  });

  t.test('detects audio-call from timer element', (t) => {
    const timerChild = new MockElement({
      tag: 'span',
      attrs: { role: 'timer' },
      text: '5:30',
    });
    const el = new MockElement({
      attrs: { 'aria-label': 'At June 8, 2026, 10:30 AM, Frank: Audio call' },
      text: 'Audio call',
      children: [timerChild],
    });
    const result = extractMessageParts(el);
    t.equal(result.isCall, true, 'isCall is true');
    t.equal(result.type, 'audio-call', 'type is audio-call');
    t.equal(result.duration, '00:05:30', 'duration extracted from timer');
    t.end();
  });

  t.test('handles timer text extraction on empty label', (t) => {
    const timerChild = new MockElement({
      tag: 'span',
      attrs: { role: 'timer' },
      text: '0:45',
    });
    const el = new MockElement({
      attrs: { 'aria-label': '' },
      text: '',
      children: [timerChild],
    });
    const result = extractMessageParts(el);
    t.equal(result.duration, '00:00:45', 'timer text extracted as duration');
    t.equal(result.type, 'voice-note', 'type voice-note from timer presence');
    t.equal(result.rawDate, '', 'no raw date');
    t.end();
  });

  t.end();
});
