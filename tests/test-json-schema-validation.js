const tap = require('tap');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'generated-json-schema.json');
const previewDir = path.join(__dirname, '..', 'data-output-auto/json-format');

const hhmmssPattern = /^\d{2}:\d{2}:\d{2}$/;
const wordCountPattern = /^\d+ words$/;

// ---------------------------------------------------------------------------
// Helper: replicates validateGeneratedJson logic from build-server.cjs
// Returns array of error strings (empty = valid).
// ---------------------------------------------------------------------------

function validateGeneratedJsonLogic(data, fileName) {
  const errors = [];

  if (typeof data.title !== 'string') {
    errors.push(`${fileName}: title must be a string`);
  }
  if (typeof data.type !== 'string') {
    errors.push(`${fileName}: type must be a string`);
  }

  ['data_raw', 'data_preview'].forEach((section) => {
    const obj = data[section];
    if (!obj || typeof obj !== 'object') {
      errors.push(`${fileName}: ${section} is required`);
      return;
    }
    ['date', 'name', 'content', 'duration', 'length'].forEach((field) => {
      if (!(field in obj)) {
        errors.push(`${fileName}: ${section}.${field} is required`);
      }
    });
  });

  const raw = data.data_raw;
  if (raw && typeof raw === 'object') {
    if (raw.length !== null && !wordCountPattern.test(raw.length)) {
      errors.push(`${fileName}: data_raw.length must be null or "N words"`);
    }
    if (raw.name !== null && typeof raw.name !== 'string') {
      errors.push(`${fileName}: data_raw.name must be string or null`);
    }
    if (raw.duration !== null && !hhmmssPattern.test(raw.duration)) {
      errors.push(`${fileName}: data_raw.duration must be HH:MM:SS`);
    }
  }

  const preview = data.data_preview;
  if (preview && typeof preview === 'object') {
    if (preview.name !== null && typeof preview.name !== 'string') {
      errors.push(`${fileName}: data_preview.name must be string or null`);
    }
    if (preview.content !== null && typeof preview.content !== 'string') {
      errors.push(`${fileName}: data_preview.content must be string or null`);
    }
    if (preview.duration !== null && !hhmmssPattern.test(preview.duration)) {
      errors.push(`${fileName}: data_preview.duration must be HH:MM:SS`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

tap.test('schema file is valid JSON and has correct structure', (t) => {
  t.ok(fs.existsSync(schemaPath), 'schema file exists');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  t.equal(schema.$schema, 'http://json-schema.org/draft-07/schema#', '$schema property');
  t.equal(schema.title, 'Messenger Chat Export Preview', 'title property');
  t.equal(schema.type, 'object', 'type is object');
  t.ok(Array.isArray(schema.required), 'required is an array');
  t.ok(schema.properties, 'properties exists');
  t.end();
});

tap.test('schema top-level required fields', (t) => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const expected = ['html_locale', 'title', 'type', 'data_raw', 'data_preview'];
  expected.forEach((field) => {
    t.ok(schema.required.includes(field), `required includes ${field}`);
  });
  t.equal(schema.required.length, expected.length, 'no extra required fields');
  t.end();
});

tap.test('schema data_raw required sub-properties', (t) => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const dataRaw = schema.properties.data_raw;
  t.ok(dataRaw, 'data_raw property exists');
  t.equal(dataRaw.type, 'object', 'data_raw type is object');
  t.ok(Array.isArray(dataRaw.required), 'data_raw.required is an array');
  const expected = ['date', 'name', 'content', 'duration', 'length'];
  expected.forEach((field) => {
    t.ok(dataRaw.required.includes(field), `data_raw.required includes ${field}`);
  });
  t.equal(dataRaw.required.length, expected.length, 'no extra data_raw required fields');
  t.equal(dataRaw.additionalProperties, false, 'data_raw disallows additionalProperties');
  t.end();
});

tap.test('schema data_preview required sub-properties', (t) => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const dataPreview = schema.properties.data_preview;
  t.ok(dataPreview, 'data_preview property exists');
  t.equal(dataPreview.type, 'object', 'data_preview type is object');
  t.ok(Array.isArray(dataPreview.required), 'data_preview.required is an array');
  const expected = ['date', 'name', 'content', 'duration', 'length'];
  expected.forEach((field) => {
    t.ok(dataPreview.required.includes(field), `data_preview.required includes ${field}`);
  });
  t.equal(dataPreview.required.length, expected.length, 'no extra data_preview required fields');
  t.equal(dataPreview.additionalProperties, false, 'data_preview disallows additionalProperties');
  t.end();
});

tap.test('schema length allows null or word-count string', (t) => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const rawLength = schema.properties.data_raw.properties.length;
  t.ok(rawLength, 'data_raw.properties.length exists');
  t.ok(Array.isArray(rawLength.type), 'length type is an array');
  t.ok(rawLength.type.includes('string'), 'length allows string');
  t.ok(rawLength.type.includes('null'), 'length allows null');

  const previewLength = schema.properties.data_preview.properties.length;
  t.ok(previewLength, 'data_preview.properties.length exists');
  t.ok(previewLength.type.includes('string'), 'preview length allows string');
  t.ok(previewLength.type.includes('null'), 'preview length allows null');
  t.end();
});

