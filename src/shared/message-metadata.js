const { messageRules } = require('./rules');
const { parseAriaLabel, normalizeDateToSimple, normalizeLabel } = require('./aria-label-parser');

function parseDurationMinutes(text) {
  if (!text) return null;
  const hhmm = text.match(/(\d{1,2}):(\d{2})/);
  if (hhmm) {
    const minutes = Number(hhmm[1]);
    const seconds = Number(hhmm[2]);
    return `${minutes + (seconds > 0 ? 1 : 0)} min`;
  }

  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*min/i);
  if (minMatch) return `${Math.ceil(Number(minMatch[1]))} min`;

  const secMatch = text.match(/(\d+)\s*sec/i);
  if (secMatch) return `${Math.ceil(Number(secMatch[1]) / 60)} min`;

  return null;
}

function extractLink(text) {
  if (!text) return null;
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  return urlMatch ? urlMatch[0] : null;
}

function chooseRule(fileName, ariaLabel) {
  const loweredFile = String(fileName || '').toLowerCase();
  const loweredLabel = String(ariaLabel || '').toLowerCase();

  const fileRule = messageRules.find(rule => rule.matchFile && rule.matchFile.test(loweredFile));
  if (fileRule) return fileRule;

  const labelRule = messageRules.find(rule => rule.matchLabel && rule.matchLabel.test(loweredLabel));
  if (labelRule) return labelRule;

  return messageRules.find(rule => rule.type === 'text') || messageRules[0];
}

function normalizeContentType(type) {
  if (type === 'you-text') return 'text';
  return type;
}

function getContentMeta({
  fileName = '',
  ariaLabel = '',
  message = '',
  rawMeta = {},
  hasImage = false,
  hasPlayButton = false,
  hasLink = false,
  timerText = ''
} = {}) {
  const normalizedText = normalizeLabel(message);
  const normalizedLabel = normalizeLabel(ariaLabel);
  const rule = chooseRule(fileName, ariaLabel);
  let type = normalizeContentType(rule.type || 'text');
  const link = rawMeta.link || (hasLink ? extractLink(normalizedText) : null);
  const duration = rawMeta.duration || parseDurationMinutes(timerText);

  const unsent = /(?:unsent|deleted)/i.test(normalizedText) || /(?:unsent|deleted)/i.test(normalizedLabel);
  const callMatch = normalizedText.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i) || normalizedLabel.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i);
  const voiceMatch = /\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i.test(normalizedText)
    || /\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i.test(normalizedLabel)
    || Boolean(timerText);
  const explicitLink = hasLink || /https?:\/\/|www\.|\blink\b|\bhref\b/i.test(normalizedText) || /https?:\/\/|www\.|\blink\b|\bhref\b/i.test(normalizedLabel);
  const imageMatch = hasImage || /\b(?:image|photo|picture|gallery)\b/i.test(normalizedText) || /\b(?:image|photo|picture|gallery)\b/i.test(normalizedLabel);

  if (unsent) {
    type = 'unsent';
  } else if (callMatch) {
    const callText = callMatch[0].toLowerCase();
    if (/missed/.test(callText)) {
      type = 'missed-call';
    } else if (/video/.test(callText)) {
      type = 'video-call';
    } else {
      type = 'voice-message';
    }
  } else if (voiceMatch) {
    type = 'voice-message';
  } else if (imageMatch) {
    type = 'image';
  } else if (explicitLink) {
    type = 'link';
  }

  let contentText = normalizedText;
  if (type === 'unsent') {
    contentText = 'message unsent';
  } else if (type === 'link') {
    contentText = 'link';
  } else if (type === 'voice-message') {
    contentText = 'voice message';
  } else if (type === 'image') {
    contentText = 'image sent';
  } else if (type === 'video-call' || type === 'missed-call') {
    contentText = normalizedText || type;
  }

  const isTimedType = type === 'voice-message' || type === 'video-call';
  const contentLength = type === 'link' || type === 'missed-call' || type === 'unsent'
    ? undefined
    : isTimedType
      ? duration || '0 min'
      : `${contentText.length} chars`;

  return {
    type,
    text: contentText,
    contentLength,
    link: link || undefined,
    voiceDurationSource: rawMeta.duration ? 'timer' : timerText ? 'label' : undefined,
    isCall: type === 'video-call' || type === 'missed-call',
    isImage: type === 'image',
    duration
  };
}

module.exports = {
  parseAriaLabel,
  normalizeDateToSimple,
  normalizeLabel,
  parseDurationMinutes,
  extractLink,
  chooseRule,
  getContentMeta
};
