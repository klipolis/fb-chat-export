const tap = require('tap');
const { extractHtmlLocale } = require(
  '../src/shared/create-nodes'
);
const { extractRawDuration, normalizeDuration } = require(
  '../src/shared/duration-utils'
);
const { findMatchingClosingTag } = require(
  '../src/shared/html-utils'
);

// ---------------------------------------------------------------------------
// extractHtmlLocale
// ---------------------------------------------------------------------------

tap.test('extractHtmlLocale', (t) => {
  t.equal(extractHtmlLocale('<html lang="en"><body></body></html>'), 'en', 'extracts en locale');
  t.equal(extractHtmlLocale('<html lang="fr"><body></body></html>'), 'fr', 'extracts fr locale');
  t.equal(extractHtmlLocale('<html lang="en-US"><body></body></html>'), 'en-US', 'extracts en-US locale');
  t.equal(extractHtmlLocale('<HTML LANG="DE"><body></body></HTML>'), 'DE', 'case-insensitive');
  t.equal(extractHtmlLocale('<html lang="" ><body></body></html>'), null, 'empty lang value returns null (regex needs 1+ chars)');
  t.equal(extractHtmlLocale('<html><body></body></html>'), null, 'no lang attribute returns null');
  t.equal(extractHtmlLocale(''), null, 'empty string returns null');
  t.equal(extractHtmlLocale(null), null, 'null returns null');
  t.equal(extractHtmlLocale(undefined), null, 'undefined returns null');
  t.end();
});

// ---------------------------------------------------------------------------
// extractRawDuration
// ---------------------------------------------------------------------------

tap.test('extractRawDuration', (t) => {
  t.equal(extractRawDuration(null), null, 'null returns null');
  t.equal(extractRawDuration(''), null, 'empty string returns null');
  t.equal(extractRawDuration('no duration here'), null, 'no duration pattern returns null');

  t.equal(extractRawDuration('duration 1:30:45 here'), '1:30:45', 'HH:MM:SS extracted');
  t.equal(extractRawDuration('1:30:45'), '1:30:45', 'pure HH:MM:SS');
  t.equal(extractRawDuration('time 0:05:30 text'), '0:05:30', 'zero-hour HH:MM:SS');
  t.equal(extractRawDuration('5:30'), '5:30', 'MM:SS format');
  t.equal(extractRawDuration('0:45'), '0:45', 'zero-minute MM:SS');
  t.equal(extractRawDuration('12:00'), '12:00', 'hour:minute as MM:SS');

  t.equal(extractRawDuration('5 mins 30 secs'), '5 mins', 'mins pattern');
  t.equal(extractRawDuration('10 minutes'), '10 min', 'minutes pattern (captures up to min)');
  t.equal(extractRawDuration('1 min'), '1 min', 'min pattern');
  t.equal(extractRawDuration('30 secs'), '30 secs', 'secs pattern');
  t.equal(extractRawDuration('45 seconds'), '45 seconds', 'seconds pattern');
  t.equal(extractRawDuration('15 sec'), '15 sec', 'sec pattern');

  t.equal(extractRawDuration('5 min 30 sec'), '5 min', 'mins takes priority over secs');
  t.equal(extractRawDuration('10:00 AM'), null, 'time like 10:00 AM is excluded');
  t.equal(extractRawDuration('12:00 pm'), null, 'time like 12:00 pm is excluded');
  t.equal(extractRawDuration('at 3:45 pm'), null, 'time with pm prefix excluded');
  t.equal(extractRawDuration('at 8:30 AM'), null, 'time with AM excluded');
  t.equal(extractRawDuration('  1:30:45  '), '1:30:45', 'whitespace trimmed');
  t.equal(extractRawDuration('  5:30  '), '5:30', 'whitespace trimmed MM:SS');

  t.end();
});

// ---------------------------------------------------------------------------
// findMatchingClosingTag
// ---------------------------------------------------------------------------

