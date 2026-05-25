const tap = require('tap');
const fs = require('fs');
const { resolveRepoPath, changelogPath } = require('../src/shared/app-config');

const config = require('../src/shared/export-config.json');
const generatedSchema = require('./generated-txt-schema.json');
const changelog = fs.readFileSync(changelogPath, 'utf8');
const distPath = resolveRepoPath('dist', 'app.js');

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
  const minDistPath = resolveRepoPath('dist', 'app.min.js');
  t.ok(fs.existsSync(minDistPath), 'dist/app.min.js must exist for release validation');

  const distContents = fs.readFileSync(distPath, 'utf8');
  t.ok(/\/\/ @version\s+/.test(distContents), 'dist/app.js must contain @version header');
  t.ok(/^##\s+v\d+\.\d+\.\d+/m.test(changelog), 'CHANGELOG.md must include a top-level release version heading');
  t.ok(
    /(dist\/app\.js|export|TXT|schema)/i.test(changelog),
    'CHANGELOG.md references export, schema, or dist build changes'
  );

  t.end();
});
