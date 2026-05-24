const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packageJsonPath = path.join(root, 'package.json');

function fail(message) {
  console.error(`package.json lint failed: ${message}`);
  process.exit(1);
}

function readPackageJson() {
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    fail(`Unable to parse package.json: ${error.message}`);
  }
}

function validateKeyOrder(packageData) {
  const expectedKeys = [
    'name',
    'version',
    'private',
    'license',
    'packageManager',
    'scripts',
    'engines',
    'pnpm',
    'devDependencies',
  ];
  const actualKeys = Object.keys(packageData);
  expectedKeys.forEach((key, index) => {
    if (actualKeys[index] !== key) {
      fail(`Expected package.json key at position ${index + 1} to be '${key}', found '${actualKeys[index] || 'missing'}'.`);
    }
  });
  if (actualKeys.length !== expectedKeys.length) {
    const extras = actualKeys.slice(expectedKeys.length);
    fail(`Unexpected additional package.json keys: ${extras.join(', ')}`);
  }
}

function validateScriptsOrder(scripts) {
  const expectedOrder = [
    'build',
    'build:ci',
    'build:ci:frontend',
    'build:ci:server',
    'build:clean',
    'build:frontend',
    'build:preview',
    'build:raw',
    'build:raw-clean',
    'build:server',
    'check:license',
    'check:unreleased',
    'create:nodes',
    'format',
    'format:check',
    'lint',
    'lint:changelog',
    'lint:commits',
    'lint:docs',
    'lint:package',
    'lint:todos',
    'link:docs',
    'release',
    'release:check',
    'release:tag',
    'test',
    'test:integration',
    'test:unit',
    'validate:dist',
    'validate:generated-json',
    'validate:generated-txt',
    'validate:golden',
    'validate:release',
    'audit',
    'prepare',
  ];
  const actualScriptKeys = Object.keys(scripts);
  if (actualScriptKeys.length !== expectedOrder.length) {
    fail(`Expected ${expectedOrder.length} scripts, but found ${actualScriptKeys.length}.`);
  }
  expectedOrder.forEach((key, index) => {
    if (actualScriptKeys[index] !== key) {
      fail(`Expected script ${index + 1} to be '${key}', found '${actualScriptKeys[index] || 'missing'}'.`);
    }
  });
}

(function main() {
  const packageData = readPackageJson();
  validateKeyOrder(packageData);
  if (!packageData.scripts || typeof packageData.scripts !== 'object') {
    fail('package.json must contain a scripts object.');
  }
  validateScriptsOrder(packageData.scripts);
  console.log('✔ package.json is valid and ordered.');
})();
