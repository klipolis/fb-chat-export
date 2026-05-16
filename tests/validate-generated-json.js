const assert = require('assert');
const fs = require('fs');
const path = require('path');

const previewDir = path.join(__dirname, '..', 'Data-output-json');
const schemaPath = path.join(__dirname, 'generated-json-schema.json');
const timedTypes = new Set(['voice-message', 'video-call', 'audio-call']);
const noLengthTypes = new Set(['unsent', 'missed-call']);

function loadSchema() {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.ok(schema, 'Generated JSON schema not found');
  return schema;
}

function validatePreviewJson(data, fileName) {
  assert.strictEqual(typeof data.title, 'string', `${fileName}: title must be a string`);
  assert.ok(data.locate && typeof data.locate === 'object', `${fileName}: locate is required`);
  assert.strictEqual(typeof data.locate.message, 'string');
  assert.strictEqual(typeof data.locate.label, 'string');
  assert.strictEqual(typeof data.locate.textContent, 'string');

  const preview = data.data_preview;
  if (preview.content_type && preview.content_type !== 'unknown') {
    assert.strictEqual(data.title, preview.content_type, `${fileName}: title must reflect content_type`);
  } else {
    assert.strictEqual(data.title, path.parse(fileName).name, `${fileName}: title should fall back to file name when content_type is unknown`);
  }
  assert.ok(preview && typeof preview === 'object', `${fileName}: data_preview is required`);
  assert.strictEqual(typeof preview.optimised_date, 'string', `${fileName}: optimised_date is required`);
  assert.ok('content' in preview, `${fileName}: content is required`);
  assert.ok(typeof preview.content === 'string' || preview.content === null, `${fileName}: content must be a string or null`);
  assert.strictEqual(typeof preview.content_type, 'string', `${fileName}: content_type is required`);

  if (preview.duration !== undefined) {
    assert.strictEqual(typeof preview.duration, 'string', `${fileName}: duration must be a string when present`);
  }

  if (timedTypes.has(preview.content_type)) {
    assert.ok(preview.duration === undefined || typeof preview.duration === 'string', `${fileName}: timed preview duration must be a string or omitted`);
    if (preview.duration !== undefined) {
      assert.strictEqual(preview.content_length, undefined, `${fileName}: timed preview with duration must omit content_length`);
    }
  }

  if (noLengthTypes.has(preview.content_type)) {
    assert.strictEqual(preview.content_length, undefined, `${fileName}: ${preview.content_type} preview should not include content_length`);
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

  if (preview.raw_meta) {
    assert.strictEqual(typeof preview.raw_meta, 'object', `${fileName}: raw_meta must be an object`);
    if (preview.raw_meta.duration !== undefined) {
      assert.strictEqual(typeof preview.raw_meta.duration, 'string', `${fileName}: raw_meta.duration must be a string`);
    }
    if (preview.raw_meta.link !== undefined) {
      assert.strictEqual(typeof preview.raw_meta.link, 'string', `${fileName}: raw_meta.link must be a string`);
    }
  }
}

function run() {
  assert.ok(fs.existsSync(previewDir), `Preview directory not found: ${previewDir}`);
  assert.ok(fs.existsSync(schemaPath), `Schema file not found: ${schemaPath}`);
  loadSchema();

  const files = fs.readdirSync(previewDir).filter(name => name.endsWith('.json') && name !== 'raw-input-metadata.json');
  assert.ok(files.length > 0, 'No generated preview JSON files found');

  files.forEach(fileName => {
    const filePath = path.join(previewDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    validatePreviewJson(data, fileName);
  });

  console.log(`Validated ${files.length} generated JSON file(s).`);
}

run();
