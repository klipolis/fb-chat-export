// TAP_TIMEOUT: 120000
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const { resolveRepoPath } = require('../src/shared/app-config');

const buildScript = resolveRepoPath('src/build-server.cjs');
const cacheManifestPath = resolveRepoPath('data-output-auto', 'build-cache.json');

function runBuild() {
  return childProcess.spawnSync('node', [buildScript], {
    encoding: 'utf8',
    cwd: resolveRepoPath(),
  });
}

function cachedBuild() {
  if (!fs.existsSync(cacheManifestPath)) return runBuild();
  return runBuild();
}

tap.test('incrementalBuildScenarios', (t) => {
  // Ensure clean state
  if (fs.existsSync(cacheManifestPath)) fs.rmSync(cacheManifestPath);

  // 1. First build creates cache
  const first = runBuild();
  t.equal(first.status, 0, 'first build creates cache');
  if (first.status !== 0) { t.end(); return; }
  t.ok(fs.existsSync(cacheManifestPath), 'cache manifest file exists');
  const cache1 = JSON.parse(fs.readFileSync(cacheManifestPath, 'utf8'));
  t.ok(cache1.complete, 'cache has complete flag');
  t.ok(cache1.inputStates, 'cache has inputStates');
  t.ok(cache1.configMtimes, 'cache has configMtimes');
  t.ok(Object.keys(cache1.inputStates).length > 0, 'inputStates has entries');
  t.ok(Object.keys(cache1.configMtimes).length > 0, 'configMtimes has entries');

  // 2. Second build (unchanged) skips
  const second = runBuild();
  t.equal(second.status, 0, 'second build succeeds');
  t.ok(second.stdout.includes('skipping build'), 'skips when unchanged');
  const cache2 = JSON.parse(fs.readFileSync(cacheManifestPath, 'utf8'));
  t.ok(cache2.complete, 'cache still complete');

  // 3. Modify an input file → rebuilds
  const testFilePath = resolveRepoPath('data-input-test', 'text.html');
  const original = fs.readFileSync(testFilePath, 'utf8');
  const modified = original.replace('aria-roledescription="message"', 'aria-roledescription="message" ');
  fs.writeFileSync(testFilePath, modified, 'utf8');
  const third = runBuild();
  t.equal(third.status, 0, 'build after file change');
  t.notOk(third.stdout.includes('skipping build'), 're-processes after input change');
  fs.writeFileSync(testFilePath, original, 'utf8');
  const clean1 = runBuild();
  t.equal(clean1.status, 0, 'cleanup build after file restore');

  // 4. Modify a config file → rebuilds
  const configPath = resolveRepoPath('data-config', 'frontend_shared.json');
  const configOriginal = fs.readFileSync(configPath, 'utf8');
  const configModified = configOriginal.replace('"any": "XYZ"', '"any": "XYZ" ');
  fs.writeFileSync(configPath, configModified, 'utf8');
  const fourth = runBuild();
  t.equal(fourth.status, 0, 'build after config change');
  t.notOk(fourth.stdout.includes('skipping build'), 're-processes after config change');
  fs.writeFileSync(configPath, configOriginal, 'utf8');
  const clean2 = runBuild();
  t.equal(clean2.status, 0, 'cleanup build after config restore');

  // 5. Skip still reports sizes
  const skip = runBuild();
  t.equal(skip.status, 0, 'skip build');
  t.ok(skip.stdout.includes('skipping build'), 'reports skipping');
  t.ok(skip.stdout.includes('Total:'), 'reports artifact sizes even when skipping');

  t.end();
});
