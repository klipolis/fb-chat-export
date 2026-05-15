const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ensureDir, emptyDir, anonymizeChatNames } = require('./shared/utils');
const { createOptimizedHtml } = require('./shared/optimize-html');
const { runCreateNodes } = require('./shared/create-nodes');

const baseDir = path.resolve(__dirname, '..');
const rawDir = path.join(baseDir, 'Input-readonly', 'HTML Raw');
const optimizedDir = path.join(baseDir, 'Output-generated', 'HTML Optimised');
const previewDir = path.join(baseDir, 'Output-generated', 'Data preview');

const relRaw = './Input-readonly/HTML Raw';
const relOptimized = './Output-generated/HTML Optimised';
const relPreview = './Output-generated/Data preview';

function optimizeFile(fileName, anonymize) {
  const inputPath = path.join(rawDir, fileName);
  const outputPath = path.join(optimizedDir, fileName);
  const rawHtml = fs.readFileSync(inputPath, 'utf8');
  const cleanedHtml = anonymize ? anonymizeChatNames(rawHtml) : rawHtml;
  const html = createOptimizedHtml(cleanedHtml);
  fs.writeFileSync(outputPath, html, 'utf8');
}

function main() {
  ensureDir(optimizedDir);
  ensureDir(previewDir);
  emptyDir(optimizedDir);
  emptyDir(previewDir);

  if (!fs.existsSync(rawDir)) {
    console.error('Missing HTML Raw folder:', relRaw);
    process.exit(1);
  }

  const files = fs.readdirSync(rawDir).filter(name => name.endsWith('.html'));
  if (!files.length) {
    console.error('No raw HTML files found in', relRaw);
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(`Rebuild ${files.length} files and build preview? [Y/N] `, answer => {
    const choice = String(answer || '').trim().toLowerCase().slice(0, 1);
    if (choice !== 'y') {
      console.log('Aborted.');
      rl.close();
      process.exit(0);
    }

    rl.question('Anonymize raw names? [Y/N] ', anonAnswer => {
      const anonymize = String(anonAnswer || '').trim().toLowerCase().slice(0, 1) === 'y';
      rl.close();
      files.forEach(fileName => optimizeFile(fileName, anonymize));
      runCreateNodes(true);
      console.log('Done: HTML + JSON in ./Output-generated');
    });
  });
}

main();
