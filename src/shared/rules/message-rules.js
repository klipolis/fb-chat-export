const FILE_SUFFIX = '(?:-[^.]+)?\\.html$';

// Optional "you-" prefix for ANY filename
const OPTIONAL_PREFIX = '(?:you-)?';

const rules = [
  {
    type: 'unsent',
    prefixes: [
      'deleted'
    ],
    matchLabel: /(?:deleted|unsent)/i,
  },

  {
    type: 'missed-call',
    prefixes: [
      'missed-audio-call',
      'missed-video-call',
      'missed-call-audio',
      'missed-call-video'
    ],
    matchLabel: /missed[\s-]*(?:audio|video)?\s*call/i,
  },

  {
    type: 'audio-call',
    prefixes: [
      'audio-call'
    ],
    matchLabel: /\baudio call\b/i,
  },

  {
    type: 'image',
    prefixes: [
      'image'
    ],
    matchLabel: /\bimage\b|\bphoto\b|\bpicture\b/i,
  },

  //
  // LINK (merged with video-link)
  //
  {
    type: 'link',
    prefixes: [
      'link-embed-no-text',
      'link-text',
      'link-video',
      'video-link'
    ],
    matchLabel:
      /(?:open attachment|href|https?:\/\/|open link|view link|download|attachment|pinned location|\b(?:youtube|youtu\.be|vimeo|dailymotion|tiktok|instagram|twitter|x\.com|twitch|fb\.watch|facebook\.com\/.*(?:video|watch|reel)|video|watch|reel|shorts)\b)/i,
  },

  {
    type: 'video-call',
    prefixes: [
      'video-call',
      'call-video'
    ],
    matchLabel: /\bvideo call\b/i,
  },

  {
    type: 'voice-note',
    prefixes: [
      'voice-note'
    ],
    matchLabel:
      /\bvoice(?:[- ]message|[- ]note)?\b|\baudio(?:[- ]message|[- ]note)?\b/i,
  },

  {
    type: 'sticker',
    prefixes: [
      'sticker'
    ],
    matchLabel: /\bsticker\b/i,
  },

  //
  // GIFs merged into reaction
  //
  {
    type: 'reaction',
    prefixes: [
      'gif',
      'animated-gif',
      'reaction',
      'reaction-emoji'
    ],
    matchLabel:
      /\bgif\b|👍|❤|😂|😮|😢|👏|😠|: \p{Extended_Pictographic}\uFE0F?\s*$|like button|thumbs up/iu,
  },

  {
    type: 'poll',
    prefixes: [
      'poll'
    ],
    matchLabel: /\bpoll\b/i,
  },

  {
    type: 'text',
    prefixes: [
      'text',
      'text-replied',
      'text-image-replied'
    ],
    matchLabel:
      /\byou:|\breply\b|\breplied\b|^(?!.*\b(?:link|unsent|video call|voice message|voice note|missed call)\b).*/i,
  },
];

const addMatchFile = (rule) => ({
  ...rule,
  matchFile: new RegExp(
    `^${OPTIONAL_PREFIX}(?:${rule.prefixes.join('|')})${FILE_SUFFIX}`,
    'i'
  ),
});

const messageRules = rules.map(addMatchFile);

function chooseRule(fileName, ariaLabel) {
  const loweredFile = String(fileName || '').toLowerCase();
  const loweredLabel = String(ariaLabel || '').toLowerCase();

  const fileRule = messageRules.find((rule) => rule.matchFile && rule.matchFile.test(loweredFile));
  if (fileRule) return fileRule;

  const labelRule = messageRules.find(
    (rule) => rule.matchLabel && rule.matchLabel.test(loweredLabel)
  );
  if (labelRule) return labelRule;

  return messageRules.find((rule) => rule.type === 'text') || messageRules[0];
}

module.exports = { messageRules, chooseRule };
