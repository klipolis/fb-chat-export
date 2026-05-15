const fs = require('fs');
const path = require('path');
const { minifyJs } = require('../shared/utils');

const sourcePath = path.resolve(__dirname, 'userscript- export-message.js');
const distDir = path.resolve(__dirname, '..', '..', 'dist');
const outputPath = path.join(distDir, 'userscript.js');
const relOutputPath = './dist/userscript.js';

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const content = fs.readFileSync(sourcePath, 'utf8');
const minified = minifyJs(content);
fs.writeFileSync(outputPath, minified, 'utf8');
console.log(`Generated userscript: ${relOutputPath}`);
