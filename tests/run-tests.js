const tap = require('tap');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { compareSnapshots } = require('./snapshot-helper');

const { normalizeDateToSimple, parseAriaLabel } = require(
  path.join(__dirname, '..', 'src', 'shared', 'aria-label-parser')
);
const childProcess = require('child_process');
const { getContentMeta, normalizeDuration } = require(
  path.join(__dirname, '..', 'src', 'shared', 'message-metadata')
);
const { formatExportHeader, formatLine } = require(
  path.join(__dirname, '..', 'src', 'shared', 'export-formatter')
);
const { buildSummary } = require(
  path.join(__dirname, '..', 'src', 'shared', 'export-summary')
);
const { buildEntriesFromDocument } = require(
  path.join(__dirname, '..', 'src', 'shared', 'export-text')
);
const { createOptimizedHtml } = require(
  path.join(__dirname, '..', 'src', 'shared', 'optimize-html')
);
const { buildAllMessageMetaMap, parseMessageNodes } = require(
  path.join(__dirname, '..', 'src', 'shared', 'create-nodes')
);
const { anonymizeChatNames } = require(path.join(__dirname, '..', 'src', 'shared', 'utils'));

const rawDir = path.join(__dirname, '..', 'demo/input-html-raw');

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
  t.equal(normalizeDuration('0:20'), '0:20 mins');
  t.equal(normalizeDuration('1:23:45'), '1:23:45 mins');
  t.equal(normalizeDuration('31 mins'), '31:00 mins');
  t.equal(normalizeDuration('45 sec'), '0:45 mins');
  t.equal(normalizeDuration('2 min'), '2:00 mins');
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
  t.equal(voiceMeta.type, 'voice-message');
  t.equal(voiceMeta.text, 'voice message');
  t.equal(voiceMeta.contentLength, undefined);
  t.equal(voiceMeta.duration, '1:05 mins');

  const shortVoiceMeta = getContentMeta({
    fileName: 'voice-test.html',
    ariaLabel: 'At today at 12:00, You: Voice message',
    message: 'voice message',
    timerText: '0:20 mins',
  });
  t.equal(shortVoiceMeta.type, 'voice-message');
  t.equal(shortVoiceMeta.text, 'voice message');
  t.equal(shortVoiceMeta.contentLength, undefined);
  t.equal(shortVoiceMeta.duration, '0:20 mins');

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
    'Pinned location link content should be mapped to a Google Maps URL'
  );
  t.ok(
    /^https:\/\/www\.google\.com\/maps\/search\//.test(pinnedLocationMeta.link),
    'Pinned location link field should be mapped to a Google Maps URL'
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
  t.equal(videoMeta.duration, '31:00 mins');

  t.end();
});

// ---------------------------------------------------------------------------
// browserExportFormatting
// ---------------------------------------------------------------------------

tap.test('browserExportFormatting', (t) => {
  const header = formatExportHeader({ method: 'browser', messageTypes: ['text', 'image'] });
  t.ok(header.includes('Method: browser'), 'Browser header should include method browser');
  t.ok(header.includes('- text'), 'Browser header should list text message type');
  t.ok(header.includes('- image'), 'Browser header should list image message type');

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
    '[2026-05-17 11:00] Alpha: text 0:20 mins 5 / Hello\n',
    'Browser line formatting should include type, duration, length, and content'
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
  t.ok(summary.includes('Total Summary'), 'Summary output should include Total Summary title');
  t.ok(
    summary.includes('1 message / 1 day'),
    'Summary output should use message/day labels with useMessageLabel'
  );
  t.ok(summary.includes('Alpha Summary'), 'Summary output should include Alpha Summary');
  t.ok(summary.includes('Youghurt Summary'), 'Summary output should include Youghurt Summary');

  t.end();
});

// ---------------------------------------------------------------------------
// browserExportDomRegression
// ---------------------------------------------------------------------------

