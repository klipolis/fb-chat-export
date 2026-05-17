const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const { normalizeDateToSimple, parseAriaLabel } = require(path.join(__dirname, '..', 'src', 'shared', 'aria-label-parser'));
const childProcess = require('child_process');
const { getContentMeta, normalizeDuration } = require(path.join(__dirname, '..', 'src', 'shared', 'message-metadata'));
const { formatExportHeader, formatLine } = require(path.join(__dirname, '..', 'src', 'shared', 'export-formatter'));
const { buildUserscriptSummary } = require(path.join(__dirname, '..', 'src', 'shared', 'userscript-summary'));
const { buildEntriesFromDocument } = require(path.join(__dirname, '..', 'src', 'shared', 'export-text'));
const { createOptimizedHtml } = require(path.join(__dirname, '..', 'src', 'shared', 'optimize-html'));
const { buildAllMessageMetaMap, parseMessageNodes } = require(path.join(__dirname, '..', 'src', 'shared', 'create-nodes'));
const { anonymizeChatNames } = require(path.join(__dirname, '..', 'src', 'shared', 'utils'));

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
  assert.strictEqual(normalizeDuration('1:23:45'), '1:23:45 mins');
  assert.strictEqual(normalizeDuration('31 mins'), '31:00 mins');
  assert.strictEqual(normalizeDuration('45 sec'), '0:45 mins');
  assert.strictEqual(normalizeDuration('2 min'), '2:00 mins');
  assert.strictEqual(normalizeDuration('1:23 PM'), null);
}