tap.test('findMatchingClosingTag', (t) => {
  // fromIndex must be PAST the opening tag (as all callers use match.index + match[0].length)
  const simple = '<div><p>hello</p></div>';
  t.equal(findMatchingClosingTag(simple, 'div', 5), 17, 'finds closing div at end');
  t.equal(findMatchingClosingTag(simple, 'p', 8), 13, 'finds closing p after opening');

  const nested = '<div><div><span></span></div></div>';
  t.equal(findMatchingClosingTag(nested, 'div', 5), 29, 'finds outer closing div past nested');
  t.equal(findMatchingClosingTag(nested, 'div', 10), 23, 'finds inner closing div');
  t.equal(findMatchingClosingTag(nested, 'span', 16), 16, 'finds closing span');

  const selfClosing = '<div><br><hr></div>';
  t.equal(findMatchingClosingTag(selfClosing, 'div', 5), 13, 'handles self-closing siblings');

  const noClose = '<div><p>hello</div>';
  t.equal(findMatchingClosingTag(noClose, 'p', 8), -1, 'missing closing tag returns -1');

  const noOpen = '<p>hello</p>';
  t.equal(findMatchingClosingTag(noOpen, 'div', 0), -1, 'no opening tag returns -1');

  const emptyHtml = '';
  t.equal(findMatchingClosingTag(emptyHtml, 'div', 0), -1, 'empty html returns -1');

  const sameTag = '<div>a</div><div>b</div>';
  t.equal(findMatchingClosingTag(sameTag, 'div', 5), 6, 'first div closing');
  t.equal(findMatchingClosingTag(sameTag, 'div', 17), 18, 'second div closing');

  t.end();
});

// ---------------------------------------------------------------------------
// voiceNoteDurationConsistency (T-203)
// ---------------------------------------------------------------------------

tap.test('voiceNoteDurationConsistency', (t) => {
  // Verify that raw durations extracted from voice-note labels
  // normalize correctly to HH:MM:SS format
  const pairs = [
    { raw: 'voice message 1:05', extracted: '1:05', normalized: '00:01:05' },
    { raw: 'voice message 0:30', extracted: '0:30', normalized: '00:00:30' },
    { raw: 'voice message 10:00', extracted: '10:00', normalized: '00:10:00' },
    { raw: 'voice message 1:05:30', extracted: '1:05:30', normalized: '01:05:30' },
    { raw: 'voice note 5 mins', extracted: '5 mins', normalized: '00:05:00' },
    { raw: 'voice note 30 secs', extracted: '30 secs', normalized: '00:00:30' },
  ];

  pairs.forEach(({ raw, extracted, normalized }, i) => {
    const result = extractRawDuration(raw);
    t.equal(result, extracted, `case ${i}: extractRawDuration(${JSON.stringify(raw)}) → ${JSON.stringify(extracted)}`);
    const normalizedResult = normalizeDuration(result);
    t.equal(normalizedResult, normalized, `case ${i}: normalizeDuration(${JSON.stringify(extracted)}) → ${normalized}`);
  });

  t.end();
});

// ---------------------------------------------------------------------------
// durationEdgeCases (T-204)
// ---------------------------------------------------------------------------

tap.test('durationEdgeCases', (t) => {
  // extractRawDuration edge cases
  const rawEdgeCases = [
    ['   ', null, 'whitespace only'],
    ['abc', null, 'no numbers'],
    ['5', null, 'single digit'],
    ['0:0', null, 'zero MM:SS too short'],
    ['1:2:3', null, 'single-digit parts'],
    ['1:1:1:1', null, 'too many colons'],
    ['min 5', null, 'min prefix before number'],
    ['secs 30', null, 'secs prefix before number'],
    ['-1:00', '1:00', 'negative sign ignored, digits extracted'],
    ['00:00:00', '00:00:00', 'all zeros HH:MM:SS'],
  ];

  rawEdgeCases.forEach(([input, expected, desc]) => {
    t.equal(extractRawDuration(input), expected, `extractRawDuration: ${desc}`);
  });

  // normalizeDuration edge cases
  const normEdgeCases = [
    ['', null, 'empty string'],
    [null, null, 'null'],
    [undefined, null, 'undefined'],
    ['0:0', null, 'zero MM:SS too short'],
    ['abc', null, 'no numbers'],
    ['1:2:3', null, 'single-digit parts'],
    ['1:1:1:1', null, 'too many colons'],
    ['   ', null, 'whitespace only'],
    ['-1:00', null, 'negative duration'],
    ['0:00:00', '00:00:00', 'all zeros HH:MM:SS'],
    ['0:30', '00:00:30', 'MM:SS to HH:MM:SS'],
    ['1:05', '00:01:05', 'MM:SS one minute'],
    ['10:00', '00:10:00', 'MM:SS ten minutes'],
    ['1:05:30', '01:05:30', 'HH:MM:SS pass through'],
    ['5 mins', '00:05:00', 'N mins format'],
    ['30 secs', '00:00:30', 'N secs format'],
  ];

  normEdgeCases.forEach(([input, expected, desc]) => {
    t.equal(normalizeDuration(input), expected, `normalizeDuration: ${desc}`);
  });

  t.end();
});
