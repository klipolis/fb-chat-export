const fs = require('fs');
const path = require('path');
const { ensureDir, emptyDir, anonymizeChatNames } = require('./shared/utils');
const { createOptimizedHtml } = require('./shared/optimize-html');
const { runCreateNodes } = require('./shared/create-nodes');

const baseDir = path.resolve(__dirname, '..');
const rawDir = path.join(baseDir, 'Data-input-html-raw');
const optimizedDir = path.join(baseDir, 'Data-output-html');
const previewDir = path.join(baseDir, 'Data-output-json');

const relRaw = './Data-input-html-raw';
const relOptimized = './Data-output-html';
const relPreview = './Data-output-json';

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

  const anonymizeEnv = String(process.env.ANONYMIZE_RAW || '').trim().toLowerCase();
  const anonymize = ['1', 'true', 'y', 'yes'].includes(anonymizeEnv);

  files.forEach(fileName => optimizeFile(fileName, anonymize));
  runCreateNodes();
  console.log('Done: HTML + JSON in ./Data-output-html and ./Data-output-json');
}

main();
