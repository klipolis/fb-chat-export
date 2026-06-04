const TIMED_CALL_TYPES = ['audio-call', 'video-call', 'voice-note'];
const MISSED_CALL_TYPES = ['missed-call', 'missed-audio-call', 'missed-video-call'];
const CALL_TYPES = [...TIMED_CALL_TYPES, ...MISSED_CALL_TYPES];
const CONTENT_TYPES = new Set(['text', 'link', 'reaction']);

module.exports = {
  TIMED_CALL_TYPES,
  MISSED_CALL_TYPES,
  CALL_TYPES,
  CONTENT_TYPES,
};
