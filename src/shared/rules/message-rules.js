module.exports = [
  {
    type: 'unsent',
    matchFile: /^deleted(?:-\d+)?\.html$/i,
    matchLabel: /deleted/i,
  },
  {
    type: 'missed-call',
    matchFile: /^missed-audio-call(?:-\d+)?\.html$/i,
    matchLabel: /missed[\s-]*(?:audio\s+|video\s+)?call/i,
  },
  {
    type: 'missed-call',
    matchFile: /^missed-video-call(?:-\d+)?\.html$/i,
    matchLabel: /missed[\s-]*(?:audio\s+|video\s+)?call/i,
  },
  {
    type: 'audio-call',
    matchFile: /^audio-call(?:-\d+)?\.html$/i,
    matchLabel: /audio call/i,
  },
  {
    type: 'image',
    matchFile: /^image(?:-\d+)?\.html$/i,
    matchLabel: /image/i,
  },
  {
    type: 'video-link',
    matchFile: /^video-link(?:-\d+)?\.html$/i,
    matchLabel: /\byoutube\.com\/|youtu\.be\/|vimeo\.com\//i,
  },
  {
    type: 'link',
    matchFile: /^link-embed-no-text(?:-\d+)?\.html$/i,
    matchLabel:
      /open attachment|href|https?:\/\/|open link|view link|download|attachment|pinned location/i,
  },
  {
    type: 'link',
    matchFile: /^link-text(?:-\d+)?\.html$/i,
    matchLabel:
      /open attachment|href|https?:\/\/|open link|view link|download|attachment|pinned location/i,
  },
  {
    type: 'text',
    matchFile: /^text-image-replied(?:-\d+)?\.html$/i,
    matchLabel: /reply/i,
  },
  {
    type: 'text',
    matchFile: /^text-replied(?:-\d+)?\.html$/i,
    matchLabel: /reply/i,
  },
  {
    type: 'video-call',
    matchFile: /^video-call(?:-\d+)?\.html$/i,
    matchLabel: /video[- ]call/i,
  },
  {
    type: 'voice-note',
    matchFile: /^voice-note(?:-\d+)?\.html$/i,
    matchLabel: /voice(?:[- ]message|[- ]note)|audio(?:[- ]message|[- ]note)/i,
  },
  {
    type: 'sticker',
    matchFile: /^sticker(?:-\d+)?\.html$/i,
    matchLabel: /sticker/i,
  },
  {
    type: 'gif',
    matchFile: /^(?:animated-)?gif(?:-\d+)?\.html$/i,
    matchLabel: /\bgif\b/i,
  },
  {
    type: 'poll',
    matchFile: /^poll(?:-\d+)?\.html$/i,
    matchLabel: /\bpoll\b/i,
  },
  {
    type: 'reaction',
    matchFile: /^reaction(?:-\d+|-emoji)?\.html$/i,
    matchLabel: /👍|❤|😂|😮|😢|👏|😠|: \p{Extended_Pictographic}\uFE0F?\s*$|like button|thumbs up/u,
  },
  {
    type: 'you-text',
    matchFile: /you - text message(?:-\d+)?/i,
    matchLabel: /you:/i,
  },
  {
    type: 'text',
    matchFile: /^text(?:-\d+)?\.html$/i,
    matchLabel:
      /^(?!.*\b(?:link|reply|unsent|video call|voice message|voice note|missed call)\b).*/i,
  },
];
