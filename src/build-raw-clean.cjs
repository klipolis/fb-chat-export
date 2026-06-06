/**
 * build-raw-clean
 *
 * Strips platform-internal styling tokens from raw HTML files in
 * data-input-test/ without running full optimisation.
 *
 * What is removed:
 *  - class tokens that start with "x" (generated utility classes)
 *  - class attributes left empty after token removal
 *  - inline style attributes
 *
 * What is preserved:
 *  - all element structure and content
 *  - aria-label, aria-roledescription, alt, src, href, data-* attributes
 *  - any class tokens that do not start with "x"
 */

'use strict';

const fs = require('fs');
const { fatal } = require('./shared/error-utils');
const { resolveRepoPath } = require('./shared/app-config');
const { cleanXClasses } = require('./shared/html-utils');

const rawDir = resolveRepoPath('data-input-test');

function main() {
  if (!fs.existsSync(rawDir)) {
    fatal('Missing raw HTML folder: ' + rawDir);
  }

  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.html'));
  if (!files.length) {
    console.log('No HTML files found in', rawDir);
    return;
  }

  let changed = 0;
  for (const file of files) {
    const filePath = resolveRepoPath('data-input-test', file);
    const original = fs.readFileSync(filePath, 'utf8');
    const cleaned = cleanXClasses(original);
    if (cleaned !== original) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      changed += 1;
      console.log(`Cleaned: ${file}`);
    }
  }

  if (changed === 0) {
    console.log('All raw HTML files already clean (no x-classes or inline styles found).');
  } else {
    console.log(`Done: ${changed} file(s) updated in ./data-input-test`);
  }
}

try {
  main();
} catch (err) {
  fatal(`build-raw-clean failed: ${err.message}`);
}