function testGetContentMeta() {
  const linkMeta = getContentMeta({
    fileName: 'link-test.html',
    ariaLabel: 'At today at 12:00, You: Visit https://example.com',
    message: 'Visit https://example.com',
    hasLink: true
  });

  assert.strictEqual(linkMeta.type, 'link');
  assert.strictEqual(linkMeta.text, 'https://example.com');
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
  assert.strictEqual(embeddedLinkMeta.text, 'https://facebook.com');
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
  assert.strictEqual(redirectLinkMeta.text, 'https://example.com');
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

  const pinnedLocationMeta = getContentMeta({
    fileName: 'link-embed-no-text.html',
    ariaLabel: 'At Friday 1:51pm, Alpha',
    message: 'Pinned Location Hall Mead Nursery, Nazeing Road Waltham Abbey England EN9 2EU United Kingdom',
    hasLink: true
  });
  assert.strictEqual(pinnedLocationMeta.type, 'link');
  assert.ok(/^https:\/\/www\.google\.com\/maps\/search\//.test(pinnedLocationMeta.text), 'Pinned location link content should be mapped to a Google Maps URL');
  assert.ok(/^https:\/\/www\.google\.com\/maps\/search\//.test(pinnedLocationMeta.link), 'Pinned location link field should be mapped to a Google Maps URL');
  assert.strictEqual(pinnedLocationMeta.contentLength, undefined);

  const videoMeta = getContentMeta({
    fileName: 'video-call.html',
    ariaLabel: 'At today at 11:14, You',
    message: 'video call',
    timerText: '31 mins'
  });

  assert.strictEqual(videoMeta.type, 'video-call');
  assert.strictEqual(videoMeta.text, 'video call');
  assert.strictEqual(videoMeta.contentLength, undefined);
  assert.strictEqual(videoMeta.duration, '31:00 mins');
}

function testBrowserExportFormatting() {
  const header = formatExportHeader({ method: 'browser', messageTypes: ['text', 'image'] });
  assert.ok(header.includes('Method: browser'), 'Browser header should include method browser');
  assert.ok(header.includes('- text'), 'Browser header should list text message type');
  assert.ok(header.includes('- image'), 'Browser header should list image message type');

  const formattedLine = formatLine({
    fileType: 'text',
    semanticType: 'text',
    dateText: '2026-05-17 11:00',
    sender: 'Alpha',
    duration: '0:20 mins',
    content: 'Hello',
    contentLength: 5
  }, { includeContent: true, includeLength: true });

  assert.strictEqual(formattedLine, '[2026-05-17 11:00] Alpha: text 0:20 mins 5 / Hello\n', 'Browser line formatting should include type, duration, length, and content');

  const summary = buildUserscriptSummary([
    { sender: 'Alpha', date: new Date('2026-05-17T11:00:00Z'), type: 'text', isCall: false, isImage: false, callMinutes: 0 },
    { sender: 'Youghurt', date: new Date('2026-05-17T11:05:00Z'), type: 'image', isCall: false, isImage: true, callMinutes: 0 }
  ], { useMessageLabel: true });

  assert.ok(summary.includes('Total Summary'), 'Summary output should include Total Summary title');
  assert.ok(summary.includes('1 message / 1 day'), 'Summary output should use message/day labels with useMessageLabel');
  assert.ok(summary.includes('Alpha Summary'), 'Summary output should include Alpha Summary');
  assert.ok(summary.includes('Youghurt Summary'), 'Summary output should include Youghurt Summary');
}

function testBrowserExportDomRegression() {
  const dom = new JSDOM(`
    <div aria-roledescription="message" aria-label="At April 17, 2026, 3:45 PM, You: Hello world">Hello world</div>
  `);
  const entries = buildEntriesFromDocument(dom.window.document, 'text.html');
  assert.strictEqual(entries.length, 1, 'Should parse one message entry');

  const entry = entries[0];
  assert.strictEqual(entry.sender, 'Youghurt', 'Self-sender should be normalized to Youghurt');
  assert.strictEqual(entry.semanticType, 'text', 'Message type should resolve to text');
  assert.strictEqual(entry.dateText, '2026-04-17 15:45', 'Date text should be normalized to ISO-friendly format');
  assert.strictEqual(entry.content, 'Hello world', 'Text content should be preserved');

  const formattedLine = formatLine(entry, { includeContent: true, includeLength: true });
  assert.strictEqual(formattedLine, '[2026-04-17 15:45] Youghurt: text 11 chars / Hello world\n', 'Formatted browser line should include duration, length, and content');
}

function testUserScriptBuildDist() {
  const baseDir = path.join(__dirname, '..');
  const buildResult = childProcess.spawnSync('node', ['src/frontend/build-frontend.js'], { cwd: baseDir, encoding: 'utf8' });
  assert.strictEqual(buildResult.status, 0, `build-frontend failed: ${buildResult.stderr || buildResult.stdout}`);

  const distPath = path.join(baseDir, 'dist', 'userscript.js');
  assert.ok(fs.existsSync(distPath), 'dist/userscript.js should exist after build');
  const contents = fs.readFileSync(distPath, 'utf8');
  assert.ok(/\/\/ ==UserScript==/.test(contents), 'dist/userscript.js should contain a userscript header');
  assert.ok(/\/\/ @version\s+/.test(contents), 'dist/userscript.js should contain a version field');
  assert.ok(contents.length > 200, 'dist/userscript.js should not be empty');
  assert.ok(!/contentMeta\./.test(contents), 'dist/userscript.js should not contain stale contentMeta references');
}

function testGoldenTxtSnapshots() {
  const baseDir = path.join(__dirname, '..');
  const actualOnPath = path.join(baseDir, 'Data-output-txt', 'fb-chats-export-content-on.txt');
  const actualOffPath = path.join(baseDir, 'Data-output-txt', 'fb-chats-export-content-off.txt');
  const goldenOnPath = path.join(baseDir, 'tests', 'golden', 'fb-chats-export-content-on.txt');
  const goldenOffPath = path.join(baseDir, 'tests', 'golden', 'fb-chats-export-content-off.txt');

  assert.ok(fs.existsSync(actualOnPath), 'Content-on TXT export missing for golden snapshot test');
  assert.ok(fs.existsSync(actualOffPath), 'Content-off TXT export missing for golden snapshot test');
  assert.ok(fs.existsSync(goldenOnPath), 'Golden snapshot for content-on TXT missing');
  assert.ok(fs.existsSync(goldenOffPath), 'Golden snapshot for content-off TXT missing');

  const actualOn = fs.readFileSync(actualOnPath, 'utf8');
  const actualOff = fs.readFileSync(actualOffPath, 'utf8');
  const goldenOn = fs.readFileSync(goldenOnPath, 'utf8');
  const goldenOff = fs.readFileSync(goldenOffPath, 'utf8');

  assert.strictEqual(actualOn, goldenOn, 'Content-on TXT export differs from golden snapshot');
  assert.strictEqual(actualOff, goldenOff, 'Content-off TXT export differs from golden snapshot');
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
    const hasTextRichLink = typeof preview.content === 'string'
      && /^https?:\/\//i.test(preview.content)
      && /\s+\S+/.test(preview.content.replace(/^https?:\/\/\S+\s*/, ''));
    if (hasTextRichLink) {
      assert.ok(/^\d+ chars$/.test(preview.content_length), `${fileName}: text-rich link preview should include content_length`);
    } else {
      assert.strictEqual(preview.content_length, undefined, `${fileName}: non-text link preview should not include content_length`);
    }
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
  assert.strictEqual(voiceNode.data_preview.raw_meta.duration, '0:20', 'voice-note raw_meta.duration should keep raw input value');
  assert.strictEqual(voiceNode.data_preview.content_length, undefined);

  const videoNode = parseMessageNodes(createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'video-call.html'), 'utf8')), 'video-call.html', '2026.05.15 00:00', metaMap)[0];
  assert.strictEqual(videoNode.data_preview.content_type, 'video-call');
  assert.strictEqual(videoNode.data_preview.duration, '31:00 mins');
  assert.strictEqual(videoNode.data_preview.raw_meta.duration, '31 mins', 'video-call raw_meta.duration should keep raw input value');
  assert.strictEqual(videoNode.data_preview.content_length, undefined);

  const embeddedLinkNode = parseMessageNodes(createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'link-embed-no-text.html'), 'utf8')), 'link-embed-no-text.html', '2026.05.15 00:00', metaMap)[0];
  assert.strictEqual(embeddedLinkNode.data_preview.content_type, 'link');
  assert.strictEqual(embeddedLinkNode.data_preview.content_length, undefined);
}

