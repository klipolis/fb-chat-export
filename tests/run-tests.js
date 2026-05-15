const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { normalizeDateToSimple, parseAriaLabel } = require(path.join(__dirname, '..', 'src', 'shared', 'aria-label-parser'));
const { getContentMeta, normalizeDuration } = require(path.join(__dirname, '..', 'src', 'shared', 'message-metadata'));
const { createOptimizedHtml } = require(path.join(__dirname, '..', 'src', 'shared', 'optimize-html'));
const { buildAllMessageMetaMap, parseMessageNodes } = require(path.join(__dirname, '..', 'src', 'shared', 'create-nodes'));

const rawDir = path.join(__dirname, '..', 'Data-input-html-raw');

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

function testNormalizeDuration() {
  assert.strictEqual(normalizeDuration('0:20'), '0:20 mins');
  assert.strictEqual(normalizeDuration('31 mins'), '31 mins');
  assert.strictEqual(normalizeDuration('45 sec'), '1 mins');
  assert.strictEqual(normalizeDuration('2 min'), '2 mins');
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
  assert.strictEqual(voiceMeta.contentLength, undefined);
  assert.strictEqual(voiceMeta.duration, '1:05 mins');

  const shortVoiceMeta = getContentMeta({
    fileName: 'voice-test.html',
    ariaLabel: 'At today at 12:00, You: Voice message',
    message: 'voice message',
    timerText: '0:20 mins'
  });

  assert.strictEqual(shortVoiceMeta.type, 'voice-message');
  assert.strictEqual(shortVoiceMeta.text, 'voice message');
  assert.strictEqual(shortVoiceMeta.contentLength, undefined);
  assert.strictEqual(shortVoiceMeta.duration, '0:20 mins');

  const missedCallMeta = getContentMeta({
    fileName: 'missed-call.html',
    ariaLabel: 'At today at 14:00, You: Missed audio call',
    message: 'Missed audio call'
  });

  assert.strictEqual(missedCallMeta.type, 'missed-call');
  assert.strictEqual(missedCallMeta.text, 'Missed audio call');
  assert.strictEqual(missedCallMeta.contentLength, undefined);
  assert.strictEqual(missedCallMeta.duration, null);

  const embeddedLinkMeta = getContentMeta({
    fileName: 'link-embed.html',
    ariaLabel: 'At today at 15:00, You: Open Facebook',
    message: 'Open Facebook',
    rawMeta: { link: 'https://facebook.com' },
    hasLink: true
  });

  assert.strictEqual(embeddedLinkMeta.type, 'link');
  assert.strictEqual(embeddedLinkMeta.text, 'link');
  assert.strictEqual(embeddedLinkMeta.contentLength, undefined);
  assert.strictEqual(embeddedLinkMeta.link, 'https://facebook.com');

  const redirectLinkMeta = getContentMeta({
    fileName: 'link-redirect.html',
    ariaLabel: 'At today at 15:00, You: Open link',
    message: 'Open link',
    rawMeta: { link: 'https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com' },
    hasLink: true
  });
  assert.strictEqual(redirectLinkMeta.type, 'link');
  assert.strictEqual(redirectLinkMeta.text, 'link');
  assert.strictEqual(redirectLinkMeta.contentLength, undefined);
  assert.strictEqual(redirectLinkMeta.link, 'https://example.com');

  const attachmentMeta = getContentMeta({
    fileName: 'attachment.html',
    ariaLabel: 'At today at 16:00, You: View attachment',
    message: 'View attachment',
    hasLink: true
  });
  assert.strictEqual(attachmentMeta.type, 'link');
  assert.strictEqual(attachmentMeta.text, 'link');
  assert.strictEqual(attachmentMeta.contentLength, undefined);

  const videoMeta = getContentMeta({
    fileName: 'video-call.html',
    ariaLabel: 'At today at 11:14, You',
    message: 'video call',
    timerText: '31 mins'
  });

  assert.strictEqual(videoMeta.type, 'video-call');
  assert.strictEqual(videoMeta.text, 'video call');
  assert.strictEqual(videoMeta.contentLength, undefined);
  assert.strictEqual(videoMeta.duration, '31 mins');
}

