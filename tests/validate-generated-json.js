const assert = require('assert');
const fs = require('fs');
const path = require('path');

const previewDir = path.join(__dirname, '..', 'demo/output-json');
const schemaPath = path.join(__dirname, 'generated-json-schema.json');
const timedTypes = new Set(['voice-message', 'video-call', 'audio-call']);

function loadSchema() {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.ok(schema, 'Generated JSON schema not found');
  return schema;
}

function validatePreviewJson(data, fileName) {
  assert.strictEqual(typeof data.title, 'string', `${fileName}: title must be a string`);
  assert.strictEqual(typeof data.type, 'string', `${fileName}: type must be a string`);
  assert.ok(
    data.html_locale === null || typeof data.html_locale === 'string',
    `${fileName}: html_locale must be string or null`
  );

  const raw = data.data_raw;
  assert.ok(raw && typeof raw === 'object', `${fileName}: data_raw is required`);
  assert.ok('date' in raw, `${fileName}: data_raw.date is required`);
  assert.ok('content' in raw, `${fileName}: data_raw.content is required`);
  assert.ok('duration' in raw, `${fileName}: data_raw.duration is required`);
  assert.ok('length' in raw, `${fileName}: data_raw.length is required`);
  assert.strictEqual(raw.length, null, `${fileName}: data_raw.length must be null`);

  const preview = data.data_preview;
  assert.ok(preview && typeof preview === 'object', `${fileName}: data_preview is required`);
  assert.strictEqual(typeof preview.date, 'string', `${fileName}: data_preview.date is required`);
  assert.ok('content' in preview, `${fileName}: data_preview.content is required`);
  assert.ok(
    typeof preview.content === 'string' || preview.content === null,
    `${fileName}: data_preview.content must be a string or null`
  );
  assert.ok('duration' in preview, `${fileName}: data_preview.duration is required`);
  assert.ok('length' in preview, `${fileName}: data_preview.length is required`);

  if (data.type === 'reaction') {
    assert.strictEqual(raw.content, null, `${fileName}: reaction data_raw.content must be null`);
    assert.strictEqual(preview.content, null, `${fileName}: reaction data_preview.content must be null`);
    assert.strictEqual(preview.length, null, `${fileName}: reaction data_preview.length must be null`);
  }

  if (timedTypes.has(data.type)) {
    if (preview.duration !== null) {
      assert.strictEqual(typeof preview.duration, 'string', `${fileName}: timed duration must be string`);
      assert.strictEqual(preview.length, null, `${fileName}: timed type with duration must have null length`);
    }
  }
}

function run() {
  assert.ok(fs.existsSync(previewDir), `Preview directory not found: ${previewDir}`);
  assert.ok(fs.existsSync(schemaPath), `Schema file not found: ${schemaPath}`);
  loadSchema();

  const files = fs
    .readdirSync(previewDir)
    .filter((name) => name.endsWith('.json') && name !== 'raw-input-metadata.json');
  assert.ok(files.length > 0, 'No generated preview JSON files found');

  files.forEach((fileName) => {
    const filePath = path.join(previewDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    validatePreviewJson(data, fileName);
  });

  console.log(`Validated ${files.length} generated JSON file(s).`);
}

run();
