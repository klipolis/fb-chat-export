const tap = require('tap');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { compareSnapshots } = require('./snapshot-helper');

const { normalizeDateToSimple, normalizeDateToIso, parseAriaLabel, isValidSender, findValidDatePrefix } = require(
  '../src/shared/aria-label-parser'
);
const childProcess = require('child_process');
const { getContentMeta, normalizeDuration, chooseRule } = require(
  '../src/shared/message-metadata'
);
const { formatExportHeader, formatLine, buildExportText } = require(
  '../src/shared/export-formatter'
);
const { formatExportFileName } = require(
  '../src/shared/export-text'
);
const { buildSummary } = require(
  '../src/shared/export-summary'
);
const { buildEntriesFromDocument } = require(
  '../src/shared/export-text'
);
const { createOptimizedHtml } = require(
  '../src/shared/optimize-html'
);
const { buildAllMessageMetaMap, parseMessageNodes } = require(
  '../src/shared/create-nodes'
);
const { aliasChatNames } = require('../src/shared/utils');

const rawDir = path.join(__dirname, '../data-input');
const referenceDate = '2026.05.15 00:00';

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
// normalizeDuration
// ---------------------------------------------------------------------------

tap.test('normalizeDuration', (t) => {
  t.equal(normalizeDuration('0:20'), '00:00:20');
  t.equal(normalizeDuration('1:23:45'), '01:23:45');
  t.equal(normalizeDuration('31 mins'), '00:31:00');
  t.equal(normalizeDuration('45 sec'), '00:00:45');
  t.equal(normalizeDuration('2 min'), '00:02:00');
  t.equal(normalizeDuration('1:23 PM'), null);
  t.end();
});

// ---------------------------------------------------------------------------
// getContentMeta
// ---------------------------------------------------------------------------

tap.test('getContentMeta', (t) => {
  const linkMeta = getContentMeta({
    fileName: 'link-test.html',
    ariaLabel: 'At today at 12:00, You: Visit https://example.com',
    message: 'Visit https://example.com',
    hasLink: true,
  });
  t.equal(linkMeta.type, 'link');
  t.equal(linkMeta.text, 'https://example.com');
  t.equal(linkMeta.contentLength, undefined);

  const voiceMeta = getContentMeta({
    fileName: 'voice-test.html',
    ariaLabel: 'At today at 12:00, You: Voice message',
    message: 'voice message',
    timerText: '1:05',
  });
  t.equal(voiceMeta.type, 'voice-note');
  t.equal(voiceMeta.text, 'voice note');
  t.equal(voiceMeta.contentLength, undefined);
  t.equal(voiceMeta.duration, '00:01:05');

  const shortVoiceMeta = getContentMeta({
    fileName: 'voice-test.html',
    ariaLabel: 'At today at 12:00, You: Voice message',
    message: 'voice message',
    timerText: '0:20 mins',
  });
  t.equal(shortVoiceMeta.type, 'voice-note');
  t.equal(shortVoiceMeta.text, 'voice note');
  t.equal(shortVoiceMeta.contentLength, undefined);
  t.equal(shortVoiceMeta.duration, '00:00:20');

  const missedCallMeta = getContentMeta({
    fileName: 'missed-call.html',
    ariaLabel: 'At today at 14:00, You: Missed audio call',
    message: 'Missed audio call',
  });
  t.equal(missedCallMeta.type, 'missed-call');
  t.equal(missedCallMeta.text, 'Missed audio call');
  t.equal(missedCallMeta.contentLength, undefined);
  t.equal(missedCallMeta.duration, null);

  const embeddedLinkMeta = getContentMeta({
    fileName: 'link-embed.html',
    ariaLabel: 'At today at 15:00, You: Open Facebook',
    message: 'Open Facebook',
    rawMeta: { link: 'https://facebook.com' },
    hasLink: true,
  });
  t.equal(embeddedLinkMeta.type, 'link');
  t.equal(embeddedLinkMeta.text, 'https://facebook.com');
  t.equal(embeddedLinkMeta.contentLength, undefined);
  t.equal(embeddedLinkMeta.link, 'https://facebook.com');

  const redirectLinkMeta = getContentMeta({
    fileName: 'link-redirect.html',
    ariaLabel: 'At today at 15:00, You: Open link',
    message: 'Open link',
    rawMeta: { link: 'https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com' },
    hasLink: true,
  });
  t.equal(redirectLinkMeta.type, 'link');
  t.equal(redirectLinkMeta.text, 'https://example.com');
  t.equal(redirectLinkMeta.contentLength, undefined);
  t.equal(redirectLinkMeta.link, 'https://example.com');

  const attachmentMeta = getContentMeta({
    fileName: 'attachment.html',
    ariaLabel: 'At today at 16:00, You: View attachment',
    message: 'View attachment',
    hasLink: true,
  });
  t.equal(attachmentMeta.type, 'link');
  t.equal(attachmentMeta.text, 'link');
  t.equal(attachmentMeta.contentLength, undefined);

  const pinnedLocationMeta = getContentMeta({
    fileName: 'link-embed-no-text.html',
    ariaLabel: 'At Friday 1:51pm, Alpha',
    message:
      'Pinned Location Hall Mead Nursery, Nazeing Road Waltham Abbey England EN9 2EU United Kingdom',
    hasLink: true,
  });
  t.equal(pinnedLocationMeta.type, 'link');
  t.ok(
    /^https:\/\/www\.google\.com\/maps\/search\//.test(pinnedLocationMeta.text),
    'Pinned location link content is mapped as to a Google Maps URL'
  );
  t.ok(
    /^https:\/\/www\.google\.com\/maps\/search\//.test(pinnedLocationMeta.link),
    'Pinned location link field is mapped as to a Google Maps URL'
  );
  t.equal(pinnedLocationMeta.contentLength, undefined);

  const videoMeta = getContentMeta({
    fileName: 'video-call.html',
    ariaLabel: 'At today at 11:14, You',
    message: 'video call',
    timerText: '31 mins',
  });
  t.equal(videoMeta.type, 'video-call');
  t.equal(videoMeta.text, 'video call');
  t.equal(videoMeta.contentLength, undefined);
  t.equal(videoMeta.duration, '00:31:00');

  const imageOnlyMeta = getContentMeta({
    fileName: 'image-only.html',
    ariaLabel: 'At today at 8:59, You',
    message: '',
    hasImage: true,
  });
  t.equal(imageOnlyMeta.type, 'image', 'image-only messages are classified as image');
  t.equal(imageOnlyMeta.text, 'image sent');
  t.equal(imageOnlyMeta.contentLength, undefined);

  const image2Meta = getContentMeta({
    fileName: 'image-2.html',
    ariaLabel: 'At today at 9:00, You',
    message: '',
    hasImage: true,
    imageCount: 2,
  });
  t.equal(image2Meta.type, 'image', 'image-2 files are classified as image');
  t.equal(image2Meta.imageCount, 2, 'image-2 imageCount is preserved');

  const image3Meta = getContentMeta({
    fileName: 'image-3.html',
    ariaLabel: 'At today at 9:00, You',
    message: '',
    hasImage: true,
    imageCount: 4,
  });
  t.equal(image3Meta.type, 'image', 'image-3 files are classified as image');
  t.equal(image3Meta.imageCount, 4, 'image-3 imageCount is preserved');

  t.end();
});

