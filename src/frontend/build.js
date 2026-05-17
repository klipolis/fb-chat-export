const fs = require('fs');
const path = require('path');
const { build } = require('esbuild');
const { version: projectVersion } = require('../../package.json');

const sourcePath = path.resolve(__dirname, 'src', 'index.js');
const distDir = path.resolve(__dirname, '..', '..', 'dist');
const outputPath = path.join(distDir, 'app.js');
const relOutputPath = './dist/app.js';
const changelogPath = path.resolve(__dirname, '..', '..', 'CHANGELOG.md');
const buildPlatform = process.env.BUILD_PLATFORM || 'userscript';

const platformHeaders = {
  userscript: [
    '// ==UserScript==',
    '// @name         Chat Exporter',
    '// @namespace    http://tampermonkey.net/',
    '// @version      %VERSION%',
    '// @description  Export chat conversations to text file',
    '// @match        https://www.facebook.com/messages/*',
    '// @grant        none',
    '// ==/UserScript==',
  ].join('\n'),
};

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const sourceContent = fs.readFileSync(sourcePath, 'utf8');
const platformHeaderRegex = /^((?:\/\/[^\n]*\n)+)\s*\n/;
const trimmedContent = sourceContent.replace(platformHeaderRegex, '').trimStart();

function parseChangelogVersion(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const changelog = fs.readFileSync(filePath, 'utf8');
  const match = changelog.match(/^##\s+v(\d+\.\d+\.\d+)/m);
  return match ? match[1] : null;
}

const changelogVersion = parseChangelogVersion(changelogPath);
const buildVersion =
  process.env.BUILD_VERSION ||
  changelogVersion ||
  projectVersion ||
  `0.0.0-build.${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}`;

const headerBanner =
  buildPlatform in platformHeaders
    ? platformHeaders[buildPlatform].replace('%VERSION%', buildVersion) + '\n\n'
    : '';

(async () => {
  await build({
    stdin: {
      contents: trimmedContent,
      resolveDir: path.dirname(sourcePath),
      sourcefile: sourcePath,
    },
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    legalComments: 'none',
    minify: true,
    banner: {
      js: headerBanner,
    },
    outfile: outputPath,
  });

  console.log(`Generated frontend bundle: ${relOutputPath} (${buildVersion})`);
})();