tap.test('schema data_raw.date and data_preview.date types match expectations', (t) => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const rawDate = schema.properties.data_raw.properties.date;
  t.ok(rawDate, 'data_raw.date exists');
  t.ok(Array.isArray(rawDate.type), 'data_raw.date type is array');
  t.ok(rawDate.type.includes('string'), 'data_raw.date allows string');
  t.ok(rawDate.type.includes('null'), 'data_raw.date allows null');

  const previewDate = schema.properties.data_preview.properties.date;
  t.ok(previewDate, 'data_preview.date exists');
  t.equal(previewDate.type, 'string', 'data_preview.date type is string (non-null)');
  t.end();
});

// ---------------------------------------------------------------------------
// Validation logic tests (mirrors build-server.cjs)
// ---------------------------------------------------------------------------

tap.test('validateGeneratedJsonLogic: valid object passes', (t) => {
  const valid = {
    html_locale: null,
    title: 'text',
    type: 'text',
    data_raw: {
      date: '12:26 AM',
      name: 'XYZ',
      content: 'Hello',
      duration: null,
      length: '8 words',
    },
    data_preview: {
      date: '2026.06.04 00:26',
      name: 'XYZ',
      content: 'Hello',
      duration: null,
      length: '8 words',
    },
  };
  const errors = validateGeneratedJsonLogic(valid, 'test.json');
  t.equal(errors.length, 0, 'no errors for valid object');
  t.end();
});

tap.test('validateGeneratedJsonLogic: missing title', (t) => {
  const data = {
    html_locale: null,
    type: 'text',
    data_raw: { date: 'x', name: null, content: null, duration: null, length: null },
    data_preview: { date: 'x', name: null, content: null, duration: null, length: null },
  };
  const errors = validateGeneratedJsonLogic(data, 'no-title.json');
  t.ok(errors.length > 0, 'has errors');
  t.ok(errors.some((e) => e.includes('title')), 'error mentions title');
  t.end();
});

tap.test('validateGeneratedJsonLogic: missing type', (t) => {
  const data = {
    html_locale: null,
    title: 'text',
    data_raw: { date: 'x', name: null, content: null, duration: null, length: null },
    data_preview: { date: 'x', name: null, content: null, duration: null, length: null },
  };
  const errors = validateGeneratedJsonLogic(data, 'no-type.json');
  t.ok(errors.some((e) => e.includes('type')), 'error mentions type');
  t.end();
});

tap.test('validateGeneratedJsonLogic: missing data_raw', (t) => {
  const data = {
    html_locale: null,
    title: 'text',
    type: 'text',
    data_preview: { date: 'x', name: null, content: null, duration: null, length: null },
  };
  const errors = validateGeneratedJsonLogic(data, 'no-raw.json');
  t.ok(errors.some((e) => e.includes('data_raw')), 'error mentions data_raw');
  t.end();
});

tap.test('validateGeneratedJsonLogic: missing data_preview', (t) => {
  const data = {
    html_locale: null,
    title: 'text',
    type: 'text',
    data_raw: { date: 'x', name: null, content: null, duration: null, length: null },
  };
  const errors = validateGeneratedJsonLogic(data, 'no-preview.json');
  t.ok(errors.some((e) => e.includes('data_preview')), 'error mentions data_preview');
  t.end();
});

