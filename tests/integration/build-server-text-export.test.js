const tap = require('tap');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const { compareSnapshots } = require('../snapshot-helper');
const { resolveRepoPath } = require('../../src/shared/app-config');
const { chooseRule } = require('../../src/shared/rules');
const schemaConfig = require('../../src/shared/export-config.json');

const rawDir = resolveRepoPath('data-input-test');
const txtDir = resolveRepoPath('data-output-auto', 'final-export');
const jsonDir = resolveRepoPath('data-output-auto', 'json-format');
const optimizedDir = resolveRepoPath('data-output-auto', 'optimized-html');
let serverBuildCache = null;

tap.teardown(() => {
  if (serverBuildCache) {
    [txtDir, jsonDir, optimizedDir].forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
          fs.rmSync(path.join(dir, file), { recursive: true, force: true });
        });
      }
    });
  }
});

function runServerBuildOnce() {
  if (!serverBuildCache) {
    const buildResult = childProcess.spawnSync('node', ['src/build-server.cjs', '--force'], {
      encoding: 'utf8',
      cwd: resolveRepoPath(),
    });
    serverBuildCache = {
      ...buildResult,
      txtDir,
    };
  }
  return serverBuildCache;
}

// ---------------------------------------------------------------------------
// goldenTxtSnapshots
// ---------------------------------------------------------------------------

tap.test('goldenTxtSnapshots', (t) => {
  const build = runServerBuildOnce();
  t.equal(build.status, 0, `build-server failed: ${build.stderr || build.stdout}`);

  const variants = [
    { actual: 'export-max.txt', golden: 'export-max.txt' },
    { actual: 'export-minimal.txt', golden: 'export-minimal.txt' },
    { actual: 'export-summary-combined.txt', golden: 'export-summary-combined.txt' },
    { actual: 'export-summary-detailed.txt', golden: 'export-summary-detailed.txt' },
    { actual: 'export-summary-json.txt', golden: 'export-summary-json.txt' },
    { actual: 'export-raw-date.txt', golden: 'export-raw-date.txt' },
  ];

  variants.forEach(({ actual, golden }) => {
    const actualPath = path.join(txtDir, actual);
    const goldenPath = path.join(__dirname, '..', 'golden', golden);
    t.ok(fs.existsSync(actualPath), `${actual} TXT export missing for golden snapshot test`);
    t.ok(fs.existsSync(goldenPath), `Golden snapshot for ${golden} TXT missing`);
    compareSnapshots(actualPath, goldenPath, `${actual} TXT export differs from golden snapshot`);
  });

  t.end();
});

// ---------------------------------------------------------------------------
// buildServerTextExport
// ---------------------------------------------------------------------------

