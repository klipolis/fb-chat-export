const tap = require('tap');

function parseLocalDate(str) {
  if (!str) return NaN;
  const s = String(str).trim();
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const dmy = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  return NaN;
}

function computeAliasHash(aliasMap) {
  const sorted = Object.keys(aliasMap).sort().map((k) => `${k}:${aliasMap[k]}`).join('|');
  if (!sorted) return '';
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    hash = ((hash << 5) - hash) + sorted.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function canReuseCached(cached, personName, fromVal, toVal, aliasHash) {
  if (!cached || cached.personName !== personName) return null;
  const sameDates = cached.fromDate === fromVal && cached.toDate === toVal;
  const sameAliases = cached.aliasHash === aliasHash;
  if (sameDates && sameAliases) return 'exact';
  if (sameDates) return 'alias-only';
  const fromDate = fromVal ? parseLocalDate(fromVal) : null;
  const toDate = toVal ? parseLocalDate(toVal) : null;
  const cachedFrom = cached.fromDate ? parseLocalDate(cached.fromDate) : null;
  const cachedTo = cached.toDate ? parseLocalDate(cached.toDate) : null;
  if (cachedFrom && cachedTo && fromDate && toDate) {
    if (fromDate >= cachedFrom && toDate <= cachedTo) return 'narrower';
  }
  return null;
}

tap.test('computeAliasHash', (t) => {
  t.test('returns deterministic hash for same alias map', (t) => {
    const h1 = computeAliasHash({ Alice: 'A', Bob: 'B' });
    const h2 = computeAliasHash({ Alice: 'A', Bob: 'B' });
    t.equal(h1, h2, 'same input produces same hash');
    t.end();
  });

  t.test('returns different hash for different alias maps', (t) => {
    const h1 = computeAliasHash({ Alice: 'A' });
    const h2 = computeAliasHash({ Bob: 'B' });
    t.not(h1, h2, 'different maps produce different hashes');
    t.end();
  });

  t.test('returns empty string for empty map', (t) => {
    t.equal(computeAliasHash({}), '', 'empty map produces empty string');
    t.end();
  });

  t.test('same aliases in different order produce same hash', (t) => {
    const h1 = computeAliasHash({ Alice: 'A', Bob: 'B' });
    const h2 = computeAliasHash({ Bob: 'B', Alice: 'A' });
    t.equal(h1, h2, 'order-independent hash');
    t.end();
  });

  t.end();
});

tap.test('canReuseCached', (t) => {
  t.test('returns null when no cache exists', (t) => {
    t.equal(canReuseCached(null, 'Alice', '2026-01-01', '2026-01-31', 'hash'), null);
    t.equal(canReuseCached(undefined, 'Alice', '2026-01-01', '2026-01-31', 'hash'), null);
    t.end();
  });

  t.test('returns null when personName differs', (t) => {
    const cached = { personName: 'Alice', fromDate: '2026-01-01', toDate: '2026-01-31', aliasHash: 'hash' };
    t.equal(canReuseCached(cached, 'Bob', '2026-01-01', '2026-01-31', 'hash'), null);
    t.end();
  });

  t.test('returns exact when same dates and same aliases', (t) => {
    const cached = { personName: 'Alice', fromDate: '2026-01-01', toDate: '2026-01-31', aliasHash: 'abc' };
    t.equal(canReuseCached(cached, 'Alice', '2026-01-01', '2026-01-31', 'abc'), 'exact');
    t.end();
  });

  t.test('returns alias-only when same dates, different aliases', (t) => {
    const cached = { personName: 'Alice', fromDate: '2026-01-01', toDate: '2026-01-31', aliasHash: 'abc' };
    t.equal(canReuseCached(cached, 'Alice', '2026-01-01', '2026-01-31', 'xyz'), 'alias-only');
    t.end();
  });

  t.test('returns narrower when dates shrink', (t) => {
    const cached = { personName: 'Alice', fromDate: '2026-01-01', toDate: '2026-01-31', aliasHash: 'abc' };
    t.equal(canReuseCached(cached, 'Alice', '2026-01-05', '2026-01-20', 'xyz'), 'narrower');
    t.end();
  });

  t.test('returns null when dates expand', (t) => {
    const cached = { personName: 'Alice', fromDate: '2026-01-01', toDate: '2026-01-31', aliasHash: 'abc' };
    t.equal(canReuseCached(cached, 'Alice', '2025-12-01', '2026-02-28', 'xyz'), null);
    t.end();
  });

  t.test('returns null when dates only partially overlap (expand beyond cached)', (t) => {
    const cached = { personName: 'Alice', fromDate: '2026-01-01', toDate: '2026-01-31', aliasHash: 'abc' };
    t.equal(canReuseCached(cached, 'Alice', '2026-01-15', '2026-02-10', 'xyz'), null);
    t.end();
  });

  t.end();
});
