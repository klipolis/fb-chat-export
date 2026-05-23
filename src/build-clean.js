const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const dirs = [
  path.join(baseDir, 'data-output/optimized-html'),
  path.join(baseDir, 'data-output/json-format'),
  path.join(baseDir, 'dist'),
];

function removeDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  dirs.forEach((dir) => {
    removeDir(dir);
    ensureDir(dir);
  });
  console.log('Cleaned generated build artifacts:');
  dirs.forEach((dir) => console.log(`- ${path.relative(baseDir, dir)}`));
}

main();
