const tap = require('tap');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { resolveRepoPath } = require('../src/shared/app-config');

const distPath = resolveRepoPath('dist', 'app.js');
const minDistPath = resolveRepoPath('dist', 'app.min.js');

tap.test('validate dist artifacts', (t) => {
  if (!process.env.SKIP_BUILD) {
    const result = spawnSync('node', ['src/frontend/build.cjs'], {
      cwd: resolveRepoPath(),
      encoding: 'utf8',
      env: {
        ...process.env,
        BUILD_PLATFORM: 'userscript',
      },
    });
    t.equal(result.status, 0, `build-frontend failed: ${result.stderr || result.stdout}`);
  }

  t.ok(fs.existsSync(distPath), 'dist/app.js exists after build');

  const contents = fs.readFileSync(distPath, 'utf8');
  t.ok(/\/\/ ==UserScript==/.test(contents), 'dist/app.js contains userscript header');
  t.ok(/\/\/ @version\s+/.test(contents), 'dist/app.js contains version annotation');
  t.ok(contents.length > 200, 'dist/app.js is not empty');

  t.ok(fs.existsSync(minDistPath), 'dist/app.min.js exists after build');
  const minContents = fs.readFileSync(minDistPath, 'utf8');
  t.ok(/\/\/ ==UserScript==/.test(minContents), 'dist/app.min.js contains userscript header');
  t.ok(/\/\/ @version\s+/.test(minContents), 'dist/app.min.js contains version annotation');
  t.ok(minContents.length > 200, 'dist/app.min.js is not empty');
  t.ok(!/contentMeta\./.test(minContents), 'dist/app.min.js has no stale contentMeta references');
  t.ok(minContents.length < contents.length, 'dist/app.min.js is smaller than dist/app.js');

  t.end();
});

tap.test('userscript header file is included in dist builds', (t) => {
  const headerTxtPath = resolveRepoPath('data-config', 'userscript', 'header.txt');
  t.ok(fs.existsSync(headerTxtPath), 'userscript header template missing');

  const headerText = fs.readFileSync(headerTxtPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const distContents = fs.readFileSync(distPath, 'utf8');
  const minContents = fs.readFileSync(minDistPath, 'utf8');

  headerText.forEach((line) => {
    const expectedLine = line === '// @version      %VERSION%'
      ? `// @version      ${require('../package.json').version}`
      : line;
    t.ok(distContents.includes(expectedLine), `dist/app.js includes header line: ${line}`);
    t.ok(minContents.includes(expectedLine), `dist/app.min.js includes header line: ${line}`);
  });

  t.ok(distContents.startsWith('// ==UserScript=='), 'dist/app.js starts with userscript header block');
  t.ok(minContents.startsWith('// ==UserScript=='), 'dist/app.min.js starts with userscript header block');
  t.end();
});