tap.test('browserExportDomRegression', (t) => {
  const dom = new JSDOM(`
    <div aria-roledescription="message" aria-label="At April 17, 2026, 3:45 PM, You: Hello world">Hello world</div>
  `);
  const entries = buildEntriesFromDocument(dom.window.document, 'text.html');
  t.equal(entries.length, 1, 'Should parse one message entry');

  const entry = entries[0];
  t.equal(entry.sender, 'Youghurt', 'Self-sender should be normalized to Youghurt');
  t.equal(entry.semanticType, 'text', 'Message type should resolve to text');
  t.equal(entry.dateText, '2026-04-17 15:45', 'Date text should be normalized to ISO-friendly format');
  t.equal(entry.content, 'Hello world', 'Text content should be preserved');

  const formattedLine = formatLine(entry, { includeContent: true, includeLength: true });
  t.equal(
    formattedLine,
    '[2026-04-17 15:45] Youghurt: text 11 chars / Hello world\n',
    'Formatted browser line should include duration, length, and content'
  );

  t.end();
});

// ---------------------------------------------------------------------------
// generatedPreviewSchema
// ---------------------------------------------------------------------------

function validatePreviewNode(t, node, fileName) {
  t.equal(typeof node.title, 'string', `${fileName}: title must be string`);
  t.ok(node.timestamp, `${fileName}: timestamp is required`);
  t.ok(node.locate && typeof node.locate === 'object', `${fileName}: locate is required`);
  t.equal(typeof node.locate.message, 'string');
  t.equal(typeof node.locate.label, 'string');
  t.equal(typeof node.locate.textContent, 'string');
  const preview = node.data_preview;
  t.ok(preview && typeof preview === 'object', `${fileName}: data_preview is required`);
  t.equal(typeof preview.content_type, 'string');
  t.ok('content' in preview, `${fileName}: content is required`);
  t.ok(typeof preview.content === 'string');
  if (preview.raw_meta) {
    t.equal(typeof preview.raw_meta, 'object');
    if (preview.raw_meta.duration) t.equal(typeof preview.raw_meta.duration, 'string');
    if (preview.raw_meta.link) t.equal(typeof preview.raw_meta.link, 'string');
  }
  if (['voice-message', 'video-call', 'audio-call'].includes(preview.content_type)) {
    if (preview.duration !== undefined) {
      t.equal(
        preview.content_length,
        undefined,
        `${fileName}: timed preview with duration should omit content_length`
      );
    }
    if (preview.raw_meta) {
      t.equal(
        typeof preview.raw_meta.duration,
        'string',
        `${fileName}: timed preview must include raw_meta.duration`
      );
    }
  }
  if (preview.content_type === 'link') {
    const hasTextRichLink =
      typeof preview.content === 'string' &&
      /^https?:\/\//i.test(preview.content) &&
      /\s+\S+/.test(preview.content.replace(/^https?:\/\/\S+\s*/, ''));
    if (hasTextRichLink) {
      t.ok(
        /^\d+ chars$/.test(preview.content_length),
        `${fileName}: text-rich link preview should include content_length`
      );
    } else {
      t.equal(
        preview.content_length,
        undefined,
        `${fileName}: non-text link preview should not include content_length`
      );
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
  t.equal(voiceNode.data_preview.content_type, 'voice-message');
  t.equal(voiceNode.data_preview.duration, '0:20 mins');
  t.equal(voiceNode.data_preview.raw_meta.duration, '0:20', 'voice-note raw_meta.duration should keep raw input value');
  t.equal(voiceNode.data_preview.content_length, undefined);

  const videoNode = parseMessageNodes(
    createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'video-call.html'), 'utf8')),
    'video-call.html',
    '2026.05.15 00:00',
    metaMap
  )[0];
  t.equal(videoNode.data_preview.content_type, 'video-call');
  t.equal(videoNode.data_preview.duration, '31:00 mins');
  t.equal(videoNode.data_preview.raw_meta.duration, '31 mins', 'video-call raw_meta.duration should keep raw input value');
  t.equal(videoNode.data_preview.content_length, undefined);

  const embeddedLinkNode = parseMessageNodes(
    createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'link-embed-no-text.html'), 'utf8')),
    'link-embed-no-text.html',
    '2026.05.15 00:00',
    metaMap
  )[0];
  t.equal(embeddedLinkNode.data_preview.content_type, 'link');
  t.equal(embeddedLinkNode.data_preview.content_length, undefined);

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
  t.equal(result.type, 'link', 'link-text files should be classified as link when raw meta link is present');
  t.ok(result.text.startsWith('https://www.scan.co.uk/'), 'link-text content should be prepended with the URL');
  t.ok(result.text.includes('image sent'), 'link-text content should keep message text after the URL');
  t.ok(/\d+ chars$/.test(result.contentLength), 'link-text previews with text should include content_length');
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
  t.equal(result.duration, null, 'missed calls should not include duration');
  t.equal(result.contentLength, undefined, 'missed-call previews should not include content_length');
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
  t.equal(nodes.length, 1, 'text.html should produce one node');
  t.equal(nodes[0].data_preview.content_type, 'text', 'text.html should be classified as text');
  t.not(nodes[0].data_preview.content, 'link', 'text.html content should not be reduced to link');
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
  t.equal(nodes.length, 1, 'image.html should produce one node');
  t.equal(nodes[0].data_preview.content_type, 'image', 'image.html should be classified as image');
  t.equal(nodes[0].data_preview.content, 'image sent', 'image message preview should use image sent content');
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
      `${fileName}: optimized HTML should not contain empty tags`
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
    'Link text message should preserve leading conversational token in message content'
  );
  t.end();
});