// ---------------------------------------------------------------------------
// browserExportFormatting
// ---------------------------------------------------------------------------

tap.test('browserExportFormatting', (t) => {
  const header = formatExportHeader({
    method: 'browser',
    messageTypes: ['text', 'image'],
    exportOptions: { content: true, rawLink: true },
    aliasMap: { You: 'Youghurt' },
  });
  t.ok(header.includes('Method: browser'), 'header includes method browser');
  t.ok(header.includes('- text'), 'header lists text message type');
  t.ok(header.includes('- image'), 'header lists image message type');
  t.ok(header.includes('Options:'), 'header includes Options line');
  t.ok(header.includes('Unused:'), 'header includes Unused line');
  t.ok(header.includes('Options: content, rawLink'), 'header includes active options');
  t.ok(header.includes('Aliases:'), 'header includes Aliases block');
  t.ok(header.includes('  You : Youghurt'), 'header includes alias entries');

  const formattedLine = formatLine(
    {
      fileType: 'text',
      semanticType: 'text',
      dateText: '2026-05-17 11:00',
      sender: 'Alpha',
      duration: '0:20 mins',
      content: 'Hello',
      contentLength: 5,
    },
    { includeContent: true, includeLength: true }
  );
  t.equal(
    formattedLine,
    '[2026-05-17 11:00] Alpha: text 00:00:20 5 / Hello\n',
    'Browser line formatting includes type, duration, length, and content'
  );

  const summary = buildSummary(
    [
      {
        sender: 'Alpha',
        date: new Date('2026-05-17T11:00:00Z'),
        type: 'text',
        isCall: false,
        isImage: false,
        callMinutes: 0,
      },
      {
        sender: 'Youghurt',
        date: new Date('2026-05-17T11:05:00Z'),
        type: 'image',
        isCall: false,
        isImage: true,
        callMinutes: 0,
      },
    ],
    { useMessageLabel: true }
  );
  t.ok(summary.includes('Total Summary'), 'Summary output includes Total Summary title');
  t.ok(
    summary.includes('1 message / 1 day'),
    'Summary output use message/day labels with useMessageLabel'
  );
  t.ok(summary.includes('Alpha Summary'), 'Summary output includes Alpha Summary');
  t.ok(summary.includes('Youghurt Summary'), 'Summary output includes Youghurt Summary');

  t.end();
});

