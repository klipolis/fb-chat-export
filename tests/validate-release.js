const tap = require('tap');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const config = require(path.join(baseDir, 'src', 'shared', 'export-config.json'));
const generatedSchema = require(path.join(__dirname, 'generated-txt-schema.json'));
const changelog = fs.readFileSync(path.join(baseDir, 'CHANGELOG.md'), 'utf8');
const distPath = path.join(baseDir, 'dist', 'app.js');

tap.test('validate release sync for changelog, schema, and dist artifacts', (t) => {
  t.strictSame(
    config.summaryConcept,
    generatedSchema.summaryConcept,
    'Runtime export config and generated TXT schema summary concept must match'
  );
  t.strictSame(
    config.exports,
    generatedSchema.exports,
    'Runtime export config and generated TXT schema export definitions must match'
  );
  t.strictSame(
    config.messageTypes,
    generatedSchema.messageTypes,
    'Runtime export config and generated TXT schema message types must match'
  );
  t.ok(fs.existsSync(distPath), 'dist/app.js must exist for release validation');
  const minDistPath = path.join(baseDir, 'dist', 'app.min.js');
  t.ok(fs.existsSync(minDistPath), 'dist/app.min.js must exist for release validation');

  const distContents = fs.readFileSync(distPath, 'utf8');
  t.ok(/\/\/ @version\s+/.test(distContents), 'dist/app.js must contain @version header');
  t.ok(/^##\s+v\d+\.\d+\.\d+/m.test(changelog), 'CHANGELOG.md must include a top-level release version heading');
  t.ok(
    /(dist\/app\.js|export|TXT|schema)/i.test(changelog),
    'CHANGELOG.md should reference export, schema, or dist build changes'
  );

  t.end();
});
