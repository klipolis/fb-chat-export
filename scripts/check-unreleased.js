#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { changelogPath } = require('../src/shared/app-config');

const FIX_FLAGS = ['--self-heal', '--fix'];
const isFix = process.argv.some((arg) => FIX_FLAGS.includes(arg));

if (!fs.existsSync(changelogPath)) {
  console.error('check-unreleased: CHANGELOG.md not found');
  process.exit(1);
}

const lines = fs.readFileSync(changelogPath, 'utf8').split('\n');
const startIdx = lines.findIndex((l) => /^##\s+\[Unreleased\]/i.test(l));

function writeChangelog(updatedLines) {
  fs.writeFileSync(changelogPath, `${updatedLines.join('\n')}\n`, 'utf8');
}

if (startIdx === -1) {
  const insertion = ['## [Unreleased]', '', '- TODO: add release notes here', ''];
  if (isFix) {
    writeChangelog([...insertion, ...lines]);
    console.log('check-unreleased: added missing [Unreleased] section to CHANGELOG.md');
    process.exit(0);
  }

  console.error(
    'check-unreleased: CHANGELOG.md has no [Unreleased] section.\n' +
      'Add a "## [Unreleased]" heading at the top of the changelog before committing.'
  );
  process.exit(1);
}

const body = [];
let bodyEnd = lines.length;
for (let i = startIdx + 1; i < lines.length; i += 1) {
  if (/^##\s/.test(lines[i])) {
    bodyEnd = i;
    break;
  }
  body.push(lines[i]);
}

const hasContent = body.some((l) => l.trim() !== '' && !/^###/.test(l.trim()));
if (!hasContent) {
  if (isFix) {
    const insertAt = startIdx + 1;
    const updatedLines = [...lines];
    if (updatedLines[insertAt] && updatedLines[insertAt].trim() !== '') {
      updatedLines.splice(insertAt, 0, '');
    }
    updatedLines.splice(insertAt, 0, '- TODO: add release notes here', '');
    writeChangelog(updatedLines);
    console.log('check-unreleased: added placeholder content to [Unreleased] section.');
    process.exit(0);
  }

  console.error(
    'check-unreleased: The [Unreleased] section in CHANGELOG.md is empty.\n' +
      'Document your changes under "## [Unreleased]" before committing.'
  );
  process.exit(1);
}

console.log('check-unreleased: [Unreleased] section OK');