// ---------------------------------------------------------------------------
// browserExportDomRegression
// ---------------------------------------------------------------------------

tap.test('browserExportDomRegression', (t) => {
  const dom = new JSDOM(`
    <div aria-roledescription="message" aria-label="At April 17, 2026, 3:45 PM, You: Hello world">Hello world</div>
  `);
  const entries = buildEntriesFromDocument(dom.window.document, 'text.html', referenceDate);
  t.equal(entries.length, 1, 'Parses one message entry');

  const entry = entries[0];
  t.equal(entry.sender, 'Youghurt', 'Self-sender is normalized to Youghurt');
  t.equal(entry.semanticType, 'text', 'Message type resolve to text');
  t.equal(entry.dateText, '2026-04-17 15:45', 'Date text is normalized to ISO-friendly format');
  t.equal(entry.content, 'Hello world', 'Text content is preserved');

  const formattedLine = formatLine(entry, { includeContent: true, includeLength: true });
  t.equal(
    formattedLine,
    '[2026-04-17 15:45] Youghurt: text 11 chars / Hello world\n',
    'Formatted browser line includes duration, length, and content'
  );

  t.end();
});

// ---------------------------------------------------------------------------
// generatedPreviewSchema
// ---------------------------------------------------------------------------

function validatePreviewNode(t, node, fileName) {
  t.equal(typeof node.title, 'string', `${fileName}: title must be string`);
  t.equal(typeof node.type, 'string', `${fileName}: type must be string`);
  t.ok(node.timestamp, `${fileName}: timestamp is required`);

  const raw = node.data_raw;
  const preview = node.data_preview;
  t.ok(raw && typeof raw === 'object', `${fileName}: data_raw is required`);
  t.ok(preview && typeof preview === 'object', `${fileName}: data_preview is required`);

  // data_raw keys must always be present
  t.ok('date' in raw, `${fileName}: data_raw.date is required`);
  t.ok('content' in raw, `${fileName}: data_raw.content is required`);
  t.ok('duration' in raw, `${fileName}: data_raw.duration is required`);
  t.ok('length' in raw, `${fileName}: data_raw.length is required`);
  t.equal(raw.length, null, `${fileName}: data_raw.length must be null`);

  // data_preview keys must always be present
  t.ok('date' in preview, `${fileName}: data_preview.date is required`);
  t.equal(typeof preview.date, 'string', `${fileName}: data_preview.date must be string`);
  t.ok('content' in preview, `${fileName}: data_preview.content is required`);
  t.ok(preview.content === null || typeof preview.content === 'string', `${fileName}: data_preview.content must be string or null`);
  t.ok('duration' in preview, `${fileName}: data_preview.duration is required`);
  t.ok('length' in preview, `${fileName}: data_preview.length is required`);

  // reactions: content must be null in both sections
  if (node.type === 'reaction') {
    t.equal(raw.content, null, `${fileName}: reaction data_raw.content must be null`);
    t.equal(preview.content, null, `${fileName}: reaction data_preview.content must be null`);
    t.equal(preview.length, null, `${fileName}: reaction data_preview.length must be null`);
  }

  // timed types: duration is string, length must be null
  if (['voice-note', 'video-call', 'audio-call'].includes(node.type)) {
    if (preview.duration !== null) {
      t.equal(typeof preview.duration, 'string', `${fileName}: timed type duration must be string`);
      t.equal(preview.length, null, `${fileName}: timed type with duration have null length`);
    }
  }
}

tap.test('generatedPreviewSchema', (t) => {
  const metaMap = buildAllMessageMetaMap(rawDir);
  const rawFiles = fs.readdirSync(rawDir).filter((name) => name.endsWith('.html'));
  t.ok(rawFiles.length > 0, 'No raw sample files found');

  rawFiles.forEach((fileName) => {
    const rawHtml = fs.readFileSync(path.join(rawDir, fileName), 'utf8');
    const optimized = createOptimizedHtml(rawHtml);
    const nodes = parseMessageNodes(optimized, fileName, '2026.05.15 00:00', metaMap);
    t.ok(nodes.length > 0, `No parser nodes produced for ${fileName}`);
    nodes.forEach((node) => validatePreviewNode(t, node, fileName));
  });

  t.end();
});

// ---------------------------------------------------------------------------
// rawHtmlRegression
// ---------------------------------------------------------------------------

