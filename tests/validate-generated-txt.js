const assert = require('assert');
const fs = require('fs');
const path = require('path');

const txtDir = path.join(__dirname, '..', 'Data-output-txt');
const schemaPath = path.join(__dirname, 'generated-txt-schema.json');

function loadSchema() {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.ok(schema, 'Generated TXT schema not found');
  assert.strictEqual(typeof schema.method, 'string', 'TXT schema.method must be a string');
  assert.ok(Array.isArray(schema.messageTypes) && schema.messageTypes.length > 0, 'TXT schema.messageTypes must be a non-empty array');
  assert.ok(schema.patterns && typeof schema.patterns === 'object', 'TXT schema.patterns must be defined');
  assert.ok(Array.isArray(schema.exports) && schema.exports.length > 0, 'TXT schema.exports must be a non-empty array');
  return schema;
}

function compilePatterns(schema) {
  return {
    entryLine: new RegExp(schema.patterns.entryLine),
    duration: new RegExp(schema.patterns.duration),
    totalSummaryTitle: new RegExp(schema.patterns.totalSummaryTitle),
    totalLine: new RegExp(schema.patterns.totalLine),
    roughTextLine: new RegExp(schema.patterns.roughTextLine),
    roughImagesLine: new RegExp(schema.patterns.roughImagesLine),
    roughCallsLine: new RegExp(schema.patterns.roughCallsLine),
    personSummaryTitle: new RegExp(schema.patterns.personSummaryTitle)
  };
}

function validateHeader(lines, schema, fileName) {
  assert.strictEqual(lines[0], `Method: ${schema.method}`, `${fileName}: method line mismatch`);
  assert.strictEqual(lines[1], 'Message types:', `${fileName}: missing message types header`);

  const expectedTypeLines = schema.messageTypes.map(type => `- ${type}`);
  const typeLines = lines.slice(2, 2 + expectedTypeLines.length);
  assert.deepStrictEqual(typeLines, expectedTypeLines, `${fileName}: message types must match schema order and values`);

  const separatorLine = lines[2 + expectedTypeLines.length];
  assert.strictEqual(separatorLine, '---', `${fileName}: missing header separator`);

  return 3 + expectedTypeLines.length;
}

function validateSummary(lines, schema, patterns, startIndex, fileName) {
  let index = startIndex;
  while (index < lines.length && lines[index] === '') index += 1;

  assert.ok(patterns.totalSummaryTitle.test(lines[index] || ''), `${fileName}: missing Total Summary title`);
  index += 1;

  assert.ok(patterns.totalLine.test(lines[index] || ''), `${fileName}: invalid Total line`);
  index += 1;

  assert.ok(patterns.roughTextLine.test(lines[index] || ''), `${fileName}: invalid rough text total line`);
  index += 1;

  assert.ok(patterns.roughImagesLine.test(lines[index] || ''), `${fileName}: invalid rough images total line`);
  index += 1;

  assert.ok(patterns.roughCallsLine.test(lines[index] || ''), `${fileName}: invalid rough calls total line`);
  index += 1;

  if (lines[index] === '') index += 1;

  assert.ok(patterns.personSummaryTitle.test(lines[index] || ''), `${fileName}: missing first person summary title`);
  index += 1;
  assert.ok(patterns.totalLine.test(lines[index] || ''), `${fileName}: invalid first person Total line`);
  index += 1;
  assert.ok(patterns.roughTextLine.test(lines[index] || ''), `${fileName}: invalid first person rough text line`);
  index += 1;
  assert.ok(patterns.roughImagesLine.test(lines[index] || ''), `${fileName}: invalid first person rough images line`);
  index += 1;
  assert.ok(patterns.roughCallsLine.test(lines[index] || ''), `${fileName}: invalid first person rough calls line`);
  index += 1;

  if (lines[index] === '') index += 1;

  assert.ok(patterns.personSummaryTitle.test(lines[index] || ''), `${fileName}: missing second person summary title`);
  index += 1;
  assert.ok(patterns.totalLine.test(lines[index] || ''), `${fileName}: invalid second person Total line`);
  index += 1;
  assert.ok(patterns.roughTextLine.test(lines[index] || ''), `${fileName}: invalid second person rough text line`);
  index += 1;
  assert.ok(patterns.roughImagesLine.test(lines[index] || ''), `${fileName}: invalid second person rough images line`);
  index += 1;
  assert.ok(patterns.roughCallsLine.test(lines[index] || ''), `${fileName}: invalid second person rough calls line`);
  index += 1;

  if (lines[index] === '') index += 1;

  assert.strictEqual(lines[index], '---', `${fileName}: missing summary closing separator`);
  index += 1;
  if (lines[index] === '') index += 1;

  return index;
}

function validateBody(lines, patterns, startIndex, fileName, includeContent) {
  const bodyLines = lines.slice(startIndex).filter(Boolean);
  assert.ok(bodyLines.length > 0, `${fileName}: body is empty`);

  bodyLines.forEach((line, idx) => {
    assert.ok(patterns.entryLine.test(line), `${fileName}: invalid body line format at index ${idx + 1}: ${line}`);
    if (includeContent) {
      if (/\b(?:text|text-replied|text-image-replied|link-text|link-embed-no-text)\b/.test(line)) {
        assert.ok(/\s\/\s/.test(line), `${fileName}: includeContent export should include slash content segment when applicable: ${line}`);
      }
    } else {
      assert.ok(!/\s\/\s/.test(line), `${fileName}: content-off export should not contain slash content segments: ${line}`);
    }

    const payloadMatch = line.match(/^\[[^\]]+\]\s[^:]+:\s(.+)$/);
    const payload = payloadMatch ? payloadMatch[1] : line;
    const durationLike = payload.match(/\d+:\d{2}(?::\d{2})?|\b\d+\s+mins\b/i);
    if (durationLike && /:\d{2}/.test(durationLike[0])) {
      assert.ok(patterns.duration.test(payload), `${fileName}: duration must follow standardized pattern in line: ${line}`);
    }
  });
}

function validateFile(fileSchema, schema, patterns) {
  const filePath = path.join(txtDir, fileSchema.fileName);
  assert.ok(fs.existsSync(filePath), `TXT export missing: ${fileSchema.fileName}`);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  let bodyStart = validateHeader(lines, schema, fileSchema.fileName);
  if (fileSchema.includeSummary) {
    bodyStart = validateSummary(lines, schema, patterns, bodyStart, fileSchema.fileName);
  }

  validateBody(lines, patterns, bodyStart, fileSchema.fileName, fileSchema.includeContent);
}

function run() {
  assert.ok(fs.existsSync(txtDir), `TXT output directory not found: ${txtDir}`);
  assert.ok(fs.existsSync(schemaPath), `TXT schema file not found: ${schemaPath}`);

  const schema = loadSchema();
  const patterns = compilePatterns(schema);

  schema.exports.forEach(fileSchema => {
    validateFile(fileSchema, schema, patterns);
  });

  console.log(`Validated ${schema.exports.length} generated TXT file(s).`);
}

run();
