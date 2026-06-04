const tap = require('tap');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { createOptimizedHtml } = require(
  '../src/shared/optimize-html'
);
const { buildAllMessageMetaMap, parseMessageNodes } = require(
  '../src/shared/create-nodes'
);
const { buildEntriesFromDocument } = require(
  '../src/shared/export-text'
);
const { aliasNames } = require('../data-config/frontend_shared.json');

const rawDir = path.join(__dirname, '../data-input-test');

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
  t.ok(raw.length === null || /^\d+ words$/.test(raw.length), `${fileName}: data_raw.length must be null or word count`);

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
