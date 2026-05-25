const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const docsDir = path.join(rootDir, 'docs');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const packagePath = path.join(rootDir, 'package.json');
const licensePath = path.join(rootDir, 'LICENSE');
const todoConfigPath = path.join(rootDir, '.todo', 'config.json');

function resolveRepoPath(...segments) {
  return path.join(rootDir, ...segments);
}

function repoRelative(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

module.exports = {
  rootDir,
  docsDir,
  changelogPath,
  packagePath,
  licensePath,
  todoConfigPath,
  resolveRepoPath,
  repoRelative,
};
