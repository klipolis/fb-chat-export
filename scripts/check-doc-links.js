const fs = require('fs');
const path = require('path');
const markdownLinkCheck = require('markdown-link-check');

const baseDir = path.resolve(__dirname, '..');
const docsDir = path.join(baseDir, 'docs');
const files = [
  path.join(baseDir, 'docs', 'README.md'),
  path.join(baseDir, 'CHANGELOG.md'),
];

function collectMarkdown(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMarkdown(fullPath);
    } else if (entry.isFile() && fullPath.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  });
}

collectMarkdown(docsDir);

const ignorePatterns = [
  /^mailto:/i,
  /^#/,
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i,
];

function checkFile(filePath) {
  return new Promise((resolve, reject) => {
    const content = fs.readFileSync(filePath, 'utf8');
    markdownLinkCheck(content, { ignorePatterns, baseUrl: filePath }, (err, results) => {
      if (err) return reject(err);

      const deadLinks = results.filter(result => result.status === 'dead');
      if (deadLinks.length > 0) {
        console.error(`\nDead links found in ${path.relative(baseDir, filePath)}:`);
        deadLinks.forEach(result => {
          console.error(`- ${result.link} (${result.status})`);
        });
        return resolve(false);
      }

      console.log(`✔ ${path.relative(baseDir, filePath)}`);
      resolve(true);
    });
  });
}

(async () => {
  console.log('Checking markdown links in docs...');
  let allPassed = true;

  for (const file of files) {
    const passed = await checkFile(file);
    if (!passed) allPassed = false;
  }

  if (!allPassed) {
    console.error('\nMarkdown link check failed.');
    process.exit(1);
  }

  console.log('\nAll markdown links are valid.');
})();
