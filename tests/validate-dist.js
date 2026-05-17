const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const baseDir = path.resolve(__dirname, '..');
const distPath = path.join(baseDir, 'dist', 'userscript.js');

const result = spawnSync('node', ['src/frontend/build.js'], {
  cwd: baseDir,
  encoding: 'utf8',
});
assert.strictEqual(result.status, 0, `build-frontend failed: ${result.stderr || result.stdout}`);
assert.ok(fs.existsSync(distPath), 'dist/userscript.js should exist after build');

const contents = fs.readFileSync(distPath, 'utf8');
assert.ok(
  /\/\/ ==UserScript==/.test(contents),
  'dist/userscript.js should contain a userscript header'
);
assert.ok(
  /\/\/ @version\s+/.test(contents),
  'dist/userscript.js should contain a version annotation'
);
assert.ok(contents.length > 200, 'dist/userscript.js should not be empty');
assert.ok(
  !/contentMeta\./.test(contents),
  'dist/userscript.js should not contain stale contentMeta references'
);

console.log('Validated dist/userscript.js successfully.');
