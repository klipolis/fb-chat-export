const tap = require('tap');
const { createNodes } = require('../../src/shared/create-nodes.js');

// Load test fixtures
const fs = require('node:fs');
const path = require('node:path');

const loadFixture = (name) => {
  const filePath = path.join(__dirname, '../../data-input-test/', name);
  return fs.readFileSync(filePath, 'utf8');
};

tap.test('data_raw.name and data_preview.name fields with alias mapping', (t) => {
  // Test Ccoba/Sztoika from voice-note-2.html (should map to XYZ per any→XYZ mapping)
  const voiceNoteHtml = loadFixture('voice-note-2.html');
  const voiceNoteNodes = createNodes(voiceNoteHtml, { onlyFiles: ['voice-note-2.html'] });

  t.equal(voiceNoteNodes.length, 1, 'Should create exactly one node for voice-note-2.html');

  const voiceNoteNode = voiceNoteNodes[0];
  t.equal(voiceNoteNode.type, 'voice-note', 'Should be classified as voice-note');

  // Check data_raw.name preserves original sender name
  t.equal(voiceNoteNode.data_raw.name, 'Ccoba', 'data_raw.name should preserve original sender name');

  // Check data_preview.name receives aliased name (Ccoba → XYZ per any→XYZ mapping)
  t.equal(voiceNoteNode.data_preview.name, 'XYZ', 'data_preview.name should receive aliased name');

  // Test Ötves/Ernő from image-2.html (should also map to XYZ per any→XYZ mapping)
  const imageHtml = loadFixture('image-2.html');
  const imageNodes = createNodes(imageHtml, { onlyFiles: ['image-2.html'] });

  t.equal(imageNodes.length, 1, 'Should create exactly one node for image-2.html');

  const imageNode = imageNodes[0];
  t.equal(imageNode.type, 'image', 'Should be classified as image');

  // Check data_raw.name preserves original sender name
  t.equal(imageNode.data_raw.name, 'Ötves', 'data_raw.name should preserve original sender name');

  // Check data_preview.name receives aliased name (Ötves → XYZ per any→XYZ mapping)
  t.equal(imageNode.data_preview.name, 'XYZ', 'data_preview.name should receive aliased name');

  // Test text message with known alias mapping (You → Youghurt from frontend_shared.json)
  const textHtml = loadFixture('text.html');
  const textNodes = createNodes(textHtml, { onlyFiles: ['text.html'] });

  t.equal(textNodes.length, 1, 'Should create exactly one node for text.html');

  const textNode = textNodes[0];
  t.equal(textNode.type, 'text', 'Should be classified as text');

  // Check data_raw.name preserves original sender name
  t.equal(textNode.data_raw.name, 'You', 'data_raw.name should preserve original sender name');

  // Check data_preview.name receives aliased name (You → Youghurt)
  t.equal(textNode.data_preview.name, 'Youghurt', 'data_preview.name should receive aliased name');

  t.end();
});

tap.test('data_raw.name and data_preview.name for unknown senders', (t) => {
  // Test with a sender not in alias map (should use 'any' mapping or remain unchanged if no mapping)
  const reactionHtml = loadFixture('reaction.html');
  const reactionNodes = createNodes(reactionHtml, { onlyFiles: ['reaction.html'] });

  t.equal(reactionNodes.length, 1, 'Should create exactly one node for reaction.html');

  const reactionNode = reactionNodes[0];
  t.equal(reactionNode.type, 'reaction', 'Should be classified as reaction');

  // For reactions, data_raw.name and data_preview.name should both be null
  t.equal(reactionNode.data_raw.name, null, 'data_raw.name should be null for reactions');
  t.equal(reactionNode.data_preview.name, null, 'data_preview.name should be null for reactions');

  t.end();
});