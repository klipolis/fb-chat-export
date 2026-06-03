const tap = require('tap');
const { normalizeDateToSimple, parseAriaLabel, isValidSender, findValidDatePrefix } = require(
  '../src/shared/aria-label-parser'
);

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// ---------------------------------------------------------------------------
// normalizeDateToSimple
// ---------------------------------------------------------------------------

tap.test('normalizeDateToSimple', (t) => {
  const today = new Date();
  const todayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const expectedDate = formatDate(today);

  const todayResult = normalizeDateToSimple('today at 9:30 am');
  t.ok(
    todayResult.startsWith(expectedDate),
    `Expected today result to start with ${expectedDate}, got ${todayResult}`
  );

  const namedDayResult = normalizeDateToSimple(`${todayName} 2:45 pm`);
  t.ok(
    namedDayResult.startsWith(expectedDate),
    `Expected day name result to start with ${expectedDate}, got ${namedDayResult}`
  );
  t.end();
});

// ---------------------------------------------------------------------------
// parseAriaLabel
// ---------------------------------------------------------------------------

tap.test('parseAriaLabel', (t) => {
  const parsed = parseAriaLabel('At May 15, 2026, 11:00, You: Hello world');
  t.equal(parsed.sender, 'You');
  t.equal(parsed.message, 'Hello world');
  t.equal(parsed.date, 'May 15, 2026, 11:00');
  t.end();
});

tap.test('parseAriaLabelLinkText', (t) => {
  const parsed = parseAriaLabel(
    'At Wednesday 7:51pm, Alpha Yep \u2014 that\u2019s the *Sennheiser IE 100 PRO In-Ear Monitoring* headphones'
  );
  t.equal(parsed.sender, 'Alpha');
  t.equal(parsed.date, 'Wednesday 7:51pm');
  t.ok(
    parsed.message.startsWith('Yep - that\u2019s the'),
    'Link text message preserve leading conversational token in message content'
  );
  t.end();
});

tap.test('parseAriaLabelSenderSplits', (t) => {
  const audioParsed = parseAriaLabel('At April 12, 2026, 1:23 PM, You');
  t.equal(audioParsed.sender, 'You');
  t.ok(audioParsed.date.includes('April 12, 2026'), 'Audio call date stay intact');

  const textParsed = parseAriaLabel('At 12:26 AM, Alpha Do you have that photo and a link?');
  t.equal(textParsed.sender, 'Alpha');
  t.equal(textParsed.message, 'Do you have that photo and a link?');
  t.end();
});

tap.test('parseAriaLabelUnicodeSender', (t) => {
  const parsed = parseAriaLabel('At 9:00 PM, Борис: привет мир');
  t.equal(parsed.sender, 'Борис');
  t.equal(parsed.message, 'привет мир');
  t.equal(parsed.date, '9:00 PM');
  t.end();
});

tap.test('parseAriaLabelTrailingConversationName', (t) => {
  // Relative time with message content and trailing conversation name
  const r1 = parseAriaLabel('At 12:22 AM, You: github actions nagyon jo, majd a vegen elmondom hogy mukodik');
  t.equal(r1.date, '12:22 AM');
  t.equal(r1.sender, 'You');
  t.equal(r1.message, 'github actions nagyon jo, majd a vegen elmondom hogy mukodik');

  // Day-of-week date with short conversation name suffix
  const r2 = parseAriaLabel('At Monday 4:41pm, You: pill, kuldj uj codot');
  t.equal(r2.date, 'Monday 4:41pm');
  t.equal(r2.sender, 'You');

  // Day-of-week date with another conversation name suffix
  const r3 = parseAriaLabel('At Friday 11:21am, You: A fenti link, chat');
  t.equal(r3.date, 'Friday 11:21am');
  t.equal(r3.sender, 'You');

  t.end();
});

tap.test('parseAriaLabelCalendarDateNoPrefix', (t) => {
  // Full calendar date without "At " prefix (e.g. from Messenger locale that omits "At")
  const r1 = parseAriaLabel('May 7, 2026, 7:09 AM, You: Hosting limitations, Google Mail or Microsoft better');
  t.equal(r1.date, 'May 7, 2026, 7:09 AM', 'Full date correctly extracted without At prefix');
  t.equal(r1.sender, 'You', 'Sender correctly extracted when date has multiple commas');
  t.equal(r1.message, 'Hosting limitations, Google Mail or Microsoft better', 'Message with commas preserved');

  const r2 = parseAriaLabel('April 29, 2026, 11:45 AM, Mimi: And also, another customer writes:Hello');
  t.equal(r2.date, 'April 29, 2026, 11:45 AM');
  t.equal(r2.sender, 'Mimi');
  t.ok(r2.message.startsWith('And also'), 'Message extracted correctly');

  const r3 = parseAriaLabel('May 5, 2026, 7:48 PM, Mimi: Also wanted to ask you one thing');
  t.equal(r3.date, 'May 5, 2026, 7:48 PM');
  t.equal(r3.sender, 'Mimi');

  t.end();
});

// ---------------------------------------------------------------------------
// isValidSender
// ---------------------------------------------------------------------------

