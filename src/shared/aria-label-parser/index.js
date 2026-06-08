const { normalizeLabel, parseAriaLabel } = require('./core');
const {
  parseReferenceDate,
  normalizeDateToSimple,
  normalizeDateToIso,
  normalizeDateToIsoSafe,
  findValidDatePrefix,
  isValidDateCandidate,
} = require('./date-utils');
const { extractNameAfterBy, isValidSender } = require('./sender-utils');

module.exports = {
  parseAriaLabel,
  parseReferenceDate,
  normalizeDateToSimple,
  normalizeDateToIso,
  normalizeDateToIsoSafe,
  normalizeLabel,
  isValidSender,
  findValidDatePrefix,
  extractNameAfterBy,
  isValidDateCandidate,
};
