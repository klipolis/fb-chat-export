// TAP_TIMEOUT: 120000
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const { resolveRepoPath } = require('../src/shared/app-config');

const buildScript = resolveRepoPath('src/build-server.cjs');
const rawDir = resolveRepoPath('data-input-test');

function runBuild() {
  return childProcess.spawnSync('node', [buildScript], { encoding: 'utf8', cwd: resolveRepoPath() });
}

tap.test('emptyInputDirectory', (t) => {
  const tmpDir = resolveRepoPath('data-input-test-tmp');
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });

  fs.renameSync(rawDir, tmpDir);
  const result = runBuild();
  t.equal(result.status, 1, 'exit code 1 for missing input directory');
  t.ok(result.stderr.includes('Missing HTML Raw folder'), 'stderr mentions missing folder');

  fs.renameSync(tmpDir, rawDir);
  t.end();
});

tap.test('emptyInputFiles', (t) => {
  const htmlFiles = fs.readdirSync(rawDir).filter((f) => f.endsWith('.html'));
  const tempDir = resolveRepoPath('data-input-test-tmp-files');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  for (const f of htmlFiles) {
    fs.renameSync(path.join(rawDir, f), path.join(tempDir, f));
  }

  const result = runBuild();
  t.equal(result.status, 1, 'exit code 1 for no HTML files');
  t.ok(result.stderr.includes('No raw HTML files found'), 'stderr mentions no HTML files');

  for (const f of htmlFiles) {
    fs.renameSync(path.join(tempDir, f), path.join(rawDir, f));
  }
  fs.rmSync(tempDir, { recursive: true });
  t.end();
});
