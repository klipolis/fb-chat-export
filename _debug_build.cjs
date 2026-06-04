const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set up the exact state as it would be before test-incremental-build.js runs
const rootDir = path.resolve(__dirname, '..');
const cachePath = path.join(rootDir, 'data-output-auto', 'build-cache.json');
const buildScript = path.join(rootDir, 'src/build-server.cjs');
const tempFile = path.join(rootDir, 'data-input-test', 'temp-deleteme.html');
const testFile = path.join(rootDir, 'data-input-test', 'text.html');

// Clean up any mess from previous tests
if (fs.existsSync(tempFile)) fs.rmSync(tempFile);

// Restore text.html if modified
const origContent = '<div lang="en" aria-roledescription="message"><span>Hey XYZ</span></div>\n';
fs.writeFileSync(testFile, origContent, 'utf8');

// Clear cache and run build
if (fs.existsSync(cachePath)) fs.rmSync(cachePath);
console.log('Cache cleared, running build...');
const r = spawnSync('node', [buildScript], { encoding: 'utf8', cwd: rootDir });
console.log('exit:', r.status);
console.log('stdout (last 500):', r.stdout.slice(-500));
console.log('stderr:', r.stderr);
