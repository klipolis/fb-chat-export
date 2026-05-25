#!/usr/bin/env node
'use strict';

/**
 * Pre-commit guard: CHANGELOG.md must have a non-empty [Unreleased] section.
 * A non-empty section means at least one non-blank, non-heading line below
 * `## [Unreleased]` before the next `## ` heading or end of file.
 */

const fs = require('fs');
const { changelogPath } = require('../src/shared/app-config');

if (!fs.existsSync(changelogPath)) {
  console.error('check-unreleased: CHANGELOG.md not found');
  process.exit(1);
}

const lines = fs.readFileSync(changelogPath, 'utf8').split('\n');

const startIdx = lines.findIndex((l) => /^##\s+\[Unreleased\]/i.test(l));
if (startIdx === -1) {
  console.error(
    'check-unreleased: CHANGELOG.md has no [Unreleased] section.\n' +
      'Add a "## [Unreleased]" heading at the top of the changelog before committing.'
  );
  process.exit(1);
}

// Collect lines between [Unreleased] and the next ## heading
const body = [];
for (let i = startIdx + 1; i < lines.length; i++) {
  if (/^##\s/.test(lines[i])) break;
  body.push(lines[i]);
}

const hasContent = body.some((l) => l.trim() !== '' && !/^###/.test(l.trim()));
if (!hasContent) {
  console.error(
    'check-unreleased: The [Unreleased] section in CHANGELOG.md is empty.\n' +
      'Document your changes under "## [Unreleased]" before committing.'
  );
  process.exit(1);
}

console.log('check-unreleased: [Unreleased] section OK');