tap.test('validateGeneratedJsonLogic: bad data_raw.length format', (t) => {
  const data = {
    html_locale: null,
    title: 'text',
    type: 'text',
    data_raw: { date: 'x', name: null, content: 'hello', duration: null, length: 'eight words' },
    data_preview: { date: 'x', name: null, content: 'hello', duration: null, length: 'eight words' },
  };
  let errors = validateGeneratedJsonLogic(data, 'bad-length.json');
  t.ok(errors.some((e) => e.includes('data_raw.length')), 'error mentions data_raw.length');

  data.data_raw.length = null;
  errors = validateGeneratedJsonLogic(data, 'null-length.json');
  t.equal(errors.length, 0, 'null length passes');

  data.data_raw.length = '42 words';
  errors = validateGeneratedJsonLogic(data, 'num-length.json');
  t.equal(errors.length, 0, 'valid word count passes');

  data.data_raw.length = 42;
  errors = validateGeneratedJsonLogic(data, 'numeric-length.json');
  t.ok(errors.some((e) => e.includes('data_raw.length')), 'numeric fails');
  t.end();
});

tap.test('validateGeneratedJsonLogic: data_raw.name accepts null or string', (t) => {
  const base = {
    html_locale: null,
    title: 'text',
    type: 'text',
    data_raw: { date: 'x', content: null, duration: null, length: null },
    data_preview: { date: 'x', name: null, content: null, duration: null, length: null },
  };

  base.data_raw.name = null;
  t.equal(validateGeneratedJsonLogic(base, 'null-name.json').length, 0, 'null name passes');

  base.data_raw.name = 'Alice';
  t.equal(validateGeneratedJsonLogic(base, 'string-name.json').length, 0, 'string name passes');

  base.data_raw.name = 42;
  const errors = validateGeneratedJsonLogic(base, 'numeric-name.json');
  t.ok(errors.some((e) => e.includes('data_raw.name')), 'numeric name fails');
  t.end();
});

tap.test('validateGeneratedJsonLogic: missing field in data_raw', (t) => {
  const data = {
    html_locale: null,
    title: 'text',
    type: 'text',
    data_raw: { date: 'x', name: null, duration: null, length: null },
    data_preview: { date: 'x', name: null, content: null, duration: null, length: null },
  };
  const errors = validateGeneratedJsonLogic(data, 'missing-content.json');
  t.ok(errors.some((e) => e.includes('data_raw.content')), 'error mentions data_raw.content');
  t.end();
});

tap.test('validateGeneratedJsonLogic: missing field in data_preview', (t) => {
  const data = {
    html_locale: null,
    title: 'text',
    type: 'text',
    data_raw: { date: 'x', name: null, content: null, duration: null, length: null },
    data_preview: { date: 'x', name: null, duration: null, length: null },
  };
  const errors = validateGeneratedJsonLogic(data, 'missing-preview-content.json');
  t.ok(errors.some((e) => e.includes('data_preview.content')), 'error mentions data_preview.content');
  t.end();
});

tap.test('validateGeneratedJsonLogic: timed type with valid duration passes', (t) => {
  ['voice-note', 'video-call', 'audio-call'].forEach((type) => {
    const data = {
      html_locale: null,
      title: type,
      type,
      data_raw: {
        date: 'x', name: null, content: null,
        duration: '00:15:30',
        length: null,
      },
      data_preview: {
        date: 'x', name: null, content: null,
        duration: '00:15:30',
        length: null,
      },
    };
    const errors = validateGeneratedJsonLogic(data, `${type}.json`);
    t.equal(errors.length, 0, `${type} with valid HH:MM:SS duration passes`);
  });
  t.end();
});

