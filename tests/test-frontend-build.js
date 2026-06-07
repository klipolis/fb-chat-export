const tap = require('tap');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const baseDir = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// frontendBuildDist
// ---------------------------------------------------------------------------

tap.test('frontendBuildDist', (t) => {
  const buildResult = childProcess.spawnSync('node', ['src/frontend/build.cjs'], {
    cwd: baseDir,
    encoding: 'utf8',
  });
  t.equal(buildResult.status, 0, `build.cjs failed: ${buildResult.stderr || buildResult.stdout}`);

  const distPath = path.join(baseDir, 'dist', 'app.js');
  t.ok(fs.existsSync(distPath), 'dist/app.js exists after build');
  const contents = fs.readFileSync(distPath, 'utf8');
  t.ok(/\/\/ @version\s+/.test(contents), 'dist/app.js contains a version field');
  t.ok(contents.length > 200, 'dist/app.js is not empty');
  t.end();
});

// ---------------------------------------------------------------------------
// parseLocalDate — async (ESM dynamic import)
// ---------------------------------------------------------------------------

tap.test('parseLocalDate', (t) => {
  // frontend-utils.mjs is ESM — run assertions in a subprocess to avoid
  // require(esm) cycle issues with tap's ts-node loader.
  const script = `
import { parseLocalDate } from './src/shared/frontend-utils.mjs';
const results = [];
const check = (label, actual, expected) => results.push({ label, ok: actual === expected, actual, expected });
const d1 = parseLocalDate('2026-05-18');
check('YYYY-MM-DD year', d1.getFullYear(), 2026);
check('YYYY-MM-DD month (0-based)', d1.getMonth(), 4);
check('YYYY-MM-DD day', d1.getDate(), 18);
const d2 = parseLocalDate('2026/05/18');
check('YYYY/MM/DD year', d2.getFullYear(), 2026);
const d3 = parseLocalDate('18.05.2026');
check('DD.MM.YYYY year', d3.getFullYear(), 2026);
check('DD.MM.YYYY month', d3.getMonth(), 4);
check('DD.MM.YYYY day', d3.getDate(), 18);
const d4 = parseLocalDate('18/05/2026');
check('DD/MM/YYYY year', d4.getFullYear(), 2026);
const bad = parseLocalDate('not-a-date');
results.push({ label: 'invalid returns NaN', ok: isNaN(bad), actual: bad, expected: NaN });
process.stdout.write(JSON.stringify(results));
`;
  const result = childProcess.spawnSync(
    'node',
    ['--input-type=module'],
    { input: script, cwd: baseDir, encoding: 'utf8' }
  );
  t.equal(result.status, 0, `parseLocalDate subprocess failed: ${result.stderr}`);
  if (result.status === 0) {
    const assertions = JSON.parse(result.stdout);
    assertions.forEach(({ label, ok }) => t.ok(ok, label));
  }
  t.end();
});