tap.test('rawHtmlRegression', (t) => {
  const metaMap = buildAllMessageMetaMap(rawDir);

  const voiceNode = parseMessageNodes(
    createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'voice-note.html'), 'utf8')),
    'voice-note.html',
    '2026.05.15 00:00',
    metaMap
  )[0];
  t.equal(voiceNode.type, 'voice-note');
  t.equal(voiceNode.data_preview.duration, '00:00:20');
  t.equal(voiceNode.data_raw.duration, '00:00:20', 'voice-note raw duration is normalized to HH:MM:SS');
  t.equal(voiceNode.data_preview.length, null);

  const videoNode = parseMessageNodes(
    createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'video-call.html'), 'utf8')),
    'video-call.html',
    '2026.05.15 00:00',
    metaMap
  )[0];
  t.equal(videoNode.type, 'video-call');
  t.equal(videoNode.data_preview.duration, '00:31:00');
  t.equal(videoNode.data_raw.duration, '00:31:00', 'video-call raw duration is normalized to HH:MM:SS');
  t.equal(videoNode.data_preview.length, null);

  const embeddedLinkNode = parseMessageNodes(
    createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'link-embed-no-text.html'), 'utf8')),
    'link-embed-no-text.html',
    '2026.05.15 00:00',
    metaMap
  )[0];
  t.equal(embeddedLinkNode.type, 'link');
  t.equal(embeddedLinkNode.data_preview.length, null);

  t.end();
});

// ---------------------------------------------------------------------------
// testLinkFileUsesLinkType
// ---------------------------------------------------------------------------

tap.test('testLinkFileUsesLinkType', (t) => {
  const result = getContentMeta({
    fileName: 'link-text.html',
    ariaLabel: 'At Thursday 5:34pm, Alpha: image sent',
    message: 'image sent',
    rawMeta: { link: 'https://www.scan.co.uk/' },
    hasLink: false,
  });
  t.equal(result.type, 'link', 'link-text files is classified as link when raw meta link is present');
  t.ok(result.text.startsWith('https://www.scan.co.uk/'), 'link-text content is prepended with the URL');
  t.ok(result.text.includes('image sent'), 'link-text content keep message text after the URL');
  t.ok(/\d+ chars$/.test(result.contentLength), 'link-text previews with text includes content_length');
  t.equal(result.link, 'https://www.scan.co.uk/');
  t.end();
});

// ---------------------------------------------------------------------------
// testMissedCallNoDuration
// ---------------------------------------------------------------------------

tap.test('testMissedCallNoDuration', (t) => {
  const result = getContentMeta({
    fileName: 'missed-calls.html',
    ariaLabel: 'At Thursday 5:34pm, Alpha: Missed audio call',
    message: 'Missed audio call',
    rawMeta: {},
    hasLink: false,
  });
  t.equal(result.type, 'missed-call');
  t.equal(result.duration, null, 'missed calls does not include duration');
  t.equal(result.contentLength, undefined, 'missed-call previews does not include content_length');
  t.end();
});

// ---------------------------------------------------------------------------
// testTextFileDoesNotBecomeLink
// ---------------------------------------------------------------------------

tap.test('testTextFileDoesNotBecomeLink', (t) => {
  const metaMap = buildAllMessageMetaMap(rawDir);
  const nodes = parseMessageNodes(
    createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'text.html'), 'utf8')),
    'text.html',
    '2026.05.15 00:00',
    metaMap
  );
  t.equal(nodes.length, 1, 'text.html produces one node');
  t.equal(nodes[0].type, 'text', 'text.html is classified as text');
  t.not(nodes[0].data_preview.content, 'link', 'text.html content is not reduced to link');
  t.end();
});

// ---------------------------------------------------------------------------
// testImageFileIsImageType
// ---------------------------------------------------------------------------

tap.test('testImageFileIsImageType', (t) => {
  const metaMap = buildAllMessageMetaMap(rawDir);
  const nodes = parseMessageNodes(
    createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'image.html'), 'utf8')),
    'image.html',
    '2026.05.15 00:00',
    metaMap
  );
  t.equal(nodes.length, 1, 'image.html produces one node');
  t.equal(nodes[0].type, 'image', 'image.html is classified as image');
  t.equal(nodes[0].data_preview.content, 'image sent', 'image message preview use image sent content');
  t.end();
});

// ---------------------------------------------------------------------------
// testOptimizedHtmlNoEmptyTags
// ---------------------------------------------------------------------------