tap.test('parseAriaLabelSenderSplits', (t) => {
  const audioParsed = parseAriaLabel('At April 12, 2026, 1:23 PM, You');
  t.equal(audioParsed.sender, 'You');
  t.ok(audioParsed.date.includes('April 12, 2026'), 'Audio call date should stay intact');

  const textParsed = parseAriaLabel('At 12:26 AM, Alpha Do you have that photo and a link?');
  t.equal(textParsed.sender, 'Alpha');
  t.equal(textParsed.message, 'Do you have that photo and a link?');
  t.end();
});

// ---------------------------------------------------------------------------
// anonymizeChatNames
// ---------------------------------------------------------------------------

tap.test('anonymizeChatNames', (t) => {
  const rawHtml =
    '<title>Rob</title><div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"><img alt="Rob Leon"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div>Message body mentioning Rob should be anonymized.</div>';
  const cleaned = anonymizeChatNames(rawHtml);
  t.ok(cleaned.includes('aria-label="At Wednesday 7:54pm, Alpha"'), 'Sender aria-label should be anonymized');
  t.ok(cleaned.includes('aria-label="Enter, Message sent Wednesday 7:54pm by Alpha"'), 'Enter message sender should be anonymized');
  t.ok(cleaned.includes('<img alt="Alpha Leon"'), 'Profile alt text sender word should be anonymized');
  t.notOk(cleaned.includes('Rob deleted a message'), 'Message content should be anonymized');
  t.notOk(cleaned.includes('Message body mentioning Rob should be anonymized.'), 'Message body text references should be anonymized');
  t.ok(cleaned.includes('<title>Alpha</title>'), 'Chat title should be anonymized');
  t.end();
});

tap.test('anonymizeChatNamesPreservesYou', (t) => {
  const rawHtml =
    '<div aria-label="At Thursday 5:34pm, You" aria-roledescription="message"></div><div aria-label="Enter, Message sent Thursday 5:34pm by You"></div>';
  const cleaned = anonymizeChatNames(rawHtml);
  t.ok(cleaned.includes('aria-label="At Thursday 5:34pm, You"'), 'Self-label You should remain unchanged');
  t.ok(cleaned.includes('aria-label="Enter, Message sent Thursday 5:34pm by You"'), 'Self-label by You should remain unchanged');
  t.end();
});

