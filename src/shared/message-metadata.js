const { messageRules } = require('./rules');
const { parseAriaLabel, normalizeDateToSimple, normalizeLabel } = require('./aria-label-parser');

function normalizeDuration(text) {
  if (!text) return null;
  const normalized = String(text).trim();
  const hhmm = normalized.match(/(\d{1,2}):(\d{2})/);
  if (hhmm) {
    return `${Number(hhmm[1])}:${hhmm[2]} mins`;
  }

  const minMatch = normalized.match(/(\d+(?:\.\d+)?)\s*min(?:s)?/i);
  if (minMatch) return `${Math.ceil(parseFloat(minMatch[1]))} mins`;

  const secMatch = normalized.match(/(\d+)\s*sec/i);
  if (secMatch) return `${Math.ceil(parseInt(secMatch[1], 10) / 60)} mins`;

  return null;
}

function normalizeFacebookRedirect(url) {
  const redirectMatch = url.match(/https?:\/\/(?:l\.facebook\.com|l\.m\.facebook\.com|l\.messenger\.com|l\.m\.messenger\.com)\/l\.php\?u=([^&]+)/i);
  if (!redirectMatch) return url;
  try {
    return decodeURIComponent(redirectMatch[1]);
  } catch {
    return redirectMatch[1];
  }
}

function extractLink(text) {
  if (!text) return null;
  const urlMatch = String(text).match(/(https?:\/\/[^\s"'<]+)/i);
  const wwwMatch = String(text).match(/\b(www\.[^\s"'<]+)/i);
  const rawUrl = urlMatch ? urlMatch[0] : wwwMatch ? `https://${wwwMatch[1]}` : null;
  if (!rawUrl) return null;
  return normalizeFacebookRedirect(rawUrl);
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
  const rawLink = rawMeta.link || extractLink(normalizedText) || extractLink(normalizedLabel) || null;
  const link = rawLink ? normalizeFacebookRedirect(rawLink) : null;
  const rawDuration = rawMeta.duration || normalizeDuration(timerText);

  const unsent = /(?:unsent|deleted)/i.test(normalizedText) || /(?:unsent|deleted)/i.test(normalizedLabel);
  const callMatch = normalizedText.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i) || normalizedLabel.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i);
  const voiceMatch = /\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i.test(normalizedText)
    || /\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i.test(normalizedLabel)
    || Boolean(timerText);
  const explicitLink = hasLink
    || /https?:\/\/|www\.|fbcdn\.|fbsbx\.|facebook\.com|fb\.me|m\.me|l\.facebook\.com\/l\.php|l\.messenger\.com\/l\.php|href\b|\blink\b/i.test(normalizedText)
    || /https?:\/\/|www\.|fbcdn\.|fbsbx\.|facebook\.com|fb\.me|m\.me|l\.facebook\.com\/l\.php|l\.messenger\.com\/l\.php|href\b|\blink\b/i.test(normalizedLabel)
    || /\b(?:attachment|open attachment|download|view image|view attachment)\b/i.test(normalizedText)
    || /\b(?:attachment|open attachment|download|view image|view attachment)\b/i.test(normalizedLabel);
  const imageMatch = hasImage || /\b(?:image|photo|picture|gallery)\b/i.test(normalizedText) || /\b(?:image|photo|picture|gallery)\b/i.test(normalizedLabel);

  if (unsent) {
    type = 'unsent';
  } else if (callMatch) {
    const callText = callMatch[0].toLowerCase();
    if (/missed/.test(callText)) {
      type = 'missed-call';
    } else if (/video/.test(callText)) {
      type = 'video-call';
    } else if (/audio/.test(callText)) {
      type = 'audio-call';
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
  } else if (type === 'video-call' || type === 'audio-call' || type === 'missed-call') {
    contentText = normalizedText || type;
  }

  const duration = (type === 'voice-message' || type === 'video-call' || type === 'audio-call') ? rawDuration : null;
  const isTimedType = type === 'voice-message' || type === 'video-call' || type === 'audio-call';
  const contentLength = type === 'link' || type === 'missed-call' || type === 'unsent'
    ? undefined
    : isTimedType
      ? undefined
      : `${contentText.length} chars`;

  return {
    type,
    text: contentText,
    contentLength,
    link: link || undefined,
    voiceDurationSource: rawMeta.duration ? 'timer' : timerText ? 'label' : undefined,
    isCall: type === 'video-call' || type === 'missed-call' || type === 'audio-call',
    isImage: type === 'image',
    duration
  };
}

module.exports = {
  parseAriaLabel,
  normalizeDateToSimple,
  normalizeLabel,
  normalizeDuration,
  extractLink,
  chooseRule,
  getContentMeta
};
