const tap = require('tap');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const { resolveRepoPath } = require('../src/shared/app-config');

const buildScript = resolveRepoPath('src/build-server.cjs');
const cacheManifestPath = resolveRepoPath('data-output-auto', 'build-cache.json');
const optimizedDir = resolveRepoPath('data-output-auto', 'optimized-html');

function runBuild() {
  return childProcess.spawnSync('node', [buildScript], {
    encoding: 'utf8',
    cwd: resolveRepoPath(),
  });
}

tap.test('incrementalBuildCreatesCacheManifest', (t) => {
  if (fs.existsSync(cacheManifestPath)) {
    fs.rmSync(cacheManifestPath);
  }

  const first = runBuild();
  t.equal(first.status, 0, 'first build succeeds');
  t.ok(fs.existsSync(cacheManifestPath), 'build creates cache manifest');
  const cache = JSON.parse(fs.readFileSync(cacheManifestPath, 'utf8'));
  t.ok(cache.complete, 'cache has complete flag');
  t.ok(cache.inputStates, 'cache has inputStates');
  t.ok(cache.configMtimes, 'cache has configMtimes');
  t.ok(Object.keys(cache.inputStates).length > 0, 'inputStates has entries');
  t.ok(Object.keys(cache.configMtimes).length > 0, 'configMtimes has entries');

  t.end();
});

tap.test('incrementalBuildSkipsWhenUnchanged', (t) => {
  const second = runBuild();
  t.equal(second.status, 0, 'second build succeeds');
  t.ok(second.stdout.includes('skipping build'), 'second build skips when unchanged');
  const beforeCache = JSON.parse(fs.readFileSync(cacheManifestPath, 'utf8'));
  t.ok(beforeCache.complete, 'cache remains valid after skip');

  t.end();
});

tap.test('incrementalBuildRebuildsWhenInputChanged', (t) => {
  const testFilePath = resolveRepoPath('data-input-test', 'text.html');
  const original = fs.readFileSync(testFilePath, 'utf8');

  const modified = original.replace(
    'aria-roledescription="message"',
    'aria-roledescription="message" '
  );
  fs.writeFileSync(testFilePath, modified, 'utf8');

  const third = runBuild();
  t.equal(third.status, 0, 'build after file change succeeds');
  t.notOk(third.stdout.includes('skipping build'), 'build re-processes after input change');

  fs.writeFileSync(testFilePath, original, 'utf8');

  const cleanup = runBuild();
  t.equal(cleanup.status, 0, 'cleanup build succeeds');

  t.end();
});

tap.test('incrementalBuildRebuildsWhenConfigChanged', (t) => {
  const configPath = resolveRepoPath('data-config', 'frontend_shared.json');
  const original = fs.readFileSync(configPath, 'utf8');

  const modified = original.replace('"any": "XYZ"', '"any": "XYZ" ');
  fs.writeFileSync(configPath, modified, 'utf8');

  const fourth = runBuild();
  t.equal(fourth.status, 0, 'build after config change succeeds');
  t.notOk(fourth.stdout.includes('skipping build'), 'build re-processes after config change');

  fs.writeFileSync(configPath, original, 'utf8');

  const cleanup = runBuild();
  t.equal(cleanup.status, 0, 'cleanup build succeeds');

  t.end();
});

tap.test('incrementalBuildReportsSizesOnSkip', (t) => {
  const skip = runBuild();
  t.equal(skip.status, 0, 'skip build succeeds');
  t.ok(skip.stdout.includes('skipping build'), 'reports skipping');
  t.ok(skip.stdout.includes('Total:'), 'reports artifact sizes even when skipping');

  t.end();
});