function validatePreviewNode(node, fileName) {
  assert.strictEqual(typeof node.title, 'string', `${fileName}: title must be string`);
  assert.ok(node.timestamp, `${fileName}: timestamp is required`);
  assert.ok(node.locate && typeof node.locate === 'object', `${fileName}: locate is required`);
  assert.strictEqual(typeof node.locate.message, 'string');
  assert.strictEqual(typeof node.locate.label, 'string');
  assert.strictEqual(typeof node.locate.textContent, 'string');
  const preview = node.data_preview;
  assert.ok(preview && typeof preview === 'object', `${fileName}: data_preview is required`);
  assert.strictEqual(typeof preview.content_type, 'string');
  assert.ok('content' in preview, `${fileName}: content is required`);
  assert.ok(typeof preview.content === 'string');
  if (preview.raw_meta) {
    assert.strictEqual(typeof preview.raw_meta, 'object');
    if (preview.raw_meta.duration) assert.strictEqual(typeof preview.raw_meta.duration, 'string');
    if (preview.raw_meta.link) assert.strictEqual(typeof preview.raw_meta.link, 'string');
  }
  if (['voice-message', 'video-call', 'audio-call'].includes(preview.content_type)) {
    if (preview.duration !== undefined) {
      assert.strictEqual(preview.content_length, undefined, `${fileName}: timed preview with duration should omit content_length`);
    }
    if (preview.raw_meta) {
      assert.strictEqual(typeof preview.raw_meta.duration, 'string', `${fileName}: timed preview must include raw_meta.duration`);
    }
  }
  if (preview.content_type === 'link') {
    assert.strictEqual(preview.content_length, undefined, `${fileName}: link preview should not include content_length`);
  }
}

function testGeneratedPreviewSchema() {
  const metaMap = buildAllMessageMetaMap(rawDir);
  const rawFiles = fs.readdirSync(rawDir).filter(name => name.endsWith('.html'));
  assert.ok(rawFiles.length > 0, 'No raw sample files found');

  rawFiles.forEach(fileName => {
    const rawHtml = fs.readFileSync(path.join(rawDir, fileName), 'utf8');
    const optimized = createOptimizedHtml(rawHtml);
    const nodes = parseMessageNodes(optimized, fileName, '2026.05.15 00:00', metaMap);
    assert.ok(nodes.length > 0, `No parser nodes produced for ${fileName}`);
    nodes.forEach(node => validatePreviewNode(node, fileName));
  });
}

function testRawHtmlRegression() {
  const metaMap = buildAllMessageMetaMap(rawDir);
  const voiceNode = parseMessageNodes(createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'voice-note.html'), 'utf8')), 'voice-note.html', '2026.05.15 00:00', metaMap)[0];
  assert.strictEqual(voiceNode.data_preview.content_type, 'voice-message');
  assert.strictEqual(voiceNode.data_preview.duration, '0:20 mins');
  assert.strictEqual(voiceNode.data_preview.content_length, undefined);

  const videoNode = parseMessageNodes(createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'video-call.html'), 'utf8')), 'video-call.html', '2026.05.15 00:00', metaMap)[0];
  assert.strictEqual(videoNode.data_preview.content_type, 'video-call');
  assert.strictEqual(videoNode.data_preview.duration, '31 mins');
  assert.strictEqual(videoNode.data_preview.content_length, undefined);

  const embeddedLinkNode = parseMessageNodes(createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'link-embed-no-text.html'), 'utf8')), 'link-embed-no-text.html', '2026.05.15 00:00', metaMap)[0];
  assert.strictEqual(embeddedLinkNode.data_preview.content_type, 'link');
  assert.strictEqual(embeddedLinkNode.data_preview.content_length, undefined);
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
    { name: 'normalizeDuration', fn: testNormalizeDuration },
    { name: 'getContentMeta', fn: testGetContentMeta },
    { name: 'generatedPreviewSchema', fn: testGeneratedPreviewSchema },
    { name: 'rawHtmlRegression', fn: testRawHtmlRegression },
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
