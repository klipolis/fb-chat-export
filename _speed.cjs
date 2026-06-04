const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const buildScript = path.join(rootDir, 'src/build-server.cjs');
const cachePath = path.join(rootDir, 'data-output-auto', 'build-cache.json');
const tempFile = path.join(rootDir, 'data-input-test', 'temp-deleteme.html');
const optDir = path.join(rootDir, 'data-output-auto', 'optimized-html');

if (fs.existsSync(cachePath)) fs.rmSync(cachePath);
if (fs.existsSync(tempFile)) fs.rmSync(tempFile);

function run() {
  const b = Date.now();
  const r = spawnSync('node', [buildScript], { encoding: 'utf8', cwd: rootDir });
  return { ...r, elapsed: Date.now() - b };
}

console.log('1: full build');
const r1 = run();
console.log('exit:', r1.status, 'elapsed:', r1.elapsed, 'ms');

const tStart = '<div lang="en" aria-roledescription="message"><span>x</span></div>';
fs.writeFileSync(tempFile, tStart, 'utf8');

console.log('2: build with temp');
const r2 = run();
console.log('exit:', r2.status, 'elapsed:', r2.elapsed, 'ms');
console.log('temp html exists:', fs.existsSync(path.join(optDir, 'temp-deleteme.html')));

fs.rmSync(tempFile);

console.log('3: build after delete');
const r3 = run();
console.log('exit:', r3.status, 'elapsed:', r3.elapsed, 'ms');
console.log('stdout includes Removed stale:', r3.stdout.includes('Removed stale'));
console.log('temp html exists:', fs.existsSync(path.join(optDir, 'temp-deleteme.html')));
