// TAP_TIMEOUT: 120000
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const { resolveRepoPath } = require('../src/shared/app-config');

const buildScript = resolveRepoPath('src/build-server.cjs');
const cachePath = resolveRepoPath('data-output-auto', 'build-cache.json');
const optDir = resolveRepoPath('data-output-auto', 'optimized-html');

function runBuild() {
  return childProcess.spawnSync('node', [buildScript], { encoding: 'utf8', cwd: resolveRepoPath() });
}

tap.test('partialRebuild', (t) => {
  // Clean state and do full build
  const tempFile = resolveRepoPath('data-input-test', 'temp-deleteme.html');
  if (fs.existsSync(tempFile)) fs.rmSync(tempFile);
  if (fs.existsSync(cachePath)) fs.rmSync(cachePath);

  const seed = runBuild();
  t.equal(seed.status, 0, 'full build');
  if (seed.status !== 0) { t.end(); return; }

  const baseHtml = fs.readdirSync(optDir).filter((n) => n.endsWith('.html')).length;
  const preJson = fs.readdirSync(resolveRepoPath('data-output-auto', 'json-format')).filter((n) => n.endsWith('.json')).length;

  // Create new file + modify existing file → partial rebuild
  fs.writeFileSync(tempFile, '<div lang="en" aria-roledescription="message"><span>tmp</span></div>', 'utf8');
  const testFile = resolveRepoPath('data-input-test', 'text.html');
  const orig = fs.readFileSync(testFile, 'utf8');
  fs.writeFileSync(testFile, orig.replace('aria-roledescription="message"', 'aria-roledescription="message" '), 'utf8');

  const b1 = runBuild();
  t.equal(b1.status, 0, 'partial rebuild');
  if (b1.status !== 0) {
    console.log('b1 stderr:', b1.stderr.slice(0, 500));
    fs.rmSync(tempFile);
    fs.writeFileSync(testFile, orig, 'utf8');
    t.end();
    return;
  }
  t.notOk(b1.stdout.includes('skipping build'), 'not skipped');
  const jsonDir = resolveRepoPath('data-output-auto', 'json-format');
  const jsonAfter = fs.readdirSync(jsonDir).filter((n) => n.endsWith('.json')).length;
  t.equal(jsonAfter, preJson + 1, 'JSON files +1 (new file)');
  t.equal(fs.readdirSync(optDir).filter((n) => n.endsWith('.html')).length, baseHtml + 1, 'HTML count +1');
  // onlyFiles filter during partial rebuild only regenerated JSON for changed/new files
  const newNodeFile = resolveRepoPath('data-output-auto', 'json-format', 'temp-deleteme.json');
  t.ok(fs.existsSync(newNodeFile), 'new JSON node created for temp-deleteme.html');

  // Delete temp → stale output cleanup
  const th = path.join(optDir, 'temp-deleteme.html');
  const tj = resolveRepoPath('data-output-auto', 'json-format', 'temp-deleteme.json');
  t.ok(fs.existsSync(th), 'temp HTML exists');

  fs.rmSync(tempFile);
  const b2 = runBuild();
  t.equal(b2.status, 0, 'build after delete');
  if (b2.status !== 0) { console.log('b2 stderr:', b2.stderr); t.end(); return; }
  t.ok(b2.stdout.includes('Removed stale'), 'stale removal');
  t.notOk(fs.existsSync(th), 'stale HTML gone');
  t.notOk(fs.existsSync(tj), 'stale JSON gone');

  // Restore the modified file
  fs.writeFileSync(testFile, orig, 'utf8');
  runBuild();
  t.end();
});
