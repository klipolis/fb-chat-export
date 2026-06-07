const tap = require('tap');
const { parseAriaLabel, isValidSender } = require('../../src/shared/aria-label-parser.js');

// ---------------------------------------------------------------------------
// Unicode name recognition tests
// ---------------------------------------------------------------------------

tap.test('isValidSender Unicode recognition', (t) => {
  // Test Unicode letters in sender names
  t.ok(isValidSender('Ötten Bernő'), 'Hungarian name with diacritics accepted');
  t.ok(isValidSender('Ccoba Sloka'), 'Hungarian name accepted');
  t.ok(isValidSender('Müller'), 'German name with umlaut accepted');
  t.ok(isValidSender('François'), 'French name with cedilla accepted');
  t.ok(isValidSender('Борис'), 'Cyrillic name accepted');

  // Reject invalid sender names with numbers
  t.notOk(isValidSender('User123'), 'Name with digit rejected');
  t.notOk(isValidSender('Test456Name'), 'Name with digits rejected');

  // Reject empty or whitespace-only names
  t.notOk(isValidSender(''), 'Empty string rejected');
  t.notOk(isValidSender('   '), 'Whitespace-only string rejected');

  t.end();
});

tap.test('parseAriaLabel Unicode sender extraction', (t) => {
  // Extract Unicode sender names from aria-label
  const result1 = parseAriaLabel('Wednesday, June 2, 2026 at 10:30:Ötten Bernő');
  t.equal(result1.sender, 'Ötten Bernő', 'Hungarian sender extracted correctly');

  const result2 = parseAriaLabel('Wednesday, June 2, 2026 at 10:30:François Müller');
  t.equal(result2.sender, 'François Müller', 'French/German sender extracted correctly');

  t.end();
});
