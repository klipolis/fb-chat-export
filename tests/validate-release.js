const assert = require('assert');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const config = require(path.join(baseDir, 'src', 'shared', 'export-config.json'));
const generatedSchema = require(path.join(__dirname, 'generated-txt-schema.json'));
const changelog = fs.readFileSync(path.join(baseDir, 'CHANGELOG.md'), 'utf8');
const distPath = path.join(baseDir, 'dist', 'userscript.js');

assert.deepStrictEqual(
  config.summaryConcept,
  generatedSchema.summaryConcept,
  'Runtime export config and generated TXT schema summary concept must match'
);
assert.deepStrictEqual(
  config.exports,
  generatedSchema.exports,
  'Runtime export config and generated TXT schema export definitions must match'
);
assert.deepStrictEqual(
  config.messageTypes,
  generatedSchema.messageTypes,
  'Runtime export config and generated TXT schema message types must match'
);
assert.ok(fs.existsSync(distPath), 'dist/userscript.js must exist for release validation');

const distContents = fs.readFileSync(distPath, 'utf8');
assert.ok(/\/\/ @version\s+/.test(distContents), 'dist/userscript.js must contain @version header');
assert.ok(
  /^##\s+v\d+\.\d+\.\d+/m.test(changelog),
  'CHANGELOG.md must include a top-level release version heading'
);
assert.ok(
  /(dist\/userscript\.js|export|TXT|schema)/i.test(changelog),
  'CHANGELOG.md should reference export, schema, or dist build changes'
);

console.log('Validated release sync for changelog, schema, and dist artifacts.');
