const fs = require('fs');
const { resolveRepoPath, repoRelative } = require('./shared/app-config');

const dirs = [
  resolveRepoPath('data-output', 'optimized-html'),
  resolveRepoPath('data-output', 'json-format'),
  resolveRepoPath('dist'),
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
  dirs.forEach((dir) => console.log(`- ${repoRelative(dir)}`));
}

main();
