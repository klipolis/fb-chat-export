const fs = require('fs');
const path = require('path');
const { build } = require('esbuild');
const { version: projectVersion } = require('../../../package.json');

const sourcePath = path.resolve(__dirname, '..', 'src', 'userscript-export-message.js');
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
const buildVersion =
  process.env.BUILD_VERSION ||
  `${projectVersion}-build.${new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14)}`;
const versionedHeader = header
  ? header.replace(/(^\/\/\s*@version\s+).*$/m, `$1${buildVersion}`)
  : `// ==UserScript==\n// @version      ${buildVersion}\n// ==/UserScript==\n\n`;

(async () => {
  await build({
    stdin: {
      contents: body,
      resolveDir: path.dirname(sourcePath),
      sourcefile: sourcePath,
    },
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    legalComments: 'none',
    minify: true,
    banner: {
      js: `${versionedHeader}\n\n`,
    },
    outfile: outputPath,
  });

  console.log(`Generated userscript: ${relOutputPath} (${buildVersion})`);
})();
