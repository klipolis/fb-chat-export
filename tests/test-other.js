const tap = require('tap');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const childProcess = require('child_process');
const { formatExportHeader, formatLine, buildExportText } = require(
  '../src/shared/export-formatter'
);
const { buildSummary } = require(
  '../src/shared/export-summary'
);
const { normalizeExportSender } = require(
  '../src/shared/export-text'
);
const { buildEntriesFromDocument, extractMessageEntry } = require(
  '../src/shared/export-text'
);
const { createOptimizedHtml } = require(
  '../src/shared/optimize-html'
);
const { buildAllMessageMetaMap, parseMessageNodes } = require(
  '../src/shared/create-nodes'
);
const aliasNames = require('../data-config/alias-names.json');

const rawDir = path.join(__dirname, '../data-input');
const referenceDate = '2026.05.15 00:00';

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
    '[2026-04-17 15:45] Youghurt: text 2 words / Hello world\n',
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

  // reactions: content is null or emoji/smiley string
  if (node.type === 'reaction') {
    t.ok(raw.content === null || typeof raw.content === 'string', `${fileName}: reaction data_raw.content must be null or string`);
    if (preview.content !== raw.content) {
      t.equal(preview.content, null, `${fileName}: reaction non-emoji raw content has null preview`);
    }
    if (preview.content) {
      t.equal(typeof preview.length, 'string', `${fileName}: reaction with content must have string length`);
    } else {
      t.equal(preview.length, null, `${fileName}: reaction without content must have null length`);
    }
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
    createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'call-video.html'), 'utf8')),
    'call-video.html',
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

tap.test('image-2 preview date and alias fallback', (t) => {
  const metaMap = buildAllMessageMetaMap(rawDir);
  const node = parseMessageNodes(
    createOptimizedHtml(fs.readFileSync(path.join(rawDir, 'image-2.html'), 'utf8')),
    'image-2.html',
    '2026.05.15 00:00',
    metaMap
  )[0];

  t.ok(node, 'image-2 produces a node');
  t.equal(node.data_preview.name, aliasNames.any, 'Non-English sender names are aliased using the any fallback');
  t.equal(node.data_preview.date, '2026.05.09 04:36', 'Relative Saturday date is normalized to the latest matching Saturday');
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
    const optimizedWithoutAllowedMessageWrappers = optimized.replace(
      /<([a-zA-Z0-9]+)([^>]*)\saria-roledescription="message"([^>]*)>\s*<\/\1>/gi,
      ''
    );
    t.ok(
      !/<([a-zA-Z0-9]+)([^>]*)>\s*<\/\1>/.test(optimizedWithoutAllowedMessageWrappers),
      `${fileName}: optimized HTML not contain empty tags`
    );
  });
  t.end();
});

// ---------------------------------------------------------------------------
// normalizeExportSender — export-level sender name normalization
// ---------------------------------------------------------------------------

tap.test('normalizeExportSender', (t) => {
  t.equal(normalizeExportSender('You'), 'Youghurt', 'self-sender You becomes Youghurt');
  t.equal(normalizeExportSender('Yoghurt'), 'Youghurt', 'older Yoghurt alias becomes Youghurt');
  t.equal(normalizeExportSender('Alpha'), 'Alpha', 'known sender pass through unchanged');
  t.equal(normalizeExportSender(''), 'Unknown', 'empty sender becomes Unknown');
  t.equal(normalizeExportSender(null), 'Unknown', 'null sender becomes Unknown');
  t.equal(normalizeExportSender(undefined), 'Unknown', 'undefined sender becomes Unknown');
  t.equal(normalizeExportSender('John Smith'), 'John Smith', 'multi-word sender pass through unchanged');
  t.end();
});

// ---------------------------------------------------------------------------
// extractMessageEntrySender — sender name extraction in export pipeline
// ---------------------------------------------------------------------------

tap.test('extractMessageEntrySender', (t) => {
  const refDate = '2026.05.22 00:00';
  const testCases = [
    {
      label: 'At 10:15 AM, You: Hello world',
      expectedSender: 'Youghurt',
      expectedType: 'text',
    },
    {
      label: 'At 10:15 AM, Alpha: Hi there',
      expectedSender: 'Alpha',
      expectedType: 'text',
    },
    {
      label: 'At 10:15 AM, Invalid Name With Four Words: test',
      expectedSender: 'Invalid',
      expectedType: 'text',
    },
  ];

  testCases.forEach(({ label, expectedSender, expectedType }, i) => {
    const dom = new JSDOM(`<div aria-roledescription="message" aria-label="${label}">content</div>`);
    const entry = extractMessageEntry(
      dom.window.document.querySelector('[aria-roledescription="message"]'),
      'text.html',
      refDate
    );
    t.equal(entry.sender, expectedSender, `case ${i}: sender resolves to ${expectedSender}`);
    t.equal(entry.semanticType, expectedType, `case ${i}: type resolves to ${expectedType}`);
  });

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
// multiImagePipeline — end-to-end test for image-2 and image-3
// ---------------------------------------------------------------------------

tap.test('multiImagePipeline', (t) => {
  const metaMap = buildAllMessageMetaMap(rawDir);
  const refDate = '2026.05.15 00:00';

  const files = [
    { fileName: 'image-2.html', expectedImageCount: 2 },
    { fileName: 'image-3.html', expectedImageCount: 2 },
  ];

  files.forEach(({ fileName, expectedImageCount }) => {
    const rawHtml = fs.readFileSync(path.join(rawDir, fileName), 'utf8');

    // Node pipeline (preview generation)
    const optimized = createOptimizedHtml(rawHtml);
    const nodes = parseMessageNodes(optimized, fileName, refDate, metaMap);
    t.equal(nodes.length, 1, `${fileName}: produces one node`);
    t.equal(nodes[0].type, 'image', `${fileName}: classified as image`);
    t.equal(nodes[0].data_raw.content, null, `${fileName}: raw content is null for image`);
    t.equal(nodes[0].data_preview.content, 'image sent', `${fileName}: preview content is image sent`);
    t.equal(nodes[0].data_preview.length, null, `${fileName}: image has no content length`);

    // DOM pipeline (export generation)
    const dom = new JSDOM(rawHtml);
    const entries = buildEntriesFromDocument(dom.window.document, fileName, refDate);
    t.equal(entries.length, 1, `${fileName}: export produces one entry`);
    t.equal(entries[0].semanticType, 'image', `${fileName}: export type is image`);
    t.equal(entries[0].imageCount, expectedImageCount, `${fileName}: image count is ${expectedImageCount}`);
  });

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
