const SENDER_PATTERN_SOURCE = '\\p{L}[\\p{L} .\'\\-_]{0,24}';
const SENDER_RE = new RegExp(`^${SENDER_PATTERN_SOURCE}$`, 'u');
const SENDER_MAX_WORDS = 3;

function isValidSender(value) {
  if (!SENDER_RE.test(value)) return false;
  if (/\d/.test(value)) return false;
  return value.trim().split(/\s+/).length <= SENDER_MAX_WORDS;
}

module.exports = {
  SENDER_PATTERN_SOURCE,
  SENDER_RE,
  SENDER_MAX_WORDS,
  isValidSender,
};
