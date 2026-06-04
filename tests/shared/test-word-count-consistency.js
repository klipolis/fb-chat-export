const tap = require('tap');
const { getContentMeta } = require('../../src/shared/message-metadata.js');
const { exportText } = require('../../src/shared/export-text.js');
const { createNodes } = require('../../src/shared/create-nodes.js');

// Load test fixtures
const fs = require('node:fs');
const path = require('node:path');

const loadFixture = (name) => {
  const filePath = path.join(__dirname, '../../data-input-test/', name);
  return fs.readFileSync(filePath, 'utf8');
};

tap.test('Word count consistency across JSON and text exports', (t) => {
  // Test text message word count consistency
  const textHtml = loadFixture('text.html');
  const textNodes = createNodes(textHtml, { onlyFiles: ['text.html'] });
  
  t.equal(textNodes.length, 1, 'Should create exactly one node for text.html');
  
  const textNode = textNodes[0];
  t.equal(textNode.type, 'text', 'Should be classified as text');
  
  // Check that data_preview.length exists and is a string representing word count
  t.ok(textNode.data_preview.length !== null, 'data_preview.length should not be null for text');
  t.match(textNode.data_preview.length, /^\d+$/, 'data_preview.length should be a numeric string');
  
  // Check that data_raw.length also exists and matches (for text messages)
  t.ok(textNode.data_raw.length !== null, 'data_raw.length should not be null for text');
  t.equal(textNode.data_raw.length, textNode.data_preview.length, 
    'data_raw.length and data_preview.length should match for text messages');
  
  // Verify word count using getContentMeta
  const contentMeta = getContentMeta(textNode.data_raw.content, textNode.type);
  t.equal(contentMeta.words, parseInt(textNode.data_preview.length, 10),
    'Word count from getContentMeta should match data_preview.length');
  
  // Verify text export includes correct word count
  const textExport = exportText(textNodes);
  t.ok(textExport.includes(`[${textNode.data_preview.length}]`),
    'Text export should include word count in brackets');
  
  t.end();
});

tap.test('Voice note length consistency (should be null)', (t) => {
  // Test voice note - should have null length
  const voiceNoteHtml = loadFixture('voice-note-2.html');
  const voiceNoteNodes = createNodes(voiceNoteHtml, { onlyFiles: ['voice-note-2.html'] });
  
  t.equal(voiceNoteNodes.length, 1, 'Should create exactly one node for voice-note-2.html');
  
  const voiceNoteNode = voiceNoteNodes[0];
  t.equal(voiceNoteNode.type, 'voice-note', 'Should be classified as voice-note');
  
  // Check that length is null for voice notes (duration-based)
  t.equal(voiceNoteNode.data_raw.length, null, 'data_raw.length should be null for voice notes');
  t.equal(voiceNoteNode.data_preview.length, null, 'data_preview.length should be null for voice notes');
  
  // Verify text export doesn't include word count for voice notes
  const textExport = exportText(voiceNoteNodes);
  t.notOk(textExport.includes('[null]'), 'Text export should not show [null] for voice notes');
  t.notOk(/\[\d+\]/.test(textExport), 'Text export should not include word count brackets for voice notes');
  
  t.end();
});

tap.test('Image message length consistency (should be null)', (t) => {
  // Test image message - should have null length
  const imageHtml = loadFixture('image.html');
  const imageNodes = createNodes(imageHtml, { onlyFiles: ['image.html'] });
  
  t.equal(imageNodes.length, 1, 'Should create exactly one node for image.html');
  
  const imageNode = imageNodes[0];
  t.equal(imageNode.type, 'image', 'Should be classified as image');
  
  // Check that length is null for images
  t.equal(imageNode.data_raw.length, null, 'data_raw.length should be null for images');
  t.equal(imageNode.data_preview.length, null, 'data_preview.length should be null for images');
  
  t.end();
});

tap.test('Link message length consistency', (t) => {
  // Test link message - should have word count based on link text + URL
  const linkHtml = loadFixture('link-text.html');
  const linkNodes = createNodes(linkHtml, { onlyFiles: ['link-text.html'] });
  
  t.equal(linkNodes.length, 1, 'Should create exactly one node for link-text.html');
  
  const linkNode = linkNodes[0];
  t.equal(linkNode.type, 'link', 'Should be classified as link');
  
  // Check that length exists and is a word count
  t.ok(linkNode.data_preview.length !== null, 'data_preview.length should not be null for links');
  t.match(linkNode.data_preview.length, /^\d+$/, 'data_preview.length should be a numeric string');
  
  // Verify consistency between raw and preview
  t.equal(linkNode.data_raw.length, linkNode.data_preview.length, 
    'data_raw.length and data_preview.length should match for links');
  
  t.end();
});