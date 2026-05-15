const fs = require('fs');
const path = require('path');
const { transform } = require('esbuild');

const sourcePath = path.resolve(__dirname, 'userscript- export-message.js');
const distDir = path.resolve(__dirname, '..', '..', 'dist');
const outputPath = path.join(distDir, 'userscript.js');
const relOutputPath = './dist/userscript.js';

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const content = fs.readFileSync(sourcePath, 'utf8');
const headerMatch = content.match(/^[\s\S]*?\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/);
const header = headerMatch ? headerMatch[0].trimEnd() : '';
const body = headerMatch ? content.slice(header.length) : content;

(async () => {
  const result = await transform(body, {
    minify: true,
    target: 'es2020',
    legalComments: 'none'
  });

  const output = header ? `${header}\n\n${result.code}` : result.code;
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`Generated userscript: ${relOutputPath}`);
})();
