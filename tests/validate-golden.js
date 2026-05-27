const tap = require('tap');
const fs = require('fs');
const path = require('path');

const goldenDir = path.join(__dirname, 'golden');

tap.test('validate golden snapshot files', (t) => {
  const files = fs.readdirSync(goldenDir).filter((f) => f.endsWith('.txt'));
  t.ok(files.length > 0, 'No golden snapshot files found in tests/golden/');

  for (const file of files) {
    const filePath = path.join(goldenDir, file);
    const raw = fs.readFileSync(filePath);

    const text = raw.toString('utf8');
    const reEncoded = Buffer.from(text, 'utf8');
    t.ok(raw.equals(reEncoded), `Golden file ${file} is valid UTF-8`);

    t.ok(!raw.includes(Buffer.from('\r\n')), `Golden file ${file} contains CRLF line endings (expected LF only)`);

    const lines = text.split('\n');
    const trailingWsLine = lines.findIndex((l) => /[^\S\n]$/.test(l));
    t.equal(
      trailingWsLine,
      -1,
      `Golden file ${file} has trailing whitespace on line ${trailingWsLine + 1}: ${JSON.stringify(lines[trailingWsLine])}`
    );
  }

  t.end();
});
