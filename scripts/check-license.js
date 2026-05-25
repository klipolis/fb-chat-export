'use strict';

// Checks that the SPDX license identifier in package.json matches the LICENSE file.
const fs = require('fs');
const { packagePath, licensePath } = require('../src/shared/app-config');

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const licenseText = fs.readFileSync(licensePath, 'utf8');

const declared = (pkg.license || '').toUpperCase().trim();
if (!declared) {
  console.error('check-license: no "license" field in package.json');
  process.exit(1);
}

// Map common SPDX identifiers to expected header text in the LICENSE file
const headerMap = {
  MIT: 'MIT License',
  'APACHE-2.0': 'Apache License',
  'GPL-3.0': 'GNU GENERAL PUBLIC LICENSE',
  'ISC': 'ISC License',
};

const expected = headerMap[declared];
if (!expected) {
  // Unknown type — just verify the file exists and is non-empty
  if (licenseText.trim().length > 0) {
    console.log(`check-license: LICENSE file present (type "${declared}" not validated by header check).`);
    process.exit(0);
  }
  console.error('check-license: LICENSE file is empty.');
  process.exit(1);
}

if (!licenseText.includes(expected)) {
  console.error(`check-license: package.json declares "${declared}" but LICENSE file does not contain "${expected}".`);
  process.exit(1);
}

console.log(`check-license: OK (${declared})`);