tap.test('anonymizeChatNamesOnlyReplacesShortSenderNames', (t) => {
  const rawHtml =
    '<div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div>All of this is a long phrase that is not a sender name</div>';
  const cleaned = anonymizeChatNames(rawHtml);
  t.ok(cleaned.includes('Alpha deleted a message'), 'Valid short sender name should be anonymized');
  t.ok(cleaned.includes('All of this is a long phrase that is not a sender name'), 'Long non-name phrases should not be anonymized');
  t.end();
});

tap.test('anonymizeChatNamesPreservesRawDateText', (t) => {
  const rawHtml =
    '<title>Rob</title><div aria-label="At May 15, 2026, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent May 15, 2026 by Rob"></div>';
  const cleaned = anonymizeChatNames(rawHtml);
  t.ok(cleaned.includes('May 15, 2026'), 'Raw date text should remain unchanged');
  t.ok(
    cleaned.includes('Alpha deleted a message') || cleaned.includes('Alpha'),
    'Confirmed sender name should be anonymized'
  );
  t.end();
});

tap.test('anonymizeChatNamesIgnoresNamesWithNumbers', (t) => {
  const rawHtml =
    '<div aria-label="At Thursday 5:34pm, Alice 2024" aria-roledescription="message"></div><div>Alice 2024 deleted a message</div>';
  const cleaned = anonymizeChatNames(rawHtml);
  t.ok(cleaned.includes('Alice 2024'), 'Numeric names should not be anonymized');
  t.notOk(cleaned.includes('Alpha 2024'), 'Numeric names should not be replaced with Alpha');
  t.end();
});

// ---------------------------------------------------------------------------
// frontendBuildDist
// ---------------------------------------------------------------------------

tap.test('frontendBuildDist', (t) => {
  const baseDir = path.join(__dirname, '..');
  const buildResult = childProcess.spawnSync('node', ['src/frontend/build.js'], {
    cwd: baseDir,
    encoding: 'utf8',
  });
  t.equal(buildResult.status, 0, `build.js failed: ${buildResult.stderr || buildResult.stdout}`);

  const distPath = path.join(baseDir, 'dist', 'app.js');
  t.ok(fs.existsSync(distPath), 'dist/app.js should exist after build');
  const contents = fs.readFileSync(distPath, 'utf8');
  t.ok(/\/\/ @version\s+/.test(contents), 'dist/app.js should contain a version field');
  t.ok(contents.length > 200, 'dist/app.js should not be empty');
  t.notOk(/contentMeta\./.test(contents), 'dist/app.js should not contain stale contentMeta references');
  t.end();
});

// ---------------------------------------------------------------------------
// goldenTxtSnapshots
// ---------------------------------------------------------------------------

tap.test('goldenTxtSnapshots', (t) => {
  const baseDir = path.join(__dirname, '..');
  const actualOnPath = path.join(baseDir, 'demo/output-txt', 'fb-chats-export-content-on.txt');
  const actualOffPath = path.join(baseDir, 'demo/output-txt', 'fb-chats-export-content-off.txt');
  const goldenOnPath = path.join(baseDir, 'tests', 'golden', 'fb-chats-export-content-on.txt');
  const goldenOffPath = path.join(baseDir, 'tests', 'golden', 'fb-chats-export-content-off.txt');

  t.ok(fs.existsSync(actualOnPath), 'Content-on TXT export missing for golden snapshot test');
  t.ok(fs.existsSync(actualOffPath), 'Content-off TXT export missing for golden snapshot test');
  t.ok(fs.existsSync(goldenOnPath), 'Golden snapshot for content-on TXT missing');
  t.ok(fs.existsSync(goldenOffPath), 'Golden snapshot for content-off TXT missing');

  compareSnapshots(actualOnPath, goldenOnPath, 'Content-on TXT export differs from golden snapshot');
  compareSnapshots(actualOffPath, goldenOffPath, 'Content-off TXT export differs from golden snapshot');
  t.end();
});

