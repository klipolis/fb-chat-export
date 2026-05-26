const fs = require('fs');
const { packagePath: packageJsonPath } = require('../src/shared/app-config');

const FIX_FLAGS = ['--self-heal', '--fix'];
const isFix = process.argv.some((arg) => FIX_FLAGS.includes(arg));

function fail(message) {
  console.error(`package.json lint failed: ${message}`);
  process.exit(1);
}

function readPackageJson() {
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    fail(`Unable to read or parse package.json at ${packageJsonPath}: ${error.message}`);
  }
}

function reorderPackageKeys(packageData) {
  const expectedOrder = [
    'name',
    'type',
    'version',
    'license',
    'engines',
    'packageManager',
    'pnpm',
    'private',
    'scripts',
    'devDependencies',
    'dependencies',
  ];

  const actualKeys = Object.keys(packageData);
  const extraKeys = actualKeys.filter((key) => !expectedOrder.includes(key)).sort((a, b) =>
    a.localeCompare(b, 'en', { numeric: true }),
  );
  const orderedKeys = [
    ...expectedOrder.filter((key) => key in packageData),
    ...extraKeys,
  ];

  return orderedKeys.reduce((ordered, key) => {
    ordered[key] = packageData[key];
    return ordered;
  }, {});
}

function reorderScripts(scripts) {
  return Object.keys(scripts)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .reduce((ordered, key) => {
      ordered[key] = scripts[key];
      return ordered;
    }, {});
}

function validateSortedKeys(packageData, fix = false) {
  const actualKeys = Object.keys(packageData);
  const expectedOrder = [
    'name',
    'type',
    'version',
    'license',
    'engines',
    'packageManager',
    'pnpm',
    'private',
    'scripts',
    'devDependencies',
    'dependencies',
  ];

  const extraKeys = actualKeys.filter((key) => !expectedOrder.includes(key));
  const expectedKeys = [
    ...expectedOrder.filter((key) => key in packageData),
    ...extraKeys.sort((a, b) => a.localeCompare(b, 'en', { numeric: true })),
  ];

  if (!actualKeys.every((key, index) => key === expectedKeys[index])) {
    if (fix) {
      return reorderPackageKeys(packageData);
    }

    fail(
      'package.json root keys must appear in this order: name, type, version, license, engines, packageManager, pnpm, private, scripts, devDependencies, dependencies.',
    );
  }

  return packageData;
}

function validateSortedScripts(scripts, fix = false) {
  const actualScriptKeys = Object.keys(scripts);
  const sortedScriptKeys = [...actualScriptKeys].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  if (!actualScriptKeys.every((key, index) => key === sortedScriptKeys[index])) {
    if (fix) {
      return reorderScripts(scripts);
    }

    fail('package.json scripts must be sorted alphabetically.');
  }

  return scripts;
}

function writePackageJson(packageData) {
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageData, null, 2)}\n`, 'utf8');
}

(function main() {
  let packageData = readPackageJson();

  packageData = validateSortedKeys(packageData, isFix);

  if (!packageData.scripts || typeof packageData.scripts !== 'object') {
    fail('package.json must contain a scripts object.');
  }

  packageData.scripts = validateSortedScripts(packageData.scripts, isFix);

  if (isFix) {
    writePackageJson(packageData);
    console.log('✔ package.json self-healed: root keys and scripts reordered.');
    return;
  }

  console.log('✔ package.json keys and scripts are sorted alphabetically.');
})();