tap.test('validateGeneratedJsonLogic: data_raw duration validates HH:MM:SS', (t) => {
  const base = {
    html_locale: null,
    title: 'voice-note',
    type: 'voice-note',
    data_raw: { date: 'x', name: null, content: null, length: null },
    data_preview: { date: 'x', name: null, content: null, duration: null, length: null },
  };

  base.data_raw.duration = null;
  t.equal(validateGeneratedJsonLogic(base, 'null-duration.json').length, 0, 'null duration passes');

  base.data_raw.duration = '00:00:00';
  t.equal(validateGeneratedJsonLogic(base, 'zero-duration.json').length, 0, '00:00:00 passes');

  base.data_raw.duration = '12:34:56';
  t.equal(validateGeneratedJsonLogic(base, 'valid-duration.json').length, 0, '12:34:56 passes');

  base.data_raw.duration = '0:00:00';
  let errors = validateGeneratedJsonLogic(base, 'short-hours.json');
  t.ok(errors.some((e) => e.includes('duration')), 'single-digit hour fails');

  base.data_raw.duration = '00:0:00';
  errors = validateGeneratedJsonLogic(base, 'short-minutes.json');
  t.ok(errors.some((e) => e.includes('duration')), 'single-digit minute fails');

  base.data_raw.duration = 'abc';
  errors = validateGeneratedJsonLogic(base, 'alpha-duration.json');
  t.ok(errors.some((e) => e.includes('duration')), 'non-numeric fails');

  base.data_raw.duration = '00:00:0';
  errors = validateGeneratedJsonLogic(base, 'short-seconds.json');
  t.ok(errors.some((e) => e.includes('duration')), 'single-digit second fails');
  t.end();
});

tap.test('validateGeneratedJsonLogic: data_preview duration validates HH:MM:SS', (t) => {
  const base = {
    html_locale: null,
    title: 'voice-note',
    type: 'voice-note',
    data_raw: { date: 'x', name: null, content: null, duration: null, length: null },
    data_preview: { date: 'x', name: null, content: null, length: null },
  };

  base.data_preview.duration = null;
  t.equal(validateGeneratedJsonLogic(base, 'null-preview-duration.json').length, 0, 'null preview duration passes');

  base.data_preview.duration = '01:23:45';
  t.equal(validateGeneratedJsonLogic(base, 'valid-preview-duration.json').length, 0, 'valid preview duration passes');

  base.data_preview.duration = 'bad';
  const errors = validateGeneratedJsonLogic(base, 'bad-preview-duration.json');
  t.ok(errors.some((e) => e.includes('data_preview.duration')), 'bad preview duration fails');
  t.end();
});

tap.test('validateGeneratedJsonLogic: html_locale is not validated (passed through)', (t) => {
  const valid = {
    html_locale: 'hu_HU',
    title: 'text',
    type: 'text',
    data_raw: { date: 'x', name: null, content: null, duration: null, length: null },
    data_preview: { date: 'x', name: null, content: null, duration: null, length: null },
  };
  t.equal(validateGeneratedJsonLogic(valid, 'locale-set.json').length, 0, 'string html_locale passes');

  valid.html_locale = null;
  t.equal(validateGeneratedJsonLogic(valid, 'locale-null.json').length, 0, 'null html_locale passes');

  valid.html_locale = 42;
  t.equal(
    validateGeneratedJsonLogic(valid, 'locale-numeric.json').length,
    0,
    'numeric html_locale passes through (not validated by helper, matching build-server.cjs)',
  );
  t.end();
});

tap.test('validateGeneratedJsonLogic: data_raw.content and data_raw.date accept string or null', (t) => {
  const base = {
    html_locale: null,
    title: 'image',
    type: 'image',
    data_raw: { date: 'x', name: null, duration: null, length: null },
    data_preview: { date: 'x', name: null, content: 'image sent', duration: null, length: null },
  };

  base.data_raw.content = null;
  base.data_raw.content = null;
  t.equal(validateGeneratedJsonLogic(base, 'null-content.json').length, 0, 'null content passes');

  base.data_raw.content = 'some text';
  t.equal(validateGeneratedJsonLogic(base, 'string-content.json').length, 0, 'string content passes');

  base.data_raw.date = null;
  t.equal(validateGeneratedJsonLogic(base, 'null-date.json').length, 0, 'null date passes');

  base.data_raw.date = 'Wednesday 7:51pm';
  t.equal(validateGeneratedJsonLogic(base, 'string-date.json').length, 0, 'string date passes');
  t.end();
});

