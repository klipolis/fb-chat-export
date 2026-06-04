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
const { resolveRepoPath } = require('./shared/app-config');

const rawDir = resolveRepoPath('data-input-test');

function cleanXClasses(html) {
  // Remove inline style attributes
  let result = html.replace(/\s+style="[^"]*"/gi, '');

  // Strip x-prefixed tokens from class attributes; remove attr if empty
  result = result.replace(/\sclass="([^"]*)"/gi, (_, tokens) => {
    const kept = tokens
      .trim()
      .split(/\s+/)
      .filter((t) => t && !t.startsWith('x'));
    return kept.length ? ` class="${kept.join(' ')}"` : '';
  });

  return result;
}

function main() {
  if (!fs.existsSync(rawDir)) {
    console.error('Missing raw HTML folder:', rawDir);
    process.exit(1);
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

main();
