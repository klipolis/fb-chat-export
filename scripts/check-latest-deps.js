const { execSync } = require('child_process');
const pkgs = ['@commitlint/cli','@commitlint/config-conventional','@eslint/js','cross-env','esbuild','eslint','globals','husky','jsdom','markdown-link-check','markdownlint-cli','prettier','tap'];
for (const pkg of pkgs) {
  try {
    const version = execSync(`npm view ${pkg} version`, { encoding: 'utf8' }).trim();
    console.log(`${pkg}@${version}`);
  } catch (error) {
    console.error(`ERR ${pkg} ${error.message}`);
  }
}
