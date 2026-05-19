'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const goldenDir = path.join(__dirname, 'golden');
const files = fs.readdirSync(goldenDir).filter((f) => f.endsWith('.txt'));

assert.ok(files.length > 0, 'No golden snapshot files found in tests/golden/');

for (const file of files) {
  const filePath = path.join(goldenDir, file);
  const raw = fs.readFileSync(filePath);

  // Must be valid UTF-8 (round-trip check)
  const text = raw.toString('utf8');
  const reEncoded = Buffer.from(text, 'utf8');
  assert.ok(
    raw.equals(reEncoded),
    `Golden file ${file} is not valid UTF-8`
  );

  // Must not contain CRLF line endings
  assert.ok(
    !raw.includes(Buffer.from('\r\n')),
    `Golden file ${file} contains CRLF line endings (expected LF only)`
  );

  // Must not end with trailing whitespace on any line
  const lines = text.split('\n');
  const trailingWsLine = lines.findIndex((l) => /[^\S\n]$/.test(l));
  assert.strictEqual(
    trailingWsLine,
    -1,
    `Golden file ${file} has trailing whitespace on line ${trailingWsLine + 1}: ${JSON.stringify(lines[trailingWsLine])}`
  );
}

console.log(`validate:golden — ${files.length} golden snapshot file(s) OK`);
