module.exports = [
  {
    type: 'link',
    matchFile: /link/i,
    matchLabel: /open attachment|href|link|https?:\/\//i
  },
  {
    type: 'missed-call',
    matchFile: /missed call/i,
    matchLabel: /missed call/i
  },
  {
    type: 'text',
    matchFile: /reply/i,
    matchLabel: /reply/i
  },
  {
    type: 'unsent',
    matchFile: /(?:unsent|deleted)/i,
    matchLabel: /(?:unsent|deleted)/i
  },
  {
    type: 'video-call',
    matchFile: /video call/i,
    matchLabel: /video call/i
  },
  {
    type: 'voice-message',
    matchFile: /voice(?: message| note)/i,
    matchLabel: /voice(?: message| note)|audio(?: message| note)/i
  },
  {
    type: 'you-text',
    matchFile: /you - text message/i,
    matchLabel: /you:/i
  },
  {
    type: 'text',
    matchFile: /text message/i,
    matchLabel: /^(?!.*\b(?:link|reply|unsent|video call|voice message|voice note|missed call)\b).*/i
  }
];
