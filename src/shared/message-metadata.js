const { messageRules, chooseRule } = require('./rules');
const { parseAriaLabel, normalizeDateToSimple, normalizeLabel } = require('./aria-label-parser');
const { normalizeDuration } = require('./duration-utils');

let sharedFrontendConfig;
try {
  sharedFrontendConfig = require('../../data-config/frontend_shared.json') || {};
} catch (err) {
  console.warn('message-metadata: failed to load shared frontend config', err);
  sharedFrontendConfig = {};
}

const asciiReactionPattern = sharedFrontendConfig.reactionOptions?.asciiSmileyPattern
  ? new RegExp(sharedFrontendConfig.reactionOptions.asciiSmileyPattern, 'u')
  : /^[:;=8Xx][-~]?[)DdpP(/\\\]]$/u;

function isAsciiReactionText(text) {
  return asciiReactionPattern.test(String(text || '').trim());
}

function formatUrlCompact(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/\./g, '_');
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    if (!cleanPath) return `${host}...`;
    const truncPath = cleanPath.length > 10 ? `${cleanPath.slice(0, 10)}...` : `${cleanPath}...`;
    return host + truncPath;
  } catch (err) {
    console.warn('message-metadata: truncateUrl failed for', url, err);
    return url;
  }
}

function stripTrackingParams(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (
        key.toLowerCase().startsWith('utm_') ||
        ['fbclid', 'gclid', 'dclid', 'msclkid', 'ref', 'ref_src', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].includes(key.toLowerCase())
      ) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hash = '';
    return parsed.toString();
  } catch (err) {
    console.warn('message-metadata: stripTrackingParams failed for', url, err);
    return url;
  }
}

function normalizeRedirectUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const isRedirectHost = /(^|\.)facebook\.com$|(^|\.)messenger\.com$/.test(host);
    const isRedirectPath = path.includes('/l.php') || path.includes('/flx/warn/');
    if (!isRedirectHost || !isRedirectPath) return url;

    const candidate =
      parsed.searchParams.get('u') ||
      parsed.searchParams.get('url') ||
      parsed.searchParams.get('q');

    if (!candidate) return url;
    const decoded = decodeURIComponent(candidate);
    return /^https?:\/\//i.test(decoded) ? decoded : url;
  } catch (err) {
    console.warn('message-metadata: resolveRedirectUrl outer failed for', url, err);
    const redirectMatch = url.match(
      /https?:\/\/(?:l\.facebook\.com|l\.m\.facebook\.com|l\.messenger\.com|l\.m\.messenger\.com)\/l\.php\?(?:[^#]*?)(?:u|url|q)=([^&#]+)/i
    );
    if (!redirectMatch) return url;
    try {
      const decoded = decodeURIComponent(redirectMatch[1]);
      return /^https?:\/\//i.test(decoded) ? decoded : url;
    } catch (err2) {
      console.warn('message-metadata: resolveRedirectUrl inner failed for', url, err2);
      return redirectMatch[1];
    }
  }
}

function extractLink(text) {
  if (!text) return null;
  const urlMatch = String(text).match(/(https?:\/\/[^\s"'<]+)/i);
  const wwwMatch = String(text).match(/\b(www\.[^\s"'<]+)/i);
  const rawUrl = urlMatch ? urlMatch[0] : wwwMatch ? `https://${wwwMatch[1]}` : null;
  if (!rawUrl) return null;
  return normalizeRedirectUrl(rawUrl);
}

function extractPinnedLocationLink(text) {
  const normalized = normalizeLabel(text);
  const locationMatch = normalized.match(/\bPinned Location\s*(.+)$/i);
  if (!locationMatch) return null;
  const locationText = locationMatch[1].trim();
  if (!locationText) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`;
}

function isLinkOnlyText(text, link) {
  if (!text || !link) return false;
  const normalizedText = normalizeLabel(text).replace(/[.,;:!?]+$/g, '').trim();
  const normalizedLink = normalizeLabel(link).replace(/[.,;:!?]+$/g, '').trim();
  return normalizedText === normalizedLink;
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
  imageCount = 0,
  hasPlayButton = false,
  hasLink = false,
  timerText = '',
} = {}) {
  const normalizedText = normalizeLabel(message).replace(/[\r\n]+/g, ' ');
  const normalizedLabel = normalizeLabel(ariaLabel);
  const loweredFileName = String(fileName || '').toLowerCase();
  const isLinkTextFile =
    /(?:^|[\\/])link-text\.html$/i.test(loweredFileName) || loweredFileName === 'link-text.html';
  const rule = chooseRule(fileName, ariaLabel);
  const fileTypeLocked = Boolean(
    rule && rule.matchFile && rule.matchFile.test(String(fileName || '').toLowerCase())
  );
  const labelTypeLocked =
    !fileTypeLocked &&
    Boolean(
      rule &&
      rule.matchLabel &&
      rule.matchLabel.test(String(ariaLabel || '').toLowerCase()) &&
      rule.type !== 'text' &&
      rule.type !== 'you-text'
    );
  let type = normalizeContentType(rule.type || 'text');
  const rawLink =
    rawMeta.link || extractLink(normalizedText) || extractLink(normalizedLabel) || null;
  const link = rawLink ? normalizeRedirectUrl(rawLink) : null;
  const pinnedLocationLink =
    extractPinnedLocationLink(normalizedText) || extractPinnedLocationLink(normalizedLabel);
  const resolvedLink = link || pinnedLocationLink || null;
  const isLinkTextLikeLive =
    !loweredFileName &&
    Boolean(normalizedText) &&
    !/^\b(?:pinned\s+location|open\s+attachment|view\s+attachment|attachment|open\s+link|view\s+link)\b/i.test(
      normalizedText
    );
  const normalizedRawDuration = normalizeDuration(rawMeta.duration);
  const fallbackDuration = normalizeDuration(timerText) || normalizeDuration(normalizedText);
  const rawDuration = normalizedRawDuration || fallbackDuration;

  const unsent =
    /(?:unsent|deleted)/i.test(normalizedText) || /(?:unsent|deleted)/i.test(normalizedLabel);
  const callMatch =
    normalizedText.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i) ||
    normalizedLabel.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i);
  const voiceMatch =
    /\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i.test(normalizedText) ||
    /\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i.test(normalizedLabel) ||
    Boolean(timerText);
  // Only treat as explicit link if there is a real URL, <a> tag, or strong link phrase (not just the word 'link')
  const explicitLink =
    Boolean(rawLink) ||
    hasLink ||
    /https?:\/\/|www\.|fbcdn\.|fbsbx\.|facebook\.com|fb\.me|m\.me|l\.facebook\.com\/l\.php|l\.messenger\.com\/l\.php|href\b/i.test(
      normalizedText
    ) ||
    /https?:\/\/|www\.|fbcdn\.|fbsbx\.|facebook\.com|fb\.me|m\.me|l\.facebook\.com\/l\.php|l\.messenger\.com\/l\.php|href\b/i.test(
      normalizedLabel
    ) ||
    /\b(?:attachment|open attachment|download|view attachment|open link|view link|pinned location)\b/i.test(
      normalizedText
    ) ||
    /\b(?:attachment|open attachment|download|view attachment|open link|view link|pinned location)\b/i.test(
      normalizedLabel
    );
  // Remove plain 'link' as a trigger for explicitLink
  // (Do not match /\blink\b/ alone)
  // Classify as image if there is an image count or if the label/text explicitly describes an image.
  const imageKeyword =
    /\b(?:image sent|photo sent|picture sent|sent image|sent photo|sent picture)\b/i;
  const imageMatch =
    imageCount > 0 ||
    (hasImage &&
      (imageKeyword.test(normalizedText) || imageKeyword.test(normalizedLabel) || !normalizedText)) ||
    imageKeyword.test(normalizedText) ||
    imageKeyword.test(normalizedLabel);

  if (!fileTypeLocked && !labelTypeLocked) {
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
        // Plain "call" without prefix — only voice-note if text is short,
        // no special chars, no numbers (validation prevents user-typed
        // sentences like "a quick call?" from being misclassified).
        const trimmed = normalizeLabel(normalizedText);
        const words = trimmed ? trimmed.split(/\s+/) : [];
        const isValid = words.length <= 2 && /^[a-zA-Z\s]+$/.test(trimmed);
        if (isValid || timerText) {
          type = 'voice-note';
        }
      }
    } else if (explicitLink) {
      type = 'link';
    } else if (voiceMatch) {
      type = 'voice-note';
    } else if (imageMatch) {
      type = 'image';
    }
    if (type === 'text' && isAsciiReactionText(normalizedText)) {
      type = 'reaction';
    }
  }

  const linkOnlyText = type === 'link' && Boolean(resolvedLink) && isLinkOnlyText(normalizedText, resolvedLink);

  let contentText = normalizedText;
  if (type === 'unsent') {
    contentText = 'message unsent';
  } else if (type === 'link') {
    if ((isLinkTextFile || isLinkTextLikeLive) && normalizedText) {
      if (linkOnlyText) {
        contentText = resolvedLink || normalizedText;
      } else if (resolvedLink && normalizedText.includes(resolvedLink)) {
        contentText = normalizedText;
      } else {
        contentText = resolvedLink ? `${resolvedLink} ${normalizedText}` : normalizedText;
      }
    } else {
      contentText = resolvedLink || 'link';
    }
  } else if (type === 'voice-note') {
    const trimmed = normalizeLabel(normalizedText || '');
    const isUINoise = !trimmed || /^play\s*\d{1,2}:\d{2}/i.test(trimmed) || /^audio\s+scrubber/i.test(trimmed) || /^(voice\s+(message|note)|audio\s+(message|note))$/i.test(trimmed);
    contentText = isUINoise ? 'voice note' : normalizedText;
  } else if (type === 'sticker') {
    contentText = 'sticker';
  } else if (type === 'reaction') {
    const reactionOnlyTextMatch = /^[:;=8Xx][-~]?[)DdpP(/\\\]]$/u;
    const normalizedReaction = normalizedText.trim();
    const isAsciiReaction = reactionOnlyTextMatch.test(normalizedReaction);
    const isEmojiReaction = /\p{Extended_Pictographic}/u.test(normalizedReaction);
    contentText = (isAsciiReaction || isEmojiReaction) ? normalizedReaction : null;
  } else if (type === 'image') {
    contentText = 'image sent';
  } else if (type === 'video-call' || type === 'audio-call' || type === 'missed-call') {
    const hasCallPhrase = /\bcall\b/i.test(normalizedText);
    contentText = hasCallPhrase ? normalizedText : type.replace(/-/g, ' ');
  }

  const timedTypes = new Set(['voice-note', 'video-call', 'audio-call']);
  const noLengthTypes = new Set(['image', 'missed-call', 'unsent', 'sticker', ...timedTypes]);

  const duration = timedTypes.has(type) ? rawDuration : null;
  const linkHasTextContent =
    type === 'link' && (isLinkTextFile || isLinkTextLikeLive) && Boolean(normalizedText) && !linkOnlyText;
  const shouldOmitLength = noLengthTypes.has(type) || (type === 'link' && !linkHasTextContent);
  const wordCount = shouldOmitLength || contentText == null ? undefined : (contentText.match(/\S+/g) || []).length;
  const contentLength = shouldOmitLength || contentText == null ? undefined : `${wordCount} words`;

  return {
    type,
    text: contentText,
    words: wordCount,
    contentLength,
    link: resolvedLink || undefined,
    voiceDurationSource: rawMeta.duration ? 'timer' : timerText ? 'label' : undefined,
    isCall: type === 'video-call' || type === 'missed-call' || type === 'audio-call',
    isImage: type === 'image',
    imageCount: imageCount || (type === 'image' ? 1 : 0),
    duration,
  };
}

module.exports = {
  stripTrackingParams,
  getContentMeta,
};