function testLinkFileUsesLinkType() {
  const result = getContentMeta({
    fileName: 'link-text.html',
    ariaLabel: 'At Thursday 5:34pm, Alpha: image sent',
    message: 'image sent',
    rawMeta: { link: 'https://www.scan.co.uk/' },
    hasLink: false
  });
  assert.strictEqual(result.type, 'link', 'link-text files should be classified as link when raw meta link is present');
  assert.ok(result.text.startsWith('https://www.scan.co.uk/'), 'link-text content should be prepended with the URL');
  assert.ok(result.text.includes('image sent'), 'link-text content should keep message text after the URL');
  assert.ok(/\d+ chars$/.test(result.contentLength), 'link-text previews with text should include content_length');
  assert.strictEqual(result.link, 'https://www.scan.co.uk/');
}

function testMissedCallNoDuration() {
  const result = getContentMeta({
    fileName: 'missed-calls.html',
    ariaLabel: 'At Thursday 5:34pm, Alpha: Missed audio call',
    message: 'Missed audio call',
    rawMeta: {},
    hasLink: false
  });
  assert.strictEqual(result.type, 'missed-call');
  assert.strictEqual(result.duration, null, 'missed calls should not include duration');
  assert.strictEqual(result.contentLength, undefined, 'missed-call previews should not include content_length');
}

function testTextFileDoesNotBecomeLink() {
  const metaMap = buildAllMessageMetaMap(rawDir);
  const nodes = parseMessageNodes(createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'text.html'), 'utf8')), 'text.html', '2026.05.15 00:00', metaMap);
  assert.strictEqual(nodes.length, 1, 'text.html should produce one node');
  assert.strictEqual(nodes[0].data_preview.content_type, 'text', 'text.html should be classified as text');
  assert.notStrictEqual(nodes[0].data_preview.content, 'link', 'text.html content should not be reduced to link');
}

