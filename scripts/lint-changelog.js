'use strict';

const fs = require('fs');
const { changelogPath } = require('../src/shared/app-config');

const text = fs.readFileSync(changelogPath, 'utf8');
const lines = text.split('\n');

const nowPattern = /^\s*-\s*now\b/i;
const preservationPatterns = [
  /\bkept\b/i,
  /\bpreserved\b/i,
  /\bretained\b/i,
];
// Phrases that describe retention rather than active change
const passivePatterns = [
  ...preservationPatterns,
  /\bunchanged\b/i,
  /\bcontinued tracking\b/i,
  /\bremains\b/i,
  /\bstill\b/i,
];

const preservationExceptions = [
  /\bto be (kept|preserved|retained)\b/i,
  /\ballow.*to be (kept|preserved|retained)\b/i,
];

let failed = false;

const unreleasedStart = lines.findIndex((line) => line.startsWith('## [Unreleased]'));
const unreleasedEnd = lines.findIndex(
  (line, idx) => idx > unreleasedStart && /^##\s+/.test(line)
);
const scanStart = unreleasedStart === -1 ? 0 : unreleasedStart + 1;
const scanEnd = unreleasedEnd === -1 ? lines.length : unreleasedEnd;

for (let idx = scanStart; idx < scanEnd; idx += 1) {
  const line = lines[idx];
  if (!line.trim().startsWith('-')) continue;
  if (nowPattern.test(line)) {
    console.error(`CHANGELOG.md:${idx + 1}: avoid changelog-style phrasing starting with 'now' in [Unreleased] — "${line.trim()}"`);
    failed = true;
  }
  const isPreservationException = preservationExceptions.some((pat) => pat.test(line));
  for (const pattern of passivePatterns) {
    if (pattern.test(line)) {
      if (isPreservationException && preservationPatterns.some((preservationPattern) => preservationPattern.source === pattern.source)) {
        continue;
      }
      console.error(`CHANGELOG.md:${idx + 1}: passive/retention language — "${line.trim()}"`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('\nChangelog entries must describe active changes only.');
  console.error('Rewrite [Unreleased] bullets in direct present-tense action statements and avoid retrospective wording.');
  process.exit(1);
} else {
  console.log('Changelog lint passed.');
}
