const tap = require('tap');
const fs = require('fs');
const path = require('path');

const txtDir = path.join(__dirname, '..', 'data-output/final-export');
const runtimeConfig = require('../src/shared/export-config.json');

function loadSchema(t) {
  const schema = runtimeConfig;
  t.ok(schema, 'Runtime TXT export config not found');
  t.equal(typeof schema.method, 'string', 'TXT config.method must be a string');
  t.ok(
    Array.isArray(schema.messageTypes) && schema.messageTypes.length > 0,
    'TXT config.messageTypes must be a non-empty array'
  );
  t.ok(
    schema.patterns && typeof schema.patterns === 'object',
    'TXT config.patterns must be defined'
  );
  t.ok(
    Array.isArray(schema.exports) && schema.exports.length > 0,
    'TXT config.exports must be a non-empty array'
  );
  return schema;
}

function compilePatterns(schema) {
  return {
    entryLine: new RegExp(schema.patterns.entryLine),
    duration: new RegExp(schema.patterns.duration),
    totalSummaryTitle: new RegExp(schema.patterns.totalSummaryTitle),
    totalLine: new RegExp(schema.patterns.totalLine),
    roughTextLine: new RegExp(schema.patterns.roughTextLine),
    roughWordsLine: new RegExp(schema.patterns.roughWordsLine),
    roughImagesLine: new RegExp(schema.patterns.roughImagesLine),
    roughCallsLine: new RegExp(schema.patterns.roughCallsLine),
    personSummaryTitle: new RegExp(schema.patterns.personSummaryTitle),
  };
}

function validateHeader(t, lines, schema, fileName) {
  t.equal(lines[0], `Method: ${schema.method}`, `${fileName}: method line mismatch`);
  t.equal(lines[1], 'Message types:', `${fileName}: missing message types header`);

  const expectedTypeLines = schema.messageTypes.map((type) => `- ${type}`);
  const typeLines = lines.slice(2, 2 + expectedTypeLines.length);
  t.strictSame(
    typeLines,
    expectedTypeLines,
    `${fileName}: message types must match schema order and values`
  );

  let index = 2 + expectedTypeLines.length;
  while (index < lines.length && lines[index] === '') index += 1;

  if (/^Options\b/.test(lines[index] || '')) {
    index += 1;
    if (/^Unused:/.test(lines[index] || '')) {
      index += 1;
    }
    while (index < lines.length && lines[index].startsWith('  ')) {
      index += 1;
    }
  }

  while (index < lines.length && lines[index] === '') index += 1;
  if (lines[index] === 'Aliases:') {
    index += 1;
    while (index < lines.length && lines[index].startsWith('  ')) {
      index += 1;
    }
  }

  t.equal(lines[index], '---', `${fileName}: missing header separator`);
  return index + 1;
}

function validateSummary(t, lines, schema, patterns, startIndex, fileName) {
  let index = startIndex;
  while (index < lines.length && lines[index] === '') index += 1;

  t.ok(
    patterns.totalSummaryTitle.test(lines[index] || ''),
    `${fileName}: missing Total Summary title`
  );
  index += 1;

  t.ok(patterns.totalLine.test(lines[index] || ''), `${fileName}: invalid Total line`);
  index += 1;

  t.ok(
    patterns.roughTextLine.test(lines[index] || ''),
    `${fileName}: invalid rough text/words total line`
  );
  index += 1;


  t.ok(
    patterns.roughImagesLine.test(lines[index] || ''),
    `${fileName}: invalid rough images total line`
  );
  index += 1;

  t.ok(
    patterns.roughCallsLine.test(lines[index] || ''),
    `${fileName}: invalid rough calls total line`
  );
  index += 1;

  if (lines[index] === '') index += 1;

  let personCount = 0;
  while (patterns.personSummaryTitle.test(lines[index] || '')) {
    personCount += 1;
    const ordinal = personCount === 1 ? 'first' : personCount === 2 ? 'second' : `person ${personCount}`;
    index += 1;
    t.ok(patterns.totalLine.test(lines[index] || ''), `${fileName}: invalid ${ordinal} person Total line`);
    index += 1;
    t.ok(patterns.roughTextLine.test(lines[index] || ''), `${fileName}: invalid ${ordinal} person rough text/words line`);
    index += 1;
    t.ok(patterns.roughImagesLine.test(lines[index] || ''), `${fileName}: invalid ${ordinal} person rough images line`);
    index += 1;
    t.ok(patterns.roughCallsLine.test(lines[index] || ''), `${fileName}: invalid ${ordinal} person rough calls line`);
    index += 1;
    if (lines[index] === '') index += 1;
  }
  t.ok(personCount >= 1, `${fileName}: missing person summary section`);

  t.equal(lines[index], '---', `${fileName}: missing summary closing separator`);
  index += 1;
  if (lines[index] === '') index += 1;

  return index;
}

function validateBody(t, lines, patterns, startIndex, fileName, includeContent) {
  const bodyLines = lines.slice(startIndex).filter(Boolean);
  t.ok(bodyLines.length > 0, `${fileName}: body is empty`);

  bodyLines.forEach((line, idx) => {
    t.ok(
      patterns.entryLine.test(line),
      `${fileName}: invalid body line format at index ${idx + 1}: ${line}`
    );
    if (includeContent) {
      if (/\b(?:text|text-replied|text-image-replied|link-text|link-embed-no-text)\b/.test(line)) {
        t.ok(
          /\s\/\s/.test(line),
          `${fileName}: includeContent export includes slash content segment when applicable: ${line}`
        );
      }
    } else {
      t.ok(
        !/\s\/\s/.test(line),
        `${fileName}: export-minimal export omits slash content segments: ${line}`
      );
    }

    const payloadMatch = line.match(/^\[[^\]]+\]\s[^:]+:\s(.+)$/);
    const payload = payloadMatch ? payloadMatch[1] : line;
    const durationLike = payload.match(/\d+:\d{2}(?::\d{2})?|\b\d+\s+mins\b/i);
    if (durationLike && /:\d{2}/.test(durationLike[0])) {
      t.ok(
        patterns.duration.test(payload),
        `${fileName}: duration must follow standardized pattern in line: ${line}`
      );
    }
  });
}

function validateFile(t, fileSchema, schema, patterns) {
  const filePath = path.join(txtDir, fileSchema.fileName);
  t.ok(fs.existsSync(filePath), `TXT export missing: ${fileSchema.fileName}`);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  let bodyStart = validateHeader(t, lines, schema, fileSchema.fileName);
  if (fileSchema.includeSummary) {
    bodyStart = validateSummary(t, lines, schema, patterns, bodyStart, fileSchema.fileName);
  }

  validateBody(t, lines, patterns, bodyStart, fileSchema.fileName, fileSchema.includeContent);
}

tap.test('validate generated TXT exports', (t) => {
  t.ok(fs.existsSync(txtDir), `TXT output directory not found: ${txtDir}`);

  const schema = loadSchema(t);
  const patterns = compilePatterns(schema);

  schema.exports.forEach((fileSchema) => {
    validateFile(t, fileSchema, schema, patterns);
  });

  t.end();
});