function testImageFileIsImageType() {
  const metaMap = buildAllMessageMetaMap(rawDir);
  const nodes = parseMessageNodes(createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'image.html'), 'utf8')), 'image.html', '2026.05.15 00:00', metaMap);
  assert.strictEqual(nodes.length, 1, 'image.html should produce one node');
  assert.strictEqual(nodes[0].data_preview.content_type, 'image', 'image.html should be classified as image');
  assert.strictEqual(nodes[0].data_preview.content, 'image sent', 'image message preview should use image sent content');
}

function testOptimizedHtmlNoEmptyTags() {
  const rawFiles = fs.readdirSync(rawDir).filter(name => name.endsWith('.html'));
  rawFiles.forEach(fileName => {
    const rawHtml = fs.readFileSync(path.join(rawDir, fileName), 'utf8');
    const optimized = createOptimizedHtml(rawHtml);
    assert.ok(!/<([a-zA-Z0-9]+)([^>]*)>\s*<\/\1>/.test(optimized), `${fileName}: optimized HTML should not contain empty tags`);
  });
}

function testParseAriaLabel() {
  const parsed = parseAriaLabel('At May 15, 2026, 11:00, You: Hello world');
  assert.strictEqual(parsed.sender, 'You');
  assert.strictEqual(parsed.message, 'Hello world');
  assert.strictEqual(parsed.date, 'May 15, 2026, 11:00');
}

function testParseAriaLabelLinkText() {
  const parsed = parseAriaLabel('At Wednesday 7:51pm, Alpha Yep — that’s the *Sennheiser IE 100 PRO In-Ear Monitoring* headphones');
  assert.strictEqual(parsed.sender, 'Alpha');
  assert.strictEqual(parsed.date, 'Wednesday 7:51pm');
  assert.ok(parsed.message.startsWith('Yep - that’s the'), 'Link text message should preserve leading conversational token in message content');
}

function testParseAriaLabelSenderSplits() {
  const audioParsed = parseAriaLabel('At April 12, 2026, 1:23 PM, You');
  assert.strictEqual(audioParsed.sender, 'You');
  assert.ok(audioParsed.date.includes('April 12, 2026'), 'Audio call date should stay intact');

  const textParsed = parseAriaLabel('At 12:26 AM, Alpha Do you have that photo and a link?');
  assert.strictEqual(textParsed.sender, 'Alpha');
  assert.strictEqual(textParsed.message, 'Do you have that photo and a link?');
}

function testAnonymizeChatNames() {
  const rawHtml = '<title>Rob</title><div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"><img alt="Rob Leon"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div>Message body mentioning Rob should be anonymized.</div>';
  const cleaned = anonymizeChatNames(rawHtml);
  assert.ok(cleaned.includes('aria-label="At Wednesday 7:54pm, Alpha"'), 'Sender aria-label should be anonymized');
  assert.ok(cleaned.includes('aria-label="Enter, Message sent Wednesday 7:54pm by Alpha"'), 'Enter message sender should be anonymized');
  assert.ok(cleaned.includes('<img alt="Alpha Leon"'), 'Profile alt text sender word should be anonymized');
  assert.ok(!cleaned.includes('Rob deleted a message'), 'Message content should be anonymized once the sender name is found');
  assert.ok(!cleaned.includes('Message body mentioning Rob should be anonymized.'), 'Message body text references should be anonymized once the sender name is found');
  assert.ok(cleaned.includes('<title>Alpha</title>'), 'Chat title should be anonymized if it contains the sender name');
}

function testAnonymizeChatNamesPreservesYou() {
  const rawHtml = '<div aria-label="At Thursday 5:34pm, You" aria-roledescription="message"></div><div aria-label="Enter, Message sent Thursday 5:34pm by You"></div>';
  const cleaned = anonymizeChatNames(rawHtml);
  assert.ok(cleaned.includes('aria-label="At Thursday 5:34pm, You"'), 'Self-label You should remain unchanged');
  assert.ok(cleaned.includes('aria-label="Enter, Message sent Thursday 5:34pm by You"'), 'Self-label by You should remain unchanged');
}