tap.test('testOptimizedHtmlNoEmptyTags', (t) => {
  const rawFiles = fs.readdirSync(rawDir).filter((name) => name.endsWith('.html'));
  rawFiles.forEach((fileName) => {
    const rawHtml = fs.readFileSync(path.join(rawDir, fileName), 'utf8');
    const optimized = createOptimizedHtml(rawHtml);
    t.ok(
      !/<([a-zA-Z0-9]+)([^>]*)>\s*<\/\1>/.test(optimized),
      `${fileName}: optimized HTML not contain empty tags`
    );
  });
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
  // rejected: three or more words
  t.notOk(isValidSender('majd a vegen'), 'three words rejected');
  t.notOk(isValidSender('John Paul Jones'), 'three words rejected');
  // rejected: contains digit
  t.notOk(isValidSender('Alice 2024'), 'name with digit rejected');
  t.notOk(isValidSender('R2D2'), 'name with digits rejected');
  // rejected: starts with non-letter
  t.notOk(isValidSender('1Alpha'), 'starts with digit rejected');
  t.notOk(isValidSender(''), 'empty string rejected');
  // edge: two words with permitted punctuation
  t.ok(isValidSender("O'Brien"), "apostrophe in name accepted");
  t.ok(isValidSender('St. Claire'), 'period in name accepted');
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
// aliasChatNames
// ---------------------------------------------------------------------------

tap.test('aliasChatNames', (t) => {
  const rawHtml =
    '<title>Rob</title><div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"><img alt="Rob Leon"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div>Message body mentioning Rob is aliased.</div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('aria-label="At Wednesday 7:54pm, Alpha"'), 'Sender aria-label is aliased');
  t.ok(cleaned.includes('aria-label="Enter, Message sent Wednesday 7:54pm by Alpha"'), 'Enter message sender is aliased');
  t.ok(cleaned.includes('<img alt="Alpha Leon"'), 'Profile alt text sender word is aliased');
  t.notOk(cleaned.includes('Rob deleted a message'), 'Message content is aliased');
  t.notOk(cleaned.includes('Message body mentioning Rob is aliased.'), 'Message body text references is aliased');
  t.ok(cleaned.includes('<title>Alpha</title>'), 'Chat title is aliased');
  t.end();
});

tap.test('aliasChatNamesPreservesYou', (t) => {
  const rawHtml =
    '<div aria-label="At Thursday 5:34pm, You" aria-roledescription="message"></div><div aria-label="Enter, Message sent Thursday 5:34pm by You"></div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('aria-label="At Thursday 5:34pm, You"'), 'Self-label You remains unchanged');
  t.ok(cleaned.includes('aria-label="Enter, Message sent Thursday 5:34pm by You"'), 'Self-label by You remains unchanged');
  t.end();
});

tap.test('aliasChatNamesWithNameMap', (t) => {
  const nameMap = { You: 'Youghurt', any: 'Alpha' };
  const rawHtml =
    '<title>Rob</title><div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div aria-label="At Wednesday 8:00pm, You" aria-roledescription="message"></div><div>You sent a message</div>';
  const cleaned = aliasChatNames(rawHtml, nameMap);
  // Other person replaced using nameMap.any
  t.ok(cleaned.includes('Alpha deleted a message'), 'Detected name replaced with nameMap.any');
  t.ok(cleaned.includes('aria-label="At Wednesday 7:54pm, Alpha"'), 'Detected sender in aria-label replaced');
  // "You" replaced using explicit nameMap entry
  t.ok(cleaned.includes('aria-label="At Wednesday 8:00pm, Youghurt"'), 'You replaced with Youghurt in aria-label');
  t.ok(cleaned.includes('Youghurt sent a message'), 'You replaced with Youghurt in body text');
  t.end();
});

tap.test('aliasChatNamesOnlyReplacesShortSenderNames', (t) => {
  const rawHtml =
    '<div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div>All of this is a long phrase that is not a sender name</div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('Alpha deleted a message'), 'Valid short sender name is aliased');
  t.ok(cleaned.includes('All of this is a long phrase that is not a sender name'), 'Long non-name phrases is not aliased');
  t.end();
});

tap.test('aliasChatNamesPreservesRawDateText', (t) => {
  const rawHtml =
    '<title>Rob</title><div aria-label="At May 15, 2026, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent May 15, 2026 by Rob"></div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('May 15, 2026'), 'Raw date text remains unchanged');
  t.ok(
    cleaned.includes('Alpha deleted a message') || cleaned.includes('Alpha'),
    'Confirmed sender name is aliased'
  );
  t.end();
});

tap.test('aliasChatNamesIgnoresNamesWithNumbers', (t) => {
  const rawHtml =
    '<div aria-label="At Thursday 5:34pm, Alice 2024" aria-roledescription="message"></div><div>Alice 2024 deleted a message</div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('Alice 2024'), 'Numeric names is not aliased');
  t.notOk(cleaned.includes('Alpha 2024'), 'Numeric names is not replaced with Alpha');
  t.end();
});

tap.test('aliasChatNamesSkipsAlreadyTargetName', (t) => {
  // Auto-detect: if the detected name is already the replacement, skip (no double-replace).
  const nameMap = { any: 'Alpha' };
  const rawHtml =
    '<div aria-label="At Thursday 5:34pm, Alpha" aria-roledescription="message"></div>' +
    '<div>Alpha deleted a message</div>' +
    '<div aria-label="At Thursday 5:35pm, Alpha" aria-roledescription="message"></div>' +
    '<div>Alpha sent another message</div>';
  const cleaned = aliasChatNames(rawHtml, nameMap);
  // Remains unchanged — "Alpha" is already the replacement name
  t.ok(cleaned.includes('Alpha deleted a message'), 'Already-target name kept unchanged');
  t.notOk(cleaned.includes('Alpha Alpha'), 'Name not double-replaced');

  // Explicit map: if from === to (same name), skip replacement
  const nameMap2 = { You: 'You', any: 'Alpha' };
  const rawHtml2 =
    '<div aria-label="At Thursday 5:34pm, You" aria-roledescription="message"></div>' +
    '<div>You sent a message</div>';
  const cleaned2 = aliasChatNames(rawHtml2, nameMap2);
  t.ok(cleaned2.includes('You sent a message'), 'from===to explicit entry is a no-op');
  t.end();
});

// ---------------------------------------------------------------------------
// scanToExportIntegration — full pipeline: DOM → entries → summary → header → text
// ---------------------------------------------------------------------------

tap.test('scanToExportIntegration', (t) => {
  const dom = new JSDOM(`
    <div aria-roledescription="message" aria-label="At April 12, 2026, 1:23 PM, Alpha: audio call 18 mins"></div>
    <div aria-roledescription="message" aria-label="At April 14, 2026, 6:34 PM, Alpha: Well i didn't know about this">Well i didn't know about this</div>
    <div aria-roledescription="message" aria-label="At May 13, 2026, 7:51 PM, Alpha">
      <img alt="image" />
    </div>
  `);

  const entries = buildEntriesFromDocument(dom.window.document, 'text.html', referenceDate);
  t.equal(entries.length, 3, 'Parses three message entries');

  const summaryEntries = entries.map((e) => ({
    sender: e.sender,
    date: new Date(e.ts),
    type: e.semanticType,
    isCall: e.semanticType === 'audio-call' || e.semanticType === 'video-call' || e.semanticType === 'missed-call',
    isImage: e.semanticType === 'image',
    callMinutes: e.duration ? (Number(e.duration.match(/^(\d+):/)?.[1] || 0) * 60 + Number(e.duration.match(/:(\d{2})/)?.[1] || 0)) : 0,
    ts: e.ts,
  }));

  const messageTypes = [...new Set(entries.map((e) => e.semanticType))].sort();
  const header = formatExportHeader({ method: 'browser', messageTypes });
  t.ok(header.startsWith('Method: browser'), 'Header starts with method line');
  t.ok(header.includes('---'), 'Header includes separator');

  const summaryText = buildSummary(summaryEntries, { useMessageLabel: true });
  t.ok(summaryText.includes('Total Summary'), 'Summary includes Total Summary');
  t.ok(summaryText.includes('3 messages'), 'Total message count is 3');
  t.ok(summaryText.includes('Alpha Summary'), 'Alpha appears in summary');

  const lines = entries.map((e) =>
    formatLine(e, { includeContent: true, includeLength: true })
  );
  const fullText = buildExportText(lines, header + summaryText);

  t.ok(fullText.startsWith('Method: browser'), 'Full export starts with header');
  t.ok(fullText.includes('Total Summary'), 'Full export includes summary');
  t.ok(fullText.includes('[2026-04-14 18:34] Alpha:'), 'Full export includes dated message line');
  t.ok(fullText.includes("Well i didn't know about this"), 'Full export includes message content');

  t.end();
});

// ---------------------------------------------------------------------------
// frontendBuildDist
// ---------------------------------------------------------------------------

tap.test('frontendBuildDist', (t) => {
  const baseDir = path.join(__dirname, '..');
  const buildResult = childProcess.spawnSync('node', ['src/frontend/build.cjs'], {
    cwd: baseDir,
    encoding: 'utf8',
  });
  t.equal(buildResult.status, 0, `build.js failed: ${buildResult.stderr || buildResult.stdout}`);

  const distPath = path.join(baseDir, 'dist', 'app.js');
  t.ok(fs.existsSync(distPath), 'dist/app.js exists after build');
  const contents = fs.readFileSync(distPath, 'utf8');
  t.ok(/\/\/ @version\s+/.test(contents), 'dist/app.js contains a version field');
  t.ok(contents.length > 200, 'dist/app.js is not empty');
  t.end();
});

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// formatLine option combinations
// ---------------------------------------------------------------------------

tap.test('formatLineOptions', (t) => {
  const base = {
    fileType: 'text',
    semanticType: 'text',
    dateText: '2026-01-01 10:00',
    sender: 'Alice',
    content: 'Hello',
    contentLength: '5 chars',
  };

  const withBoth = formatLine(base, { includeContent: true, includeLength: true });
  t.ok(withBoth.includes('5 chars'), 'includes length when includeLength: true');
  t.ok(withBoth.includes('Hello'), 'includes content when includeContent: true');

  const noContent = formatLine(base, { includeContent: false, includeLength: true });
  t.notOk(noContent.includes('Hello'), 'omits content when includeContent: false');
  t.ok(noContent.includes('5 chars'), 'shows length when includeContent: false');

  const noLength = formatLine(base, { includeContent: true, includeLength: false });
  t.notOk(noLength.includes('5 chars'), 'omits length when includeLength: false');
  t.ok(noLength.includes('Hello'), 'shows content when includeLength: false');

  const neither = formatLine(base, { includeContent: false, includeLength: false });
  t.notOk(neither.includes('Hello'), 'omits content when neither option set');
  t.notOk(neither.includes('5 chars'), 'omits length when neither option set');

  t.end();
});

// ---------------------------------------------------------------------------
// buildSummary edge cases
// ---------------------------------------------------------------------------

tap.test('buildSummaryEdgeCases', (t) => {
  const empty = buildSummary([], { useMessageLabel: true });
  t.equal(typeof empty, 'string', 'buildSummary with empty array returns string');

  const singleMsg = buildSummary(
    [{ sender: 'Alice', date: new Date('2026-01-01'), type: 'text', isCall: false, isImage: false, callMinutes: 0, ts: Date.now() }],
    { useMessageLabel: true }
  );
  t.ok(singleMsg.includes('Alice'), 'single-participant summary includes sender name');

  const multiImageSummary = buildSummary(
    [
      { sender: 'Alice', date: new Date('2026-01-01'), type: 'image', isCall: false, isImage: true, imageCount: 4, ts: Date.now() },
    ],
    { useMessageLabel: true }
  );
  t.ok(multiImageSummary.includes('~ 4 images'), 'summary counts multiple images from one entry');
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

// ---------------------------------------------------------------------------
// textMessageDoesNotBecomeVoiceMessage
// ---------------------------------------------------------------------------

tap.test('textMessageDoesNotBecomeVoiceMessage', (t) => {
  const meta = getContentMeta({
    fileName: '',
    ariaLabel: 'At 3:30 PM, John: Hello how are you doing today',
    message: 'Hello how are you doing today',
    timerText: '',
  });
  t.equal(meta.type, 'text', 'text message with no timer not be classified as voice-message');
  t.end();
});

tap.test('reactionAsciiSmileyPreservesContent', (t) => {
  const meta = getContentMeta({
    fileName: '',
    ariaLabel: 'At 3:30 PM, John: :)',
    message: ':)',
    timerText: '',
  });
  t.equal(meta.type, 'reaction', 'pure smiley text should be classified as reaction');
  t.equal(meta.text, ':)', 'ascii smiley content should be preserved for reaction text');
  t.equal(meta.contentLength, '2 chars', 'smiley content length should count as 2 chars');
  t.end();
});

// ---------------------------------------------------------------------------
// chooseRuleAllEntries
// ---------------------------------------------------------------------------

tap.test('chooseRuleAllEntries', (t) => {
  const cases = [
    { file: 'deleted.html', label: '', expected: 'unsent' },
    { file: 'missed-audio-call.html', label: '', expected: 'missed-call' },
    { file: 'missed-video-call.html', label: '', expected: 'missed-call' },
    { file: 'audio-call.html', label: '', expected: 'audio-call' },
    { file: 'image.html', label: '', expected: 'image' },
    { file: 'link-embed-no-text.html', label: '', expected: 'link' },
    { file: 'link-text.html', label: '', expected: 'link' },
    { file: 'text-image-replied.html', label: '', expected: 'text' },
    { file: 'text-replied.html', label: '', expected: 'text' },
    { file: 'video-call.html', label: '', expected: 'video-call' },
    { file: 'voice-note.html', label: '', expected: 'voice-note' },
    { file: 'sticker.html', label: '', expected: 'sticker' },
    { file: 'animated-gif.html', label: '', expected: 'gif' },
    { file: 'poll.html', label: '', expected: 'poll' },
    { file: 'reaction.html', label: '', expected: 'reaction' },
    { file: 'reaction-emoji.html', label: '', expected: 'reaction' },
    { file: 'video-link.html', label: '', expected: 'video-link' },
    { file: 'text.html', label: '', expected: 'text' },
    { file: '', label: 'Missed audio call', expected: 'missed-call' },
    { file: '', label: 'Missed video call', expected: 'missed-call' },
    { file: '', label: 'audio call 5 mins', expected: 'audio-call' },
    { file: '', label: 'image sent', expected: 'image' },
    { file: '', label: 'open attachment', expected: 'link' },
    { file: '', label: 'voice message 1:05', expected: 'voice-note' },
    { file: '', label: 'voice note', expected: 'voice-note' },
    { file: '', label: 'sticker', expected: 'sticker' },
    { file: '', label: 'This is a gif', expected: 'gif' },
    { file: '', label: '👍', expected: 'reaction' },
    { file: '', label: 'At 11:16 AM, You: 🥳', expected: 'reaction' },
    { file: '', label: 'At 11:57 AM, You: https://youtube.com/shorts/IKS2vNOcZ7A', expected: 'video-link' },
    { file: '', label: 'Hello how are you', expected: 'text' },
  ];

  cases.forEach(({ file, label, expected }) => {
    const rule = chooseRule(file, label);
    t.equal(
      rule && rule.type === 'you-text' ? 'text' : rule && rule.type,
      expected,
      `chooseRule(${JSON.stringify(file)}, ${JSON.stringify(label)}) → ${expected}`
    );
  });
  t.end();
});

// ---------------------------------------------------------------------------
// formatExportHeaderAllTypes
// ---------------------------------------------------------------------------

tap.test('formatExportHeaderAllTypes', (t) => {
  const allTypes = [
    'audio-call', 'deleted', 'gif', 'image', 'link-embed-no-text', 'link-text',
    'missed-audio-call', 'missed-video-call', 'poll', 'reaction',
    'sticker', 'text', 'text-image-replied', 'text-replied', 'video-call', 'voice-note',
  ];
  const header = formatExportHeader({ method: 'server', messageTypes: allTypes });
  t.equal(header.split('\n')[0], 'Method: server', 'header starts with method line');
  t.equal(header.split('\n')[1], 'Message types:', 'second line is message types label');
  allTypes.forEach((type) => {
    t.ok(header.includes(`- ${type}`), `header includes type: ${type}`);
  });
  const sep = header.split('\n').find((l) => l === '---');
  t.ok(sep, 'header includes --- separator');
  t.end();
});

// ---------------------------------------------------------------------------
// formatExportFileNameDateRange
// ---------------------------------------------------------------------------

tap.test('formatExportFileNameDateRange', (t) => {
  t.equal(
    formatExportFileName('export-max', { fromDate: '2026-05-01', toDate: '2026-05-19' }),
    'export-2026-05-01\u20132026-05-19-max.txt',
    'export-max with date range'
  );
  t.equal(
    formatExportFileName('export-minimal', { fromDate: '2026-05-01', toDate: '2026-05-19' }),
    'export-2026-05-01\u20132026-05-19-minimal.txt',
    'export-minimal with date range'
  );
  t.equal(
    formatExportFileName('export-max'),
    'export-max.txt',
    'no date range falls back to fixed name'
  );
  t.equal(
    formatExportFileName('export-minimal'),
    'export-minimal.txt',
    'export-minimal no date range falls back to fixed name'
  );
  t.end();
});

// ---------------------------------------------------------------------------
// parseLocalDate — async (ESM dynamic import)
// ---------------------------------------------------------------------------

tap.test('parseLocalDate', (t) => {
  // frontend-utils.mjs is ESM — run assertions in a subprocess to avoid
  // require(esm) cycle issues with tap's ts-node loader.
  const script = `
import { parseLocalDate } from './src/shared/frontend-utils.mjs';
const results = [];
const check = (label, actual, expected) => results.push({ label, ok: actual === expected, actual, expected });
const d1 = parseLocalDate('2026-05-18');
check('YYYY-MM-DD year', d1.getFullYear(), 2026);
check('YYYY-MM-DD month (0-based)', d1.getMonth(), 4);
check('YYYY-MM-DD day', d1.getDate(), 18);
const d2 = parseLocalDate('2026/05/18');
check('YYYY/MM/DD year', d2.getFullYear(), 2026);
const d3 = parseLocalDate('18.05.2026');
check('DD.MM.YYYY year', d3.getFullYear(), 2026);
check('DD.MM.YYYY month', d3.getMonth(), 4);
check('DD.MM.YYYY day', d3.getDate(), 18);
const d4 = parseLocalDate('18/05/2026');
check('DD/MM/YYYY year', d4.getFullYear(), 2026);
const bad = parseLocalDate('not-a-date');
results.push({ label: 'invalid returns NaN', ok: isNaN(bad), actual: bad, expected: NaN });
process.stdout.write(JSON.stringify(results));
`;
  const result = childProcess.spawnSync(
    'node',
    ['--input-type=module'],
    { input: script, cwd: path.join(__dirname, '..'), encoding: 'utf8' }
  );
  t.equal(result.status, 0, `parseLocalDate subprocess failed: ${result.stderr}`);
  if (result.status === 0) {
    const assertions = JSON.parse(result.stdout);
    assertions.forEach(({ label, ok }) => t.ok(ok, label));
  }
  t.end();
});