// ---------------------------------------------------------------------------
// End-to-end: validate actual generated JSON files
// ---------------------------------------------------------------------------

tap.test('all generated JSON files pass validation', (t) => {
  if (!fs.existsSync(previewDir)) {
    t.skip('preview directory not found');
    t.end();
    return;
  }
  const files = fs
    .readdirSync(previewDir)
    .filter((name) => name.endsWith('.json') && name !== 'raw-input-metadata.json');
  if (files.length === 0) {
    t.skip('no generated JSON files found');
    t.end();
    return;
  }

  files.forEach((fileName) => {
    const filePath = path.join(previewDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const errors = validateGeneratedJsonLogic(data, fileName);
    t.equal(errors.length, 0, `${fileName} passes validation`);
    if (errors.length > 0) {
      errors.forEach((e) => t.comment(e));
    }
  });

  t.end();
});

tap.test('each generated JSON file has all required top-level properties', (t) => {
  if (!fs.existsSync(previewDir)) {
    t.skip('preview directory not found');
    t.end();
    return;
  }
  const files = fs
    .readdirSync(previewDir)
    .filter((name) => name.endsWith('.json') && name !== 'raw-input-metadata.json');
  if (files.length === 0) {
    t.skip('no generated JSON files found');
    t.end();
    return;
  }

  files.forEach((fileName) => {
    const filePath = path.join(previewDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    t.ok('html_locale' in data, `${fileName}: has html_locale`);
    t.ok('title' in data, `${fileName}: has title`);
    t.ok('type' in data, `${fileName}: has type`);
    t.ok('data_raw' in data, `${fileName}: has data_raw`);
    t.ok('data_preview' in data, `${fileName}: has data_preview`);
  });

  t.end();
});

tap.test('generated JSON files: timed types have HH:MM:SS duration', (t) => {
  if (!fs.existsSync(previewDir)) {
    t.skip('preview directory not found');
    t.end();
    return;
  }
  const timedTypes = new Set(['voice-note', 'video-call', 'audio-call']);
  const files = fs
    .readdirSync(previewDir)
    .filter((name) => name.endsWith('.json') && name !== 'raw-input-metadata.json');
  if (files.length === 0) {
    t.skip('no generated JSON files found');
    t.end();
    return;
  }

  files.forEach((fileName) => {
    const filePath = path.join(previewDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (timedTypes.has(data.type)) {
      if (data.data_raw.duration !== null) {
        t.ok(hhmmssPattern.test(data.data_raw.duration), `${fileName}: data_raw.duration is HH:MM:SS`);
      }
      if (data.data_preview.duration !== null) {
        t.ok(hhmmssPattern.test(data.data_preview.duration), `${fileName}: data_preview.duration is HH:MM:SS`);
      }
    }
  });

  t.end();
});

tap.test('generated JSON files: data_raw.length is null or word count', (t) => {
  if (!fs.existsSync(previewDir)) {
    t.skip('preview directory not found');
    t.end();
    return;
  }
  const files = fs
    .readdirSync(previewDir)
    .filter((name) => name.endsWith('.json') && name !== 'raw-input-metadata.json');
  if (files.length === 0) {
    t.skip('no generated JSON files found');
    t.end();
    return;
  }

  files.forEach((fileName) => {
    const filePath = path.join(previewDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    t.ok(
      data.data_raw.length === null || wordCountPattern.test(data.data_raw.length),
      `${fileName}: data_raw.length is null or word count`,
    );
  });

  t.end();
});

tap.test('generated JSON files: data_raw.name is null or string', (t) => {
  if (!fs.existsSync(previewDir)) {
    t.skip('preview directory not found');
    t.end();
    return;
  }
  const files = fs
    .readdirSync(previewDir)
    .filter((name) => name.endsWith('.json') && name !== 'raw-input-metadata.json');
  if (files.length === 0) {
    t.skip('no generated JSON files found');
    t.end();
    return;
  }

  files.forEach((fileName) => {
    const filePath = path.join(previewDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    t.ok(
      data.data_raw.name === null || typeof data.data_raw.name === 'string',
      `${fileName}: data_raw.name is null or string`,
    );
  });

  t.end();
});
