const tap = require('tap');
const fs = require('fs');
const path = require('path');

const previewDir = path.join(__dirname, '..', 'data-output/json-format');
const schemaPath = path.join(__dirname, 'generated-json-schema.json');
const timedTypes = new Set(['voice-note', 'video-call', 'audio-call']);
const hhmmssPattern = /^\d{2}:\d{2}:\d{2}$/;

function validatePreviewJson(t, data, fileName) {
  t.equal(typeof data.title, 'string', `${fileName}: title must be a string`);
  t.equal(typeof data.type, 'string', `${fileName}: type must be a string`);
  t.ok(
    data.html_locale === null || typeof data.html_locale === 'string',
    `${fileName}: html_locale must be string or null`
  );

  const raw = data.data_raw;
  t.ok(raw && typeof raw === 'object', `${fileName}: data_raw is required`);
  t.ok('date' in raw, `${fileName}: data_raw.date is required`);
  t.ok('content' in raw, `${fileName}: data_raw.content is required`);
  t.ok('duration' in raw, `${fileName}: data_raw.duration is required`);
  t.ok('length' in raw, `${fileName}: data_raw.length is required`);
  t.equal(raw.length, null, `${fileName}: data_raw.length must be null`);

  if (raw.duration !== null) {
    t.ok(hhmmssPattern.test(raw.duration), `${fileName}: data_raw.duration must be HH:MM:SS`);
  }

  const preview = data.data_preview;
  t.ok(preview && typeof preview === 'object', `${fileName}: data_preview is required`);
  t.equal(typeof preview.date, 'string', `${fileName}: data_preview.date is required`);
  t.ok('content' in preview, `${fileName}: data_preview.content is required`);
  t.ok(
    preview.content === null || typeof preview.content === 'string',
    `${fileName}: data_preview.content must be a string or null`
  );
  t.ok('duration' in preview, `${fileName}: data_preview.duration is required`);
  t.ok('length' in preview, `${fileName}: data_preview.length is required`);

  if (data.type === 'reaction') {
    t.equal(raw.content, null, `${fileName}: reaction data_raw.content must be null`);
    t.equal(preview.content, null, `${fileName}: reaction data_preview.content must be null`);
    t.equal(preview.length, null, `${fileName}: reaction data_preview.length must be null`);
  }

  if (timedTypes.has(data.type)) {
    if (preview.duration !== null) {
      t.equal(typeof preview.duration, 'string', `${fileName}: timed duration must be string`);
      t.equal(preview.length, null, `${fileName}: timed type with duration must have null length`);
      t.ok(hhmmssPattern.test(preview.duration), `${fileName}: data_preview.duration must be HH:MM:SS`);
    }
  }
}

tap.test('validate generated JSON previews', (t) => {
  t.ok(fs.existsSync(previewDir), `Preview directory not found: ${previewDir}`);
  t.ok(fs.existsSync(schemaPath), `Schema file not found: ${schemaPath}`);
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  t.ok(schema, 'Generated JSON schema not found');

  const files = fs
    .readdirSync(previewDir)
    .filter((name) => name.endsWith('.json') && name !== 'raw-input-metadata.json');
  t.ok(files.length > 0, 'No generated preview JSON files found');

  files.forEach((fileName) => {
    const filePath = path.join(previewDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    validatePreviewJson(t, data, fileName);
  });

  t.end();
});
