const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const baseDir = path.resolve(__dirname, '..');
const distPath = path.join(baseDir, 'dist', 'app.js');
const minDistPath = path.join(baseDir, 'dist', 'app.min.js');

if (!process.env.SKIP_BUILD) {
  const result = spawnSync('node', ['src/frontend/build.js'], {
    cwd: baseDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      BUILD_PLATFORM: 'userscript',
    },
  });
  assert.strictEqual(result.status, 0, `build-frontend failed: ${result.stderr || result.stdout}`);
}
assert.ok(fs.existsSync(distPath), 'dist/app.js should exist after build');

const contents = fs.readFileSync(distPath, 'utf8');
assert.ok(
  /\/\/ ==UserScript==/.test(contents),
  'dist/app.js should contain a userscript header'
);
assert.ok(
  /\/\/ @version\s+/.test(contents),
  'dist/app.js should contain a version annotation'
);
assert.ok(contents.length > 200, 'dist/app.js should not be empty');

assert.ok(fs.existsSync(minDistPath), 'dist/app.min.js should exist after build');
const minContents = fs.readFileSync(minDistPath, 'utf8');
assert.ok(
  /\/\/ ==UserScript==/.test(minContents),
  'dist/app.min.js should contain a userscript header'
);
assert.ok(
  /\/\/ @version\s+/.test(minContents),
  'dist/app.min.js should contain a version annotation'
);
assert.ok(minContents.length > 200, 'dist/app.min.js should not be empty');
assert.ok(
  !/contentMeta\./.test(minContents),
  'dist/app.min.js should not contain stale contentMeta references (variable should be mangled)'
);
assert.ok(
  minContents.length < contents.length,
  'dist/app.min.js should be smaller than dist/app.js'
);

console.log('Validated dist/app.js successfully.');