// ---------------------------------------------------------------------------
// buildServerTextExport
// ---------------------------------------------------------------------------

tap.test('buildServerTextExport', (t) => {
  const serverBuild = childProcess.spawnSync('node', ['src/build-server.js'], {
    encoding: 'utf8',
    cwd: path.join(__dirname, '..'),
  });
  t.equal(serverBuild.status, 0, `build-server failed: ${serverBuild.stderr || serverBuild.stdout}`);

  const txtDir = path.join(__dirname, '..', 'demo/output-txt');
  t.ok(fs.existsSync(txtDir), 'demo/output-txt not created');
  const files = fs.readdirSync(txtDir);
  const sortedTxtFiles = files.filter((name) => name.endsWith('.txt')).sort();
  t.strictSame(
    sortedTxtFiles,
    [
      'fb-chats-export-content-off.txt',
      'fb-chats-export-content-on.txt',
      'fb-chats-export-summary.txt',
    ],
    'Expected three stable TXT export filenames'
  );

  const summaryTxtPath = path.join(txtDir, 'fb-chats-export-summary.txt');
  t.ok(fs.existsSync(summaryTxtPath), 'Expected fb-chats-export-summary.txt to be generated');
  t.notOk(fs.existsSync(path.join(txtDir, 'fb-chats-export-summary.json')), 'Summary JSON export should not be generated');

  const contentOn = fs.readFileSync(path.join(txtDir, 'fb-chats-export-content-on.txt'), 'utf8');
  const contentOff = fs.readFileSync(path.join(txtDir, 'fb-chats-export-content-off.txt'), 'utf8');
  const summaryTxt = fs.readFileSync(summaryTxtPath, 'utf8');

  t.ok(/\n\d+\s+posts\s*\/\s*\d+\s+days\n/.test(summaryTxt), 'Summary TXT should use posts for total summary');
  t.ok(/\nAlpha Summary\n\d+\s+post(?:s)?\s*\/\s*\d+\s+days\n/.test(summaryTxt), 'Summary TXT should use post/posts for Alpha Summary');
  t.ok(/\nYoughurt Summary\n\d+\s+post(?:s)?\s*\/\s*\d+\s+days\n/.test(summaryTxt), 'Summary TXT should use post/posts for Youghurt Summary');

  const uniqueDays = new Set(
    contentOn
      .split(/\r?\n/)
      .filter((line) => /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/.test(line))
      .map((line) => line.slice(1, 11))
  ).size;
  t.ok(summaryTxt.includes(` / ${uniqueDays} days`), 'Summary TXT total days must reflect unique days across all messages');

  t.ok(contentOn.includes('Method: server'), 'Content-on export should include the server method header');
  t.ok(contentOff.includes('Method: server'), 'Content-off export should include the server method header');
  t.ok(contentOn.includes('Message types:'), 'Content-on export should include a message types header');
  t.ok(contentOff.includes('Message types:'), 'Content-off export should include a message types header');
  t.ok(contentOn.includes('\n---\n'), 'Content-on export summary should end with ---');
  t.ok(contentOff.includes('\n---\n'), 'Content-off export summary should end with ---');
  t.ok(contentOn.includes('\nTotal Summary\n'), 'Content-on export should include a Total Summary block');
  t.ok(/\n\d+\s+(?:message|messages)\s*\/\s*\d+\s+(?:day|days)\n/.test(contentOn), 'Content-on summary should include a total count line');
  t.ok(/\n~\s+\d+\s+text;\n/.test(contentOn), 'Content-on summary should include rough text totals');
  t.ok(/\n~\s+\d+\s+images\n/.test(contentOn), 'Content-on summary should include rough image totals');
  t.ok(/\n~\s+\d+\s+calls\s+\d+\s+mins\n/.test(contentOn), 'Content-on summary should include rough call totals');
  t.ok(/\nAlpha Summary\n/.test(contentOn), 'Content-on summary should include Alpha Summary section');
  t.ok(/\nYoughurt Summary\n/.test(contentOn), 'Content-on summary should include Youghurt Summary section');
  t.ok(
    /\nAlpha Summary\n\d+\s+(?:message|messages)\s*\/\s*\d+\s+(?:day|days)\n~\s+\d+\s+text;\n~\s+\d+\s+images\n~\s+\d+\s+calls\s+\d+\s+mins\n/.test(contentOn),
    'Alpha Summary should mirror total summary list style'
  );
  t.ok(
    /\nYoughurt Summary\n\d+\s+(?:message|messages)\s*\/\s*\d+\s+(?:day|days)\n~\s+\d+\s+text;\n~\s+\d+\s+images\n~\s+\d+\s+calls\s+\d+\s+mins\n/.test(contentOn),
    'Youghurt Summary should mirror total summary list style'
  );

  const rawFiles = fs.readdirSync(rawDir).filter((name) => name.endsWith('.html'));
  rawFiles.forEach((fileName) => {
    const sample = path.parse(fileName).name;
    t.ok(contentOn.includes(`- ${sample}`), `Content-on header should list ${fileName} as dashed item`);
    t.ok(contentOff.includes(`- ${sample}`), `Content-off header should list ${fileName} as dashed item`);
  });

  const bodyStartOn = contentOn.lastIndexOf('\n---\n');
  const bodyAfterSummary = bodyStartOn > -1 ? contentOn.slice(bodyStartOn + '\n---\n'.length) : contentOn;
  const bodyLinesOn = bodyAfterSummary
    .split(/\r?\n/)
    .filter((line) => /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]/.test(line));
  const bodyLinesOff = contentOff
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(3 + rawFiles.length);

  t.equal(bodyLinesOn.length, rawFiles.length, 'Content-on export should contain one message per raw file');
  t.equal(bodyLinesOff.length, rawFiles.length, 'Content-off export should contain one message per raw file');

  const allMessageDayCount = new Set(
    bodyLinesOn
      .map((line) => {
        const m = line.match(/^\[(\d{4}-\d{2}-\d{2})\s\d{2}:\d{2}\]/);
        return m ? m[1] : null;
      })
      .filter(Boolean)
  ).size;

  t.ok(summaryTxt.includes('Total Summary'), 'Summary TXT should include Total Summary title');
  t.ok(summaryTxt.includes('---'), 'Summary TXT should include closing separator');
  t.ok(summaryTxt.includes(` / ${allMessageDayCount} `), 'Summary TXT should include total day count');

  const basePattern = /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]\s[^:]+:\s[^/]+(?:\s\/\s.*)?$/;
  t.ok(bodyLinesOn.every((line) => basePattern.test(line)), 'Each content-on line should match expected format');
  t.ok(bodyLinesOff.every((line) => basePattern.test(line)), 'Each content-off line should match expected format');

  rawFiles.forEach((fileName) => {
    const typeName = path.parse(fileName).name;
    t.ok(bodyLinesOn.some((line) => line.includes(` ${typeName}`)), `Content-on body should include one line for ${typeName}`);
    t.ok(bodyLinesOff.some((line) => line.includes(` ${typeName}`)), `Content-off body should include one line for ${typeName}`);
  });

  t.ok(bodyLinesOn.some((line) => line.includes('video-call 31:00 mins')), 'Video call lines should include duration in canonical format');
  t.ok(bodyLinesOn.some((line) => /\blink-text\b(?:\s+\d+ chars)?\s*\/\s*https?:\/\//i.test(line)), 'link-text line should include URL content in content-on export');
  t.ok(bodyLinesOn.some((line) => /\blink-embed-no-text\b\s*\/\s*https?:\/\//i.test(line)), 'link-embed-no-text line should include URL content in content-on export');
  t.ok(bodyLinesOn.some((line) => /\blink-text\b\s+\d+ chars\s*\/\s*https?:\/\//i.test(line)), 'link-text lines with text should include content length');
  t.ok(bodyLinesOff.every((line) => !line.includes(' / ')), 'Content-off export should not include slash-delimited content');

  const offTextLengthLine = bodyLinesOff.find((line) => /\btext\b\s+\d+ chars(?:\s|$)/i.test(line));
  t.ok(offTextLengthLine, 'Content-off export should include text content length when content is disabled');

  bodyLinesOn.forEach((line, idx) => {
    t.notOk(/[\r\n]/.test(line), `Content-on line ${idx + 1} should be single-line text`);
  });
  bodyLinesOff.forEach((line, idx) => {
    t.notOk(/[\r\n]/.test(line), `Content-off line ${idx + 1} should be single-line text`);
  });

  t.ok(contentOn.includes('Alpha'), 'Content-on export should contain anonymized sender names');
  t.ok(contentOff.includes('Alpha'), 'Content-off export should contain anonymized sender names');
  t.notOk(contentOn.includes('Rob'), 'Content-on export should not contain raw sender names');
  t.notOk(contentOff.includes('Rob'), 'Content-off export should not contain raw sender names');

  t.end();
});

// ---------------------------------------------------------------------------
// textExportDurationNormalization
// ---------------------------------------------------------------------------

tap.test('textExportDurationNormalization', (t) => {
  const txtDir = path.join(__dirname, '..', 'demo/output-txt');
  const contentOnPath = path.join(txtDir, 'fb-chats-export-content-on.txt');
  const contentOffPath = path.join(txtDir, 'fb-chats-export-content-off.txt');

  t.ok(fs.existsSync(contentOnPath), 'Content-on TXT export should exist');
  t.ok(fs.existsSync(contentOffPath), 'Content-off TXT export should exist');

  const contentOn = fs.readFileSync(contentOnPath, 'utf8');
  const contentOff = fs.readFileSync(contentOffPath, 'utf8');

  const bodyStartOn = contentOn.indexOf('\n---\n');
  const bodyStartOff = contentOff.indexOf('\n---\n');

  t.ok(bodyStartOn > -1, 'Content-on should have --- separator');
  t.ok(bodyStartOff > -1, 'Content-off should have --- separator');

  const bodyLinesOn = contentOn.substring(bodyStartOn).split(/\r?\n/).filter((line) => /^\[\d{4}-\d{2}-\d{2}/.test(line));
  const bodyLinesOff = contentOff.substring(bodyStartOff).split(/\r?\n/).filter((line) => /^\[\d{4}-\d{2}-\d{2}/.test(line));

  bodyLinesOn.forEach((line, idx) => {
    const contentPart = line.substring(line.indexOf('] ') + 2);
    const durationMatches = contentPart.match(/(\d+:\d{2}(?::\d{2})?|\d+)\s+(?!chars)/);
    if (durationMatches && /\d+:\d{2}(?::\d{2})?/.test(durationMatches[0])) {
      t.ok(
        /\d+:\d{2}(?::\d{2})?\s+mins/.test(contentPart),
        `Line ${idx + 1} in content-on should have normalized duration: ${line}`
      );
    }
  });

  bodyLinesOff.forEach((line, idx) => {
    const contentPart = line.substring(line.indexOf('] ') + 2);
    const durationMatches = contentPart.match(/(\d+:\d{2}(?::\d{2})?|\d+)\s+(?!chars)/);
    if (durationMatches && /\d+:\d{2}(?::\d{2})?/.test(durationMatches[0])) {
      t.ok(
        /\d+:\d{2}(?::\d{2})?\s+mins/.test(contentPart),
        `Line ${idx + 1} in content-off should have normalized duration: ${line}`
      );
    }
  });

  t.end();
});

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
  t.end();
});

// ---------------------------------------------------------------------------
// parseLocalDate — async (ESM dynamic import)
// ---------------------------------------------------------------------------

tap.test('parseLocalDate', (t) => {
  // frontend-utils.js is ESM — run assertions in a subprocess to avoid
  // require(esm) cycle issues with tap's ts-node loader.
  const script = `
import { parseLocalDate } from './src/shared/frontend-utils.js';
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