function testAnonymizeChatNamesOnlyReplacesShortSenderNames() {
  const rawHtml = '<div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div>All of this is a long phrase that is not a sender name</div>';
  const cleaned = anonymizeChatNames(rawHtml);
  assert.ok(cleaned.includes('Alpha deleted a message'), 'Valid short sender name should be anonymized');
  assert.ok(cleaned.includes('All of this is a long phrase that is not a sender name'), 'Long non-name phrases should not be anonymized');
}

function testAnonymizeChatNamesPreservesRawDateText() {
  const rawHtml = '<title>Rob</title><div aria-label="At May 15, 2026, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent May 15, 2026 by Rob"></div>';
  const cleaned = anonymizeChatNames(rawHtml);
  assert.ok(cleaned.includes('May 15, 2026'), 'Raw date text should remain unchanged');
  assert.ok(cleaned.includes('Alpha deleted a message') || cleaned.includes('Alpha'), 'Confirmed sender name should be anonymized');
}

function testAnonymizeChatNamesIgnoresNamesWithNumbers() {
  const rawHtml = '<div aria-label="At Thursday 5:34pm, Alice 2024" aria-roledescription="message"></div><div>Alice 2024 deleted a message</div>';
  const cleaned = anonymizeChatNames(rawHtml);
  assert.ok(cleaned.includes('Alice 2024'), 'Numeric names should not be anonymized');
  assert.ok(!cleaned.includes('Alpha 2024'), 'Numeric names should not be replaced with Alpha');
}

