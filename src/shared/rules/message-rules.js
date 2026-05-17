module.exports = [
  {
    type: 'unsent',
    matchFile: /^deleted\.html$/i,
    matchLabel: /deleted/i,
  },
  {
    type: 'audio-call',
    matchFile: /^audio-call\.html$/i,
    matchLabel: /audio call/i,
  },
  {
    type: 'image',
    matchFile: /^image\.html$/i,
    matchLabel: /image/i,
  },
  {
    type: 'link',
    matchFile: /^link-embed-no-text\.html$/i,
    matchLabel:
      /open attachment|href|https?:\/\/|open link|view link|download|attachment|pinned location/i,
  },
  {
    type: 'link',
    matchFile: /^link-text\.html$/i,
    matchLabel:
      /open attachment|href|https?:\/\/|open link|view link|download|attachment|pinned location/i,
  },
  {
    type: 'missed-call',
    matchFile: /^missed-audio-call\.html$/i,
    matchLabel: /missed[- ]call/i,
  },
  {
    type: 'missed-call',
    matchFile: /^missed-video-call\.html$/i,
    matchLabel: /missed[- ]call/i,
  },
  {
    type: 'text',
    matchFile: /^text-image-replied\.html$/i,
    matchLabel: /reply/i,
  },
  {
    type: 'text',
    matchFile: /^text-replied\.html$/i,
    matchLabel: /reply/i,
  },
  {
    type: 'video-call',
    matchFile: /^video-call\.html$/i,
    matchLabel: /video[- ]call/i,
  },
  {
    type: 'voice-message',
    matchFile: /^voice-note\.html$/i,
    matchLabel: /voice(?:[- ]message|[- ]note)|audio(?:[- ]message|[- ]note)/i,
  },
  {
    type: 'you-text',
    matchFile: /you - text message/i,
    matchLabel: /you:/i,
  },
  {
    type: 'text',
    matchFile: /^text\.html$/i,
    matchLabel:
      /^(?!.*\b(?:link|reply|unsent|video call|voice message|voice note|missed call)\b).*/i,
  },
];
