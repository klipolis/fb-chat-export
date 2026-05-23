const fs = require('fs');
const path = require('path');
const { build } = require('esbuild');
const { version: projectVersion } = require('../../package.json');
const { getPlatformHeader, attachHeader } = require('../platforms/platformHeaders');

const sourcePath = path.resolve(__dirname, 'src', 'index.js');
const distDir = path.resolve(__dirname, '..', '..', 'dist');
const outputPath = path.join(distDir, 'app.js');
const minOutputPath = path.join(distDir, 'app.min.js');
const relOutputPath = './dist/app.js';
const relMinOutputPath = './dist/app.min.js';
const changelogPath = path.resolve(__dirname, '..', '..', 'CHANGELOG.md');
const buildPlatform = process.env.BUILD_PLATFORM || 'userscript';

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

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

const platformHeader = getPlatformHeader(buildPlatform, buildVersion);

async function bundleOutput(outputFile, minify) {
  await build({
    entryPoints: [sourcePath],
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    legalComments: 'none',
    minify,
    outfile: outputFile,
  });

  if (platformHeader) {
    attachHeader(outputFile, buildPlatform, buildVersion);
  }
}

(async () => {
  await bundleOutput(outputPath, false);
  await bundleOutput(minOutputPath, true);

  console.log(`Generated frontend bundle: ${relOutputPath} + ${relMinOutputPath} (${buildVersion})`);
})();
