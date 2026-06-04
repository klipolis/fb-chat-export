const fs = require('fs');
const { build } = require('esbuild');
const { version: projectVersion } = require('../../package.json');
const { getPlatformHeader, attachHeader } = require('../platforms/platformHeaders');
const { resolveRepoPath, changelogPath } = require('../shared/app-config');

const sourcePath = resolveRepoPath('src', 'frontend', 'src', 'index.js');
const distDir = resolveRepoPath('dist');
const outputPath = resolveRepoPath('dist', 'app.js');
const minOutputPath = resolveRepoPath('dist', 'app.min.js');
const relOutputPath = './dist/app.js';
const relMinOutputPath = './dist/app.min.js';
const buildPlatform = process.env.BUILD_PLATFORM || 'userscript';
const buildWatch = process.env.BUILD_WATCH === 'true';

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
  const config = {
    entryPoints: [sourcePath],
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    legalComments: 'none',
    minify,
    outfile: outputFile,
  };

  if (buildWatch) {
    config.watch = {
      onRebuild(error) {
        if (error) {
          console.error(`Watch build failed for ${outputFile}:`, error.message);
        } else {
          console.log(`Watch build succeeded: ${outputFile}`);
          if (platformHeader) {
            attachHeader(outputFile, buildPlatform, buildVersion);
          }
        }
      },
    };
  }

  await build(config);

  if (platformHeader) {
    attachHeader(outputFile, buildPlatform, buildVersion);
  }
}

(async () => {
  if (buildWatch) {
    console.log('Starting frontend build in watch mode...');
    await bundleOutput(outputPath, false);
    console.log(`Watching for changes — ${relOutputPath}`);
    return;
  }

  await bundleOutput(outputPath, false);
  await bundleOutput(minOutputPath, true);

  console.log(`Generated frontend bundle: ${relOutputPath} + ${relMinOutputPath} (${buildVersion})`);
})();