tap.test('buildServerTextExport', (t) => {
  const build = runServerBuildOnce();
  t.equal(build.status, 0, `build-server failed: ${build.stderr || build.stdout}`);

  t.ok(fs.existsSync(txtDir), 'data-output-auto/final-export not created');
  const files = fs.readdirSync(txtDir);
  const sortedTxtFiles = files.filter((name) => name.endsWith('.txt')).sort();
  t.strictSame(
    sortedTxtFiles,
    [
      'export-max.txt',
      'export-minimal.txt',
      'export-raw-date.txt',
      'export-summary-combined.txt',
      'export-summary-detailed.txt',
      'export-summary-json.txt',
    ],
    'Expected six stable TXT export filenames'
  );

  const summaryCombinedPath = path.join(txtDir, 'export-summary-combined.txt');
  const summaryDetailedPath = path.join(txtDir, 'export-summary-detailed.txt');
  t.ok(fs.existsSync(summaryCombinedPath), 'Expected export-summary-combined.txt to be generated');
  t.ok(fs.existsSync(summaryDetailedPath), 'Expected export-summary-detailed.txt to be generated');
  t.ok(fs.existsSync(path.join(txtDir, 'export-summary-json.txt')), 'Expected export-summary-json.txt to be generated');

  const contentMax = fs.readFileSync(path.join(txtDir, 'export-max.txt'), 'utf8');
  const contentMinimal = fs.readFileSync(path.join(txtDir, 'export-minimal.txt'), 'utf8');
  const summaryTxt = fs.readFileSync(summaryCombinedPath, 'utf8');
  const summaryDetailedTxt = fs.readFileSync(summaryDetailedPath, 'utf8');

  t.ok(/\n\d+\s+posts\s*\/\s*\d+\s+days\n/.test(summaryTxt), 'Summary TXT should use posts for total summary');
  t.ok(/\nABC Summary\n\d+\s+post(?:s)?\s*\/\s*\d+\s+days\n/.test(summaryTxt), 'Summary TXT should use post/posts for ABC Summary');
  t.ok(/\nYoughurt Summary\n\d+\s+post(?:s)?\s*\/\s*\d+\s+days\n/.test(summaryTxt), 'Summary TXT should use post/posts for Youghurt Summary');

  const uniqueDays = new Set(
    contentMax
      .split(/\r?\n/)
      .filter((line) => /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/.test(line))
      .map((line) => line.slice(1, 11))
  ).size;
  t.ok(summaryTxt.includes(` / ${uniqueDays} days`), 'Summary TXT total days must reflect unique days across all messages');
  t.ok(summaryDetailedTxt.includes(` / ${uniqueDays} days`), 'Detailed summary TXT total days must reflect unique days across all messages');

  t.ok(contentMax.includes('Method: server'), 'export-max export should include the server method header');
  t.ok(contentMinimal.includes('Method: server'), 'export-minimal export should include the server method header');
  t.ok(contentMax.includes('Message types:'), 'export-max export should include a message types header');
  t.ok(contentMinimal.includes('Message types:'), 'export-minimal export should include a message types header');
  t.ok(contentMax.includes('\n---\n'), 'export-max export summary should end with ---');
  t.ok(contentMinimal.includes('\n---\n'), 'export-minimal export summary should end with ---');
  t.ok(contentMax.includes('\nTotal Summary\n'), 'export-max export should include a Total Summary block');
  t.ok(/\n\d+\s+(?:message|messages)\s*\/\s*\d+\s+(?:day|days)\n/.test(contentMax), 'export-max summary should include a total count line');
  t.ok(/\n~\s+\d+\s+text\s*\/\s*\d+\s+words\n/.test(contentMax), 'export-max summary should include combined rough text/words totals');
  t.ok(/\n~\s+\d+\s+images\n/.test(contentMax), 'export-max summary should include rough image totals');
  t.ok(/\n~\s+\d+\s+calls\s+\d{2}:\d{2}:\d{2}\n/.test(contentMax), 'export-max summary should include rough call totals');
  t.ok(/\nABC Summary\n/.test(contentMax), 'export-max summary should include ABC Summary section');
  t.ok(/\nYoughurt Summary\n/.test(contentMax), 'export-max summary should include Youghurt Summary section');
  t.ok(
    /\nABC Summary\n\d+\s+(?:message|messages)\s*\/\s*\d+\s+(?:day|days)\n~\s+\d+\s+text\s*\/\s*\d+\s+words\n~\s+\d+\s+images\n~\s+\d+\s+calls\s+\d{2}:\d{2}:\d{2}\n/.test(contentMax),
    'ABC Summary should mirror total summary list style'
  );
  t.ok(
    /\nYoughurt Summary\n\d+\s+(?:message|messages)\s*\/\s*\d+\s+(?:day|days)\n~\s+\d+\s+text\s*\/\s*\d+\s+words\n~\s+\d+\s+images\n~\s+\d+\s+calls\s+\d{2}:\d{2}:\d{2}\n/.test(contentMax),
    'Youghurt Summary should mirror total summary list style'
  );

  // Filename to schema type alias (mirrors getBaseSemanticTypes in build-server.cjs)
  const schemaAlias = {
    'call-video': 'video-call',
    'missed-call-audio': 'missed-call',
    'missed-call-video': 'missed-call',
  };

  const rawFiles = fs.readdirSync(rawDir).filter((name) => name.endsWith('.html'));
  rawFiles.forEach((fileName) => {
    const sample = path.parse(fileName).name;
    const rule = chooseRule(fileName);
    const canonicalType = rule ? rule.type : sample.replace(/-\d+$/, '');
    const schemaType = schemaAlias[sample] || sample.replace(/-\d+$/, '');
    if (schemaConfig.messageTypes.includes(schemaType)) {
      t.ok(contentMax.includes(`- ${schemaType}`), `export-max header should list ${fileName} as dashed item`);
      t.ok(contentMinimal.includes(`- ${schemaType}`), `export-minimal header should list ${fileName} as dashed item`);
    }
  });

  const bodyStartOn = contentMax.lastIndexOf('\n---\n');
  const bodyAfterSummary = bodyStartOn > -1 ? contentMax.slice(bodyStartOn + '\n---\n'.length) : contentMax;
  const bodyLinesOn = bodyAfterSummary
    .split(/\r?\n/)
    .filter((line) => /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]/.test(line));
  const bodyStartOff = contentMinimal.indexOf('\n---\n');
  const bodyAfterHeaderOff = bodyStartOff > -1 ? contentMinimal.slice(bodyStartOff + '\n---\n'.length) : contentMinimal;
  const bodyLinesOff = bodyAfterHeaderOff
    .split(/\r?\n/)
    .filter((line) => /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]/.test(line));

  t.equal(bodyLinesOn.length, rawFiles.length, 'export-max export should contain one message per raw file');
  t.equal(bodyLinesOff.length, rawFiles.length, 'export-minimal export should contain one message per raw file');

  const allMessageDayCount = new Set(
    bodyLinesOn
      .map((line) => {
        const m = line.match(/^\[(\d{4}-\d{2}-\d{2})\s\d{2}:\d{2}\]/);
        return m ? m[1] : null;
      })
      .filter(Boolean)
  ).size;

  t.ok(summaryTxt.includes('Total Summary'), 'Summary TXT should include Total Summary title');
  t.ok(summaryTxt.includes('---'), 'Summary TXT should include closing separator');
  t.ok(summaryTxt.includes(` / ${allMessageDayCount} `), 'Summary TXT should include total day count');
  t.ok(summaryDetailedTxt.includes('Total Summary'), 'Detailed summary TXT should include Total Summary title');
  t.ok(summaryDetailedTxt.includes('---'), 'Detailed summary TXT should include closing separator');
  t.ok(summaryDetailedTxt.includes(` / ${allMessageDayCount} `), 'Detailed summary TXT should include total day count');

  const summaryJsonPath = path.join(txtDir, 'export-summary-json.txt');
  const summaryJsonRaw = fs.readFileSync(summaryJsonPath, 'utf8');
  let summaryJson;
  try { summaryJson = JSON.parse(summaryJsonRaw); } catch (e) { /* empty on purpose */ }
  t.ok(summaryJson, 'Summary JSON export should be valid JSON');
  t.ok(summaryJson.total, 'Summary JSON should include total field');
  t.equal(summaryJson.total.title, 'Total Summary', 'Summary JSON total title should be Total Summary');
  t.equal(summaryJson.total.messages, allMessageDayCount ? bodyLinesOn.length : 0, 'Summary JSON total messages should match body line count');
  t.ok(Array.isArray(summaryJson.participants), 'Summary JSON should include participants array');
  t.ok(summaryJson.participants.length >= 2, 'Summary JSON participants should include at least 2 participants');

  const rawDatePath = path.join(txtDir, 'export-raw-date.txt');
  t.ok(fs.existsSync(rawDatePath), 'export-raw-date.txt export should exist');
  const contentRawDate = fs.readFileSync(rawDatePath, 'utf8');
  t.ok(contentRawDate.includes('Method: server'), 'export-raw-date export should include the server method header');
  t.ok(contentRawDate.includes('includeRawDate'), 'export-raw-date header should indicate raw date option');
  t.ok(contentRawDate.includes('\n---\n'), 'export-raw-date export should end with ---');
  const rawDateBodyLines = contentRawDate
    .split(/\r?\n/)
    .filter((line) => /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]/.test(line));
  t.equal(rawDateBodyLines.length, rawFiles.length, 'export-raw-date should contain one message per raw file');
  const rawDateShown = rawDateBodyLines.some((line) => /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]\s\([^)]+\)\s/.test(line));
  t.ok(rawDateShown, 'export-raw-date lines should include raw date in parentheses');

  const basePattern = /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]\s[^:]+:\s[^/]+(?:\s\/\s.*)?$/;
  t.ok(bodyLinesOn.every((line) => basePattern.test(line)), 'Each export-max line should match expected format');
  t.ok(bodyLinesOff.every((line) => basePattern.test(line)), 'Each export-minimal line should match expected format');

  rawFiles.forEach((fileName) => {
    const typeName = path.parse(fileName).name;
    const displayType = /^image(?:-\d+)?$/i.test(typeName) ? 'image' : typeName;
    t.ok(bodyLinesOn.some((line) => line.includes(` ${displayType}`)), `export-max body should include one line for ${fileName}`);
    t.ok(bodyLinesOff.some((line) => line.includes(` ${displayType}`)), `export-minimal body should include one line for ${fileName}`);
  });

  t.ok(bodyLinesOn.some((line) => line.includes('call-video') && /\d{2}:\d{2}:\d{2}/.test(line)), 'Video call lines should include duration in canonical format');
  t.ok(bodyLinesOn.some((line) => /\blink-text\b\s+\d+ words\s*\/\s*https?:\/\//i.test(line)), 'link-text line should include URL content in export-max export');
  t.ok(bodyLinesOn.some((line) => /\blink-embed-no-text\b\s*\/\s*https?:\/\//i.test(line)), 'link-embed-no-text line should include URL content in export-max export');
  t.ok(bodyLinesOn.some((line) => /\blink-text\b\s+\d+ words\s*\/\s*https?:\/\//i.test(line)), 'link-text lines with text should include word count');
  t.ok(bodyLinesOff.every((line) => !line.includes(' / ')), 'export-minimal export should not include slash-delimited content');

  const offTextLengthLine = bodyLinesOff.find((line) => /\btext\b\s+\d+ words(?:\s|$)/i.test(line));
  t.ok(offTextLengthLine, 'export-minimal export should include text content length when content is disabled');

  bodyLinesOn.forEach((line, idx) => {
    t.notOk(/[\r\n]/.test(line), `export-max line ${idx + 1} should be single-line text`);
  });
  bodyLinesOff.forEach((line, idx) => {
    t.notOk(/[\r\n]/.test(line), `export-minimal line ${idx + 1} should be single-line text`);
  });

  t.ok(bodyLinesOn.some((line) => line.includes('ABC')), 'export-max export should contain aliased sender names');
  t.ok(bodyLinesOff.some((line) => line.includes('ABC')), 'export-minimal export should contain aliased sender names');
  t.notOk(bodyLinesOn.some((line) => line.includes('Rob')), 'export-max body should not contain raw sender names');
  t.notOk(bodyLinesOff.some((line) => line.includes('Rob')), 'export-minimal body should not contain raw sender names');

  // link-video: URL must appear after / in export-max
  t.ok(bodyLinesOn.some((line) => /\blink-video\b\s*\/\s*https?:\/\//i.test(line)), 'link-video line in export-max should include URL after /');
  // link-video: no slash-content in export-minimal
  t.notOk(bodyLinesOff.some((line) => /\blink-video\b.*\s\/\s/i.test(line)), 'link-video line in export-minimal should not include content after /');

  // reactions: export-minimal lines should not include slash-delimited content for reaction type
  t.notOk(bodyLinesOff.some((line) => /\breaction\b.*\s\/\s/i.test(line)), 'reaction lines in export-minimal should not include content after /');
  // reactions: export-max lines should include emoji content after /
  t.ok(bodyLinesOn.some((line) => /\breaction\b.*\s\/\s/i.test(line)), 'reaction lines in export-max should include emoji content after /');
  // reactions: specific emoji characters appear in export-max output
  t.ok(bodyLinesOn.some((line) => line.includes('🥳')), 'reaction-emoji 🥳 appears in export-max TXT output');
  t.ok(bodyLinesOn.some((line) => line.includes('👍')), 'reaction 👍 appears in export-max TXT output');

  // text-2: full message in aria-label, colon in message body
  const text2Line = bodyLinesOn.find((l) => l.includes('text-2 ') && !l.includes('text-2-link'));
  t.ok(text2Line, 'export-max body includes text-2 line');
  t.ok(text2Line.includes('[2026-05-07 07:09]'), 'text-2 line has correct date');
  t.ok(text2Line.includes('Youghurt:'), 'text-2 line has aliased sender');
  t.ok(/text-2\s+\d+\s+words/.test(text2Line), 'text-2 line shows word count');
  t.ok(text2Line.includes('morning: 272'), 'text-2 line preserves colon in message body');
  t.ok(text2Line.includes('emails at ~4am.'), 'text-2 line contains full message text');

  t.end();
});

// ---------------------------------------------------------------------------
// textExportDurationNormalization
// ---------------------------------------------------------------------------

tap.test('textExportDurationNormalization', (t) => {
  const build = runServerBuildOnce();
  t.equal(build.status, 0, `build-server failed: ${build.stderr || build.stdout}`);
  const contentOnPath = path.join(txtDir, 'export-max.txt');
  const contentOffPath = path.join(txtDir, 'export-minimal.txt');

  t.ok(fs.existsSync(contentOnPath), 'export-max TXT export should exist');
  t.ok(fs.existsSync(contentOffPath), 'export-minimal TXT export should exist');

  const contentOn = fs.readFileSync(contentOnPath, 'utf8');
  const contentOff = fs.readFileSync(contentOffPath, 'utf8');

  const bodyStartOn = contentOn.lastIndexOf('\n---\n');
  const bodyAfterSummary = bodyStartOn > -1 ? contentOn.slice(bodyStartOn + '\n---\n'.length) : contentOn;
  const bodyStartOff = contentOff.indexOf('\n---\n');
  const bodyAfterHeaderOff = bodyStartOff > -1 ? contentOff.slice(bodyStartOff + '\n---\n'.length) : contentOff;

  const bodyLinesOn = bodyAfterSummary
    .split(/\r?\n/)
    .filter((line) => /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]/.test(line));
  const bodyLinesOff = bodyAfterHeaderOff
    .split(/\r?\n/)
    .filter((line) => /^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\]/.test(line));

  bodyLinesOn.forEach((line, idx) => {
    const contentPart = line.substring(line.indexOf('] ') + 2);
    const hms = contentPart.match(/\b(\d{2}:\d{2}:\d{2})\b/);
    if (hms) {
      t.ok(
        /^\d{2}:\d{2}:\d{2}$/.test(hms[1]),
        `Line ${idx + 1} in export-max should have normalized HH:MM:SS duration: ${line}`
      );
    }
  });

  bodyLinesOff.forEach((line, idx) => {
    const contentPart = line.substring(line.indexOf('] ') + 2);
    const hms = contentPart.match(/\b(\d{2}:\d{2}:\d{2})\b/);
    if (hms) {
      t.ok(
        /^\d{2}:\d{2}:\d{2}$/.test(hms[1]),
        `Line ${idx + 1} in export-minimal should have normalized HH:MM:SS duration: ${line}`
      );
    }
  });

  t.end();
});

// ---------------------------------------------------------------------------
// exportJsonFull
// ---------------------------------------------------------------------------

tap.test('exportJsonFull', (t) => {
  const build = runServerBuildOnce();
  t.equal(build.status, 0, `build-server failed: ${build.stderr || build.stdout}`);

  const jsonPath = path.join(txtDir, 'export-json-full.json');
  t.ok(fs.existsSync(jsonPath), 'export-json-full.json should exist');

  const raw = fs.readFileSync(jsonPath, 'utf8');
  let data;
  try { data = JSON.parse(raw); } catch (e) { t.fail('export-json-full.json should be valid JSON'); }

  t.ok(data, 'Parsed JSON should be truthy');
  t.type(data.exportDate, 'string', 'exportDate should be a string');
  t.type(data.conversation, 'string', 'conversation should be a string');
  t.type(data.messageCount, 'number', 'messageCount should be a number');
  t.ok(Array.isArray(data.participants), 'participants should be an array');
  t.ok(Array.isArray(data.messages), 'messages should be an array');
  t.equal(data.messageCount, data.messages.length, 'messageCount should match messages.length');

  if (data.messages.length > 0) {
    const first = data.messages[0];
    t.type(first.date, 'string', 'first message date should be a string');
    t.type(first.sender, 'string', 'first message sender should be a string');
    t.type(first.type, 'string', 'first message type should be a string');
    t.type(first.text, 'string', 'first message text should be a string');
    t.type(first.duration, 'string', 'first message duration should be a string');
    t.type(first.durationSeconds, 'number', 'first message durationSeconds should be a number');
    t.type(first.isCall, 'boolean', 'first message isCall should be a boolean');
    t.type(first.isImage, 'boolean', 'first message isImage should be a boolean');
    t.type(first.contentLength, 'number', 'first message contentLength should be a number');
    t.type(first.wordCount, 'number', 'first message wordCount should be a number');
  }

  t.end();
});
