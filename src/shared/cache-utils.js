const { REUSE_EXACT, REUSE_ALIAS_ONLY, REUSE_NARROWER } = require('./constants');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function canReuseCached(cached, personName, fromVal, toVal, aliasHash, parseDate) {
  if (!cached || cached.personName !== personName) return null;
  if (cached.timestamp && (Date.now() - cached.timestamp > CACHE_TTL_MS)) return null;
  const sameDates = cached.fromDate === fromVal && cached.toDate === toVal;
  const sameAliases = cached.aliasHash === aliasHash;
  if (sameDates && sameAliases) return REUSE_EXACT;
  if (sameDates) return REUSE_ALIAS_ONLY;
  const fromDate = fromVal ? parseDate(fromVal) : null;
  const toDate = toVal ? parseDate(toVal) : null;
  const cachedFrom = cached.fromDate ? parseDate(cached.fromDate) : null;
  const cachedTo = cached.toDate ? parseDate(cached.toDate) : null;
  if (cachedFrom && cachedTo && fromDate && toDate) {
    if (fromDate >= cachedFrom && toDate <= cachedTo) return REUSE_NARROWER;
  }
  return null;
}

function filterEntriesByDateRange(entries, fromVal, toVal, parseDate) {
  const fromDateParsed = fromVal ? parseDate(fromVal) : null;
  const toDateParsed = toVal
    ? (() => {
        const d = parseDate(toVal);
        if (!isNaN(d)) d.setHours(23, 59, 59);
        return d;
      })()
    : null;
  return entries.filter((e) => {
    if (!e.ts) return false;
    if (fromDateParsed && e.ts < fromDateParsed.getTime()) return false;
    if (toDateParsed && e.ts > toDateParsed.getTime()) return false;
    return true;
  });
}

module.exports = { canReuseCached, filterEntriesByDateRange };
