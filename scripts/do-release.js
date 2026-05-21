#!/usr/bin/env node
'use strict';

/**
 * Release automation: renames ## [Unreleased] in CHANGELOG.md to the new
 * version heading, inserts a fresh ## [Unreleased] at the top, and bumps
 * package.json version.
 *
 * Version bump logic:
 *   - Any ### Added or ### Changed entry under [Unreleased] → minor bump
 *   - Only ### Fixed (or ### Dev) entries → patch bump
 *
 * Usage:
 *   node scripts/do-release.js          # auto-calculates bump
 *   node scripts/do-release.js patch    # force patch
 *   node scripts/do-release.js minor    # force minor
 *   node scripts/do-release.js major    # force major
 *   node scripts/do-release.js --dry-run  # preview without writing
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const changelogPath = path.join(root, 'CHANGELOG.md');
const packagePath = path.join(root, 'package.json');

// ---------------------------------------------------------------------------
// Read files
// ---------------------------------------------------------------------------

const changelog = fs.readFileSync(changelogPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// ---------------------------------------------------------------------------
// Find [Unreleased] section
// ---------------------------------------------------------------------------

const lines = changelog.split('\n');
const unreleasedIdx = lines.findIndex((l) => /^##\s+\[Unreleased\]/i.test(l));

if (unreleasedIdx === -1) {
  console.error('do-release: CHANGELOG.md has no [Unreleased] section.');
  process.exit(1);
}

// Collect the body under [Unreleased]
const bodyLines = [];
for (let i = unreleasedIdx + 1; i < lines.length; i++) {
  if (/^##\s/.test(lines[i])) break;
  bodyLines.push(lines[i]);
}

const bodyText = bodyLines.join('\n');
const hasContent = bodyLines.some((l) => l.trim() !== '' && !/^###/.test(l.trim()));

if (!hasContent) {
  console.error('do-release: [Unreleased] section is empty — nothing to release.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Determine version bump
// ---------------------------------------------------------------------------

const args = process.argv.slice(2).filter((a) => a !== '--dry-run');
const dryRun = process.argv.includes('--dry-run');
const forceBump = args[0];
let bumpType;

if (forceBump && ['patch', 'minor', 'major'].includes(forceBump)) {
  bumpType = forceBump;
} else {
  const hasAddedOrChanged = /^###\s+(Added|Changed)\b/im.test(bodyText);
  bumpType = hasAddedOrChanged ? 'minor' : 'patch';
}

const [major, minor, patch] = pkg.version.split('.').map(Number);
let newVersion;
if (bumpType === 'major') newVersion = `${major + 1}.0.0`;
else if (bumpType === 'minor') newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

// ---------------------------------------------------------------------------
// Build today's date
// ---------------------------------------------------------------------------

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const dateStr = `${yyyy}-${mm}-${dd}`;

const newHeading = `## v${newVersion} (${dateStr})`;

// ---------------------------------------------------------------------------
// Rewrite CHANGELOG
// ---------------------------------------------------------------------------

// Find the end of [Unreleased] block (start of next ## heading)
let nextHeadingIdx = lines.length;
for (let i = unreleasedIdx + 1; i < lines.length; i++) {
  if (/^##\s/.test(lines[i])) {
    nextHeadingIdx = i;
    break;
  }
}

const before = lines.slice(0, unreleasedIdx);
const releasedBlock = [newHeading, ...lines.slice(unreleasedIdx + 1, nextHeadingIdx)];
const after = lines.slice(nextHeadingIdx);

const freshUnreleased = ['## [Unreleased]', ''];

const newLines = [...before, ...freshUnreleased, '', ...releasedBlock, ...after];
fs.writeFileSync(changelogPath, newLines.join('\n'), 'utf8');
console.log(`do-release: CHANGELOG.md — [Unreleased] → ${newHeading}`);

// ---------------------------------------------------------------------------
// Bump package.json
// ---------------------------------------------------------------------------

pkg.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`do-release: package.json — version → ${newVersion}`);

// ---------------------------------------------------------------------------
// Next steps
// ---------------------------------------------------------------------------

console.log('');
console.log('Next steps:');
console.log(`  1. pnpm run build:frontend`);
console.log(`  2. pnpm run validate:dist`);
console.log(`  3. git add CHANGELOG.md package.json dist/`);
console.log(`  4. git commit -m "chore: release v${newVersion}"`);
console.log(`  5. pnpm run release:tag`);