function testBuildServerTextExport() {
  const serverBuild = require('child_process').spawnSync('node', ['src/build-server.js'], { encoding: 'utf8' });
  assert.strictEqual(serverBuild.status, 0, `build-server failed: ${serverBuild.stderr || serverBuild.stdout}`);
  const txtDir = path.join(__dirname, '..', 'Data-output-txt');
  assert.ok(fs.existsSync(txtDir), 'Data-output-txt not created');
  const files = fs.readdirSync(txtDir);
  const sortedTxtFiles = files.filter(name => name.endsWith('.txt')).sort();
  assert.deepStrictEqual(sortedTxtFiles, ['fb-chats-export-content-off.txt', 'fb-chats-export-content-on.txt', 'fb-chats-export-summary.txt'], 'Expected three stable TXT export filenames');

  const summaryTxtPath = path.join(txtDir, 'fb-chats-export-summary.txt');
  assert.ok(fs.existsSync(summaryTxtPath), 'Expected fb-chats-export-summary.txt to be generated');
  assert.ok(!fs.existsSync(path.join(txtDir, 'fb-chats-export-summary.json')), 'Summary JSON export should not be generated');

  const contentOn = fs.readFileSync(path.join(txtDir, 'fb-chats-export-content-on.txt'), 'utf8');
  const contentOff = fs.readFileSync(path.join(txtDir, 'fb-chats-export-content-off.txt'), 'utf8');
  const summaryTxt = fs.readFileSync(summaryTxtPath, 'utf8');

  assert.ok(/\n\d+\s+posts\s*\/\s*\d+\s+days\n/.test(summaryTxt), 'Summary TXT should use posts for total summary');
  assert.ok(/\nAlpha Summary\n\d+\s+post(?:s)?\s*\/\s*\d+\s+days\n/.test(summaryTxt), 'Summary TXT should use post/posts for Alpha Summary');
  assert.ok(/\nYoughurt Summary\n\d+\s+post(?:s)?\s*\/\s*\d+\s+days\n/.test(summaryTxt), 'Summary TXT should use post/posts for Youghurt Summary');

  const uniqueDays = new Set(
    contentOn
      .split(/\r?\n/)
      .filter(line => /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/.test(line))
      .map(line => line.slice(1, 11))
  ).size;
  assert.ok(summaryTxt.includes(` / ${uniqueDays} days`), 'Summary TXT total days must reflect unique days across all messages');

  assert.ok(contentOn.includes('Method: server'), 'Content-on export should include the server method header');
  assert.ok(contentOff.includes('Method: server'), 'Content-off export should include the server method header');
  assert.ok(contentOn.includes('Message types:'), 'Content-on export should include a message types header');
  assert.ok(contentOff.includes('Message types:'), 'Content-off export should include a message types header');
  assert.ok(contentOn.includes('\n---\n'), 'Content-on export summary should end with ---');
  assert.ok(contentOff.includes('\n---\n'), 'Content-off export summary should end with ---');
  assert.ok(contentOn.includes('\nTotal Summary\n'), 'Content-on export should include a Total Summary block when all options are enabled');
  assert.ok(/\n\d+\s+(?:message|messages)\s*\/\s*\d+\s+(?:day|days)\n/.test(contentOn), 'Content-on summary should include a total count line without prefix');
  assert.ok(/\n~\s+\d+\s+text;\n/.test(contentOn), 'Content-on summary should include rough text totals as ~ list items');
  assert.ok(/\n~\s+\d+\s+images\n/.test(contentOn), 'Content-on summary should include rough image totals as ~ list items');
  assert.ok(/\n~\s+\d+\s+calls\s+\d+\s+mins\n/.test(contentOn), 'Content-on summary should include rough call totals without brackets');
  assert.ok(/\nAlpha Summary\n/.test(contentOn), 'Content-on summary should include Alpha Summary section');
  assert.ok(/\nYoughurt Summary\n/.test(contentOn), 'Content-on summary should include Youghurt Summary section');
  assert.ok(/\nAlpha Summary\n\d+\s+(?:message|messages)\s*\/\s*\d+\s+(?:day|days)\n~\s+\d+\s+text;\n~\s+\d+\s+images\n~\s+\d+\s+calls\s+\d+\s+mins\n/.test(contentOn), 'Alpha Summary should mirror total summary list style');
  assert.ok(/\nYoughurt Summary\n\d+\s+(?:message|messages)\s*\/\s*\d+\s+(?:day|days)\n~\s+\d+\s+text;\n~\s+\d+\s+images\n~\s+\d+\s+calls\s+\d+\s+mins\n/.test(contentOn), 'Youghurt Summary should mirror total summary list style');

  const rawFiles = fs.readdirSync(rawDir).filter(name => name.endsWith('.html'));
  rawFiles.forEach(fileName => {
    const sample = path.parse(fileName).name;
    assert.ok(contentOn.includes(`- ${sample}`), `Content-on header should list ${fileName} as dashed item`);
    assert.ok(contentOff.includes(`- ${sample}`), `Content-off header should list ${fileName} as dashed item`);
  });

  const bodyStartOn = contentOn.lastIndexOf('\n---\n');
  const bodyAfterSummary = bodyStartOn > -1 ? contentOn.slice(bodyStartOn + '\n---\n'.length) : contentOn;
  const bodyLinesOn = bodyAfterSummary.split(/\r?\n/).filter(line => /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]/.test(line));
  const bodyLinesOff = contentOff.split(/\r?\n/).filter(Boolean).slice(3 + rawFiles.length);

  assert.strictEqual(bodyLinesOn.length, rawFiles.length, 'Content-on export should contain one message per raw file');
  assert.strictEqual(bodyLinesOff.length, rawFiles.length, 'Content-off export should contain one message per raw file');

  const allMessageDayCount = new Set(
    bodyLinesOn
      .map(line => {
        const m = line.match(/^\[(\d{4}-\d{2}-\d{2})\s\d{2}:\d{2}\]/);
        return m ? m[1] : null;
      })
      .filter(Boolean)
  ).size;

  assert.ok(summaryTxt.includes('Total Summary'), 'Summary TXT should include Total Summary title');
  assert.ok(summaryTxt.includes('---'), 'Summary TXT should include closing separator');
  assert.ok(summaryTxt.includes(` / ${allMessageDayCount} `), 'Summary TXT should include total day count based on all messages');

  const basePattern = /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]\s[^:]+:\s[^/]+(?:\s\/\s.*)?$/;
  assert.ok(bodyLinesOn.every(line => basePattern.test(line)), 'Each content-on line should match [date time] name: type duration length / content format');
  assert.ok(bodyLinesOff.every(line => basePattern.test(line)), 'Each content-off line should match [date time] name: type duration length format');

  rawFiles.forEach(fileName => {
    const typeName = path.parse(fileName).name;
    assert.ok(bodyLinesOn.some(line => line.includes(` ${typeName}`)), `Content-on body should include one line for ${typeName}`);
    assert.ok(bodyLinesOff.some(line => line.includes(` ${typeName}`)), `Content-off body should include one line for ${typeName}`);
  });

  assert.ok(bodyLinesOn.some(line => line.includes('video-call 31:00 mins')), 'Video call lines should include duration in canonical format');
  assert.ok(bodyLinesOn.some(line => /\blink-text\b(?:\s+\d+ chars)?\s*\/\s*https?:\/\//i.test(line)), 'link-text line should include URL content in content-on export');
  assert.ok(bodyLinesOn.some(line => /\blink-embed-no-text\b\s*\/\s*https?:\/\//i.test(line)), 'link-embed-no-text line should include URL content in content-on export');
  assert.ok(bodyLinesOn.some(line => /\blink-text\b\s+\d+ chars\s*\/\s*https?:\/\//i.test(line)), 'link-text lines with text should include content length in content-on export');
  assert.ok(bodyLinesOff.every(line => !line.includes(' / ')), 'Content-off export should not include slash-delimited content');
  const offTextLengthLine = bodyLinesOff.find(line => /\btext\b\s+\d+ chars(?:\s|$)/i.test(line));
  assert.ok(offTextLengthLine, 'Content-off export should still include text content length when content is disabled');

  bodyLinesOn.forEach((line, idx) => {
    assert.ok(!/[\r\n]/.test(line), `Content-on line ${idx + 1} should be single-line text`);
  });
  bodyLinesOff.forEach((line, idx) => {
    assert.ok(!/[\r\n]/.test(line), `Content-off line ${idx + 1} should be single-line text`);
  });

  assert.ok(contentOn.includes('Alpha'), 'Content-on export should contain anonymized sender names as Alpha');
  assert.ok(contentOff.includes('Alpha'), 'Content-off export should contain anonymized sender names as Alpha');
  assert.ok(!contentOn.includes('Rob'), 'Content-on export should not contain raw sender names like Rob');
  assert.ok(!contentOff.includes('Rob'), 'Content-off export should not contain raw sender names like Rob');
}

function testTextExportDurationNormalization() {
  const txtDir = path.join(__dirname, '..', 'Data-output-txt');
  const contentOnPath = path.join(txtDir, 'fb-chats-export-content-on.txt');
  const contentOffPath = path.join(txtDir, 'fb-chats-export-content-off.txt');

  assert.ok(fs.existsSync(contentOnPath), 'Content-on TXT export should exist');
  assert.ok(fs.existsSync(contentOffPath), 'Content-off TXT export should exist');

  const contentOn = fs.readFileSync(contentOnPath, 'utf8');
  const contentOff = fs.readFileSync(contentOffPath, 'utf8');

  // Check that all durations in TXT are normalized to standardized format: "X:XX mins" or "XX mins"
  // Extract all duration patterns from lines that have times (should be after the --- separator)
  const bodyStartOn = contentOn.indexOf('\n---\n');
  const bodyStartOff = contentOff.indexOf('\n---\n');

  assert.ok(bodyStartOn > -1, 'Content-on should have --- separator');
  assert.ok(bodyStartOff > -1, 'Content-off should have --- separator');

  const bodyOn = contentOn.substring(bodyStartOn);
  const bodyOff = contentOff.substring(bodyStartOff);

  // Extract body lines that contain message entries
  // Format: [YYYY-MM-DD HH:MM] sender: type [duration] [length] / [content]
  // We need to check that any duration appearing after ":" and before "/" or end of line uses the "mins" suffix
  const bodyLinesOn = bodyOn.split(/\r?\n/).filter(line => /^\[\d{4}-\d{2}-\d{2}/.test(line));
  const bodyLinesOff = bodyOff.split(/\r?\n/).filter(line => /^\[\d{4}-\d{2}-\d{2}/.test(line));

  // Check that all durations in these lines are properly normalized
  // Duration should appear as: "M:SS mins" or "H:MM:SS mins" (with " mins" suffix)
  // We extract the part after the first colon (after sender name) and check durations
  bodyLinesOn.forEach((line, idx) => {
    // Extract content after "]: " to skip the timestamp
    const contentPart = line.substring(line.indexOf('] ') + 2);
    // Check for duration patterns - should be "N:MM mins" or "NN mins"
    const durationMatches = contentPart.match(/(\d+:\d{2}(?::\d{2})?|\d+)\s+(?!chars)/);
    if (durationMatches && /\d+:\d{2}(?::\d{2})?/.test(durationMatches[0])) {
      // If there's a time-like pattern, it MUST be followed by "mins"
      assert.ok(/\d+:\d{2}(?::\d{2})?\s+mins/.test(contentPart), 
        `Line ${idx + 1} in content-on should have normalized duration like "3:20 mins" or "1:23:45 mins": ${line}`);
    }
  });

  bodyLinesOff.forEach((line, idx) => {
    // Extract content after "]: " to skip the timestamp
    const contentPart = line.substring(line.indexOf('] ') + 2);
    // Check for duration patterns - should be "N:MM mins" or "NN mins"
    const durationMatches = contentPart.match(/(\d+:\d{2}(?::\d{2})?|\d+)\s+(?!chars)/);
    if (durationMatches && /\d+:\d{2}(?::\d{2})?/.test(durationMatches[0])) {
      // If there's a time-like pattern, it MUST be followed by "mins"
      assert.ok(/\d+:\d{2}(?::\d{2})?\s+mins/.test(contentPart), 
        `Line ${idx + 1} in content-off should have normalized duration like "3:20 mins" or "1:23:45 mins": ${line}`);
    }
  });
}

function runTests() {
  const tests = [
    { name: 'normalizeDateToSimple', fn: testNormalizeDateToSimple },
    { name: 'normalizeDuration', fn: testNormalizeDuration },
    { name: 'getContentMeta', fn: testGetContentMeta },
    { name: 'generatedPreviewSchema', fn: testGeneratedPreviewSchema },
    { name: 'rawHtmlRegression', fn: testRawHtmlRegression },
    { name: 'testLinkFileUsesLinkType', fn: testLinkFileUsesLinkType },
    { name: 'testMissedCallNoDuration', fn: testMissedCallNoDuration },
    { name: 'testTextFileDoesNotBecomeLink', fn: testTextFileDoesNotBecomeLink },
    { name: 'testImageFileIsImageType', fn: testImageFileIsImageType },
    { name: 'testOptimizedHtmlNoEmptyTags', fn: testOptimizedHtmlNoEmptyTags },
    { name: 'parseAriaLabel', fn: testParseAriaLabel },
    { name: 'anonymizeChatNames', fn: testAnonymizeChatNames },
    { name: 'parseAriaLabelSenderSplits', fn: testParseAriaLabelSenderSplits },
    { name: 'browserExportFormatting', fn: testBrowserExportFormatting },
    { name: 'browserExportDomRegression', fn: testBrowserExportDomRegression },
    { name: 'userScriptBuildDist', fn: testUserScriptBuildDist },
    { name: 'goldenTxtSnapshots', fn: testGoldenTxtSnapshots },
    { name: 'buildServerTextExport', fn: testBuildServerTextExport },
    { name: 'textExportDurationNormalization', fn: testTextExportDurationNormalization }
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
