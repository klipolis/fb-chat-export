const assert = require('assert');
const path = require('path');

const { normalizeDateToSimple, parseAriaLabel } = require(path.join(__dirname, '..', 'src', 'shared', 'aria-label-parser'));
const { getContentMeta } = require(path.join(__dirname, '..', 'src', 'shared', 'message-metadata'));

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function testNormalizeDateToSimple() {
  const today = new Date();
  const todayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const expectedDate = formatDate(today);

  const todayResult = normalizeDateToSimple(`today at 9:30 am`);
  assert.ok(todayResult.startsWith(expectedDate), `Expected today result to start with ${expectedDate}, got ${todayResult}`);

  const namedDayResult = normalizeDateToSimple(`${todayName} 2:45 pm`);
  assert.ok(namedDayResult.startsWith(expectedDate), `Expected day name result to start with ${expectedDate}, got ${namedDayResult}`);
}

function testGetContentMeta() {
  const linkMeta = getContentMeta({
    fileName: 'link-test.html',
    ariaLabel: 'At today at 12:00, You: Visit https://example.com',
    message: 'Visit https://example.com',
    hasLink: true
  });

  assert.strictEqual(linkMeta.type, 'link');
  assert.strictEqual(linkMeta.text, 'link');
  assert.strictEqual(linkMeta.contentLength, undefined);

  const voiceMeta = getContentMeta({
    fileName: 'voice-test.html',
    ariaLabel: 'At today at 12:00, You: Voice message',
    message: 'voice message',
    timerText: '1:05'
  });

  assert.strictEqual(voiceMeta.type, 'voice-message');
  assert.strictEqual(voiceMeta.text, 'voice message');
  assert.strictEqual(voiceMeta.contentLength, '2 min');
}

function testParseAriaLabel() {
  const parsed = parseAriaLabel('At May 15, 2026, 11:00, You: Hello world');
  assert.strictEqual(parsed.sender, 'You');
  assert.strictEqual(parsed.message, 'Hello world');
  assert.strictEqual(parsed.date, 'May 15, 2026, 11:00');
}

function runTests() {
  const tests = [
    { name: 'normalizeDateToSimple', fn: testNormalizeDateToSimple },
    { name: 'getContentMeta', fn: testGetContentMeta },
    { name: 'parseAriaLabel', fn: testParseAriaLabel }
  ];

  console.log(`Running ${tests.length} tests...`);

  for (const test of tests) {
    try {
      test.fn();
      console.log(`✔ ${test.name}`);
    } catch (error) {
      console.error(`✖ ${test.name}`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log('All tests passed.');
}

runTests();