tap.test('isValidSender', (t) => {
  // accepted: single word
  t.ok(isValidSender('You'), 'single word accepted');
  t.ok(isValidSender('Alpha'), 'single word accepted');
  // accepted: two words with one space
  t.ok(isValidSender('John Smith'), 'two words accepted');
  // accepted: three words
  t.ok(isValidSender('majd a vegen'), 'three words accepted');
  t.ok(isValidSender('John Paul Jones'), 'three words accepted');
  // rejected: four or more words
  t.notOk(isValidSender('A B C D'), 'four words rejected');
  t.notOk(isValidSender('one two three four'), 'four words rejected');
  // rejected: contains digit
  t.notOk(isValidSender('Alice 2024'), 'name with digit rejected');
  t.notOk(isValidSender('R2D2'), 'name with digits rejected');
  // rejected: starts with non-letter
  t.notOk(isValidSender('1Alpha'), 'starts with digit rejected');
  t.notOk(isValidSender(''), 'empty string rejected');
  // edge: three words with permitted punctuation
  t.ok(isValidSender("O'Brien"), "apostrophe in name accepted");
  t.ok(isValidSender('St. Claire'), 'period in name accepted');
  t.ok(isValidSender('Jean-Claude van Damme'), 'hyphen and three words accepted');
  // length: shorter than 50 chars
  t.ok(isValidSender('Aaaaaa Bbbbbbbbbbbbbbbbbbbbbbbbbbb Cccccccccccccc'), '49 chars accepted');
  t.notOk(isValidSender('Aaaaaaa Bbbbbbbbbbbbbbbbbbbbbbbbbbb Cccccccccccccc'), '50 chars rejected');
  const longName = 'A very long threeword name that is way more than allowed';
  t.ok(longName.length > 49, 'longName exceeds 49 chars');
  t.notOk(isValidSender(longName), 'name longer than 49 chars rejected');
  t.end();
});

// ---------------------------------------------------------------------------
// findValidDatePrefix
// ---------------------------------------------------------------------------

tap.test('findValidDatePrefix', (t) => {
  // Stops at the first segment that produces a valid ISO date.
  // 'May 15' is parseable by Date.parse, so the function returns just that.
  const r1 = findValidDatePrefix('May 15, 2026, 11:00, You');
  t.ok(r1 !== null && r1.startsWith('May 15'), `stops at first parseable segment: ${r1}`);

  // Day-of-week resolves on first segment
  const dow = findValidDatePrefix('Monday 4:41pm, You: some text');
  t.equal(dow, 'Monday 4:41pm', 'day-of-week prefix found');

  // Time-only resolves on first segment
  const timeOnly = findValidDatePrefix('12:22 AM, You: message');
  t.equal(timeOnly, '12:22 AM', 'time-only prefix found');

  // No valid prefix
  t.equal(findValidDatePrefix('not a date at all'), null, 'invalid string returns null');
  t.end();
});

// ---------------------------------------------------------------------------
// normalizeDateToSimple — extended date format coverage
// ---------------------------------------------------------------------------

tap.test('normalizeDateToSimpleExtended', (t) => {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${today.getFullYear()}.${pad(today.getMonth() + 1)}.${pad(today.getDate())}`;

  // time-only (today)
  const r1 = normalizeDateToSimple('12:22 AM');
  t.ok(r1.startsWith(todayStr), `time-only resolves to today: ${r1}`);
  t.ok(r1.endsWith('00:22'), `12:22 AM resolves to 00:22: ${r1}`);

  const r2 = normalizeDateToSimple('3:45 PM');
  t.ok(r2.endsWith('15:45'), `3:45 PM resolves to 15:45: ${r2}`);

  // yesterday
  const r3 = normalizeDateToSimple('yesterday at 10:30 am');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}.${pad(yesterday.getMonth() + 1)}.${pad(yesterday.getDate())}`;
  t.ok(r3.startsWith(yStr), `yesterday resolves correctly: ${r3}`);

  // day of week — Monday
  const r4 = normalizeDateToSimple('Monday 4:41pm');
  t.ok(/^\d{4}\.\d{2}\.\d{2} 16:41$/.test(r4), `Monday 4:41pm normalizes to 16:41: ${r4}`);

  // day of week — Friday no-space am/pm
  const r5 = normalizeDateToSimple('Friday 11:21am');
  t.ok(/^\d{4}\.\d{2}\.\d{2} 11:21$/.test(r5), `Friday 11:21am normalizes to 11:21: ${r5}`);

  // full month-name date
  const r6 = normalizeDateToSimple('April 17, 2026, 3:45 PM');
  t.equal(r6, '2026.04.17 15:45', 'full date with month name normalizes correctly');

  // returns raw string for unrecognised input
  const r7 = normalizeDateToSimple('not a date');
  t.equal(r7, 'not a date', 'unrecognised input returned unchanged');

  t.end();
});

// ---------------------------------------------------------------------------
// timeOnlyDateResolvesToToday
// ---------------------------------------------------------------------------

tap.test('timeOnlyDateResolvesToToday', (t) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const expectedPrefix = `${yyyy}.${mm}.${dd}`;

  const result = normalizeDateToSimple('11:16 AM');
  t.ok(
    result && result.startsWith(expectedPrefix),
    `time-only label resolve to today (${expectedPrefix}), got ${result}`
  );
  t.end();
});
