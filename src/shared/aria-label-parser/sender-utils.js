const { isValidSender } = require('../sender-constants');

function extractNameAfterBy(text) {
  const byIndex = text.lastIndexOf(' by ');
  if (byIndex < 0) return text;
  const candidate = text.slice(byIndex + 4).trim();
  if (isValidSender(candidate) && !/^(sent|message|by)$/i.test(candidate)) {
    return candidate;
  }
  return text;
}

module.exports = {
  extractNameAfterBy,
  isValidSender,
};
