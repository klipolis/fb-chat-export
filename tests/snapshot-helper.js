const fs = require('fs');
const assert = require('assert');

function readSnapshot(filePath) {
  assert.ok(fs.existsSync(filePath), `Snapshot file missing: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function createSimpleDiff(expected, actual) {
  const expectedLines = expected.split(/\r?\n/);
  const actualLines = actual.split(/\r?\n/);
  const maxLines = Math.max(expectedLines.length, actualLines.length);
  const diffLines = [];

  for (let i = 0; i < maxLines; i += 1) {
    const expectedLine = expectedLines[i] ?? '';
    const actualLine = actualLines[i] ?? '';
    if (expectedLine !== actualLine) {
      diffLines.push(`Line ${i + 1}:`);
      diffLines.push(`  expected: ${expectedLine}`);
      diffLines.push(`  actual:   ${actualLine}`);
      break;
    }
  }

  return diffLines.join('\n');
}

function compareSnapshots(actualPath, goldenPath, message) {
  const actual = readSnapshot(actualPath);
  const golden = readSnapshot(goldenPath);

  if (actual === golden) return;

  const diff = createSimpleDiff(golden, actual);
  throw new Error(
    `${message}\nGolden: ${goldenPath}\nActual: ${actualPath}${diff ? `\n${diff}` : ''}`
  );
}

module.exports = {
  compareSnapshots,
};
