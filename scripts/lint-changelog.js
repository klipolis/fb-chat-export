'use strict';

const fs = require('fs');
const path = require('path');

const changelogPath = path.resolve(__dirname, '..', 'CHANGELOG.md');
const text = fs.readFileSync(changelogPath, 'utf8');
const lines = text.split('\n');

// Phrases that describe retention rather than active change
const passivePatterns = [
  /\bkept\b/i,
  /\bpreserved\b/i,
  /\bretained\b/i,
  /\bunchanged\b/i,
  /\bcontinued tracking\b/i,
  /\bremains\b/i,
  /\bstill\b/i,
];

let failed = false;

lines.forEach((line, idx) => {
  // Only lint bullet entries, not headings or blank lines
  if (!line.trim().startsWith('-')) return;
  for (const pattern of passivePatterns) {
    if (pattern.test(line)) {
      console.error(`CHANGELOG.md:${idx + 1}: passive/retention language — "${line.trim()}"`);
      failed = true;
    }
  }
});

if (failed) {
  console.error('\nChangelog entries must describe active changes only.');
  console.error('Remove or rewrite entries that describe what was retained or left unchanged.');
  process.exit(1);
} else {
  console.log('Changelog lint passed.');
}
