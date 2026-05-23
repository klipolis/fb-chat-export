const tap = require('tap');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const baseDir = path.resolve(__dirname, '..');
const distPath = path.join(baseDir, 'dist', 'app.js');
const minDistPath = path.join(baseDir, 'dist', 'app.min.js');

tap.test('validate dist artifacts', (t) => {
  if (!process.env.SKIP_BUILD) {
    const result = spawnSync('node', ['src/frontend/build.js'], {
      cwd: baseDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        BUILD_PLATFORM: 'userscript',
      },
    });
    t.equal(result.status, 0, `build-frontend failed: ${result.stderr || result.stdout}`);
  }

  t.ok(fs.existsSync(distPath), 'dist/app.js should exist after build');

  const contents = fs.readFileSync(distPath, 'utf8');
  t.ok(/\/\/ ==UserScript==/.test(contents), 'dist/app.js should contain a userscript header');
  t.ok(/\/\/ @version\s+/.test(contents), 'dist/app.js should contain a version annotation');
  t.ok(contents.length > 200, 'dist/app.js should not be empty');

  t.ok(fs.existsSync(minDistPath), 'dist/app.min.js should exist after build');
  const minContents = fs.readFileSync(minDistPath, 'utf8');
  t.ok(/\/\/ ==UserScript==/.test(minContents), 'dist/app.min.js should contain a userscript header');
  t.ok(/\/\/ @version\s+/.test(minContents), 'dist/app.min.js should contain a version annotation');
  t.ok(minContents.length > 200, 'dist/app.min.js should not be empty');
  t.ok(!/contentMeta\./.test(minContents), 'dist/app.min.js should not contain stale contentMeta references');
  t.ok(minContents.length < contents.length, 'dist/app.min.js should be smaller than dist/app.js');

  t.end();
});

tap.test('userscript header file is included in dist builds', (t) => {
  const headerTxtPath = path.join(baseDir, 'src', 'platforms', 'userscript', 'header.txt');
  t.ok(fs.existsSync(headerTxtPath), 'userscript header template missing');

  const headerText = fs.readFileSync(headerTxtPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const distContents = fs.readFileSync(distPath, 'utf8');
  const minContents = fs.readFileSync(minDistPath, 'utf8');

  headerText.forEach((line) => {
    t.ok(distContents.includes(line), `dist/app.js should include header line: ${line}`);
    t.ok(minContents.includes(line), `dist/app.min.js should include header line: ${line}`);
  });

  t.ok(distContents.startsWith('// ==UserScript=='), 'dist/app.js should start with userscript header block');
  t.ok(minContents.startsWith('// ==UserScript=='), 'dist/app.min.js should start with userscript header block');
  t.end();
});
