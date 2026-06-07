const tap = require('tap');
const { JSDOM } = require('jsdom');
const { formatExportHeader, formatLine, buildExportText } = require(
  '../src/shared/export-formatter'
);
const { buildSummary } = require(
  '../src/shared/export-summary'
);
const { normalizeExportSender } = require(
  '../src/shared/export-text'
);
const { buildEntriesFromDocument, extractMessageEntry } = require(
  '../src/shared/export-text'
);

const referenceDate = '2026.05.15 00:00';

// ---------------------------------------------------------------------------
// browserExportDomRegression
// ---------------------------------------------------------------------------

tap.test('browserExportDomRegression', (t) => {
  const dom = new JSDOM(`
    <div aria-roledescription="message" aria-label="At April 17, 2026, 3:45 PM, You: Hello world">Hello world</div>
  `);
  const entries = buildEntriesFromDocument(dom.window.document, 'text.html', referenceDate);
  t.equal(entries.length, 1, 'Parses one message entry');

  const entry = entries[0];
  t.equal(entry.sender, 'Youghurt', 'Self-sender is normalized to Youghurt');
  t.equal(entry.semanticType, 'text', 'Message type resolve to text');
  t.equal(entry.dateText, '2026-04-17 15:45', 'Date text is normalized to ISO-friendly format');
  t.equal(entry.content, 'Hello world', 'Text content is preserved');

  const formattedLine = formatLine(entry, { includeContent: true, includeLength: true });
  t.equal(
    formattedLine,
    '[2026-04-17 15:45] Youghurt: text 2 words / Hello world\n',
    'Formatted browser line includes duration, length, and content'
  );

  t.end();
});

// ---------------------------------------------------------------------------
// normalizeExportSender — export-level sender name normalization
// ---------------------------------------------------------------------------

tap.test('normalizeExportSender', (t) => {
  t.equal(normalizeExportSender('You'), 'Youghurt', 'self-sender You becomes Youghurt');
  t.equal(normalizeExportSender('Yoghurt'), 'Yoghurt', 'Yoghurt passes through unchanged without hardcoded normalization');
  t.equal(normalizeExportSender('Alpha'), 'Alpha', 'known sender pass through unchanged');
  t.equal(normalizeExportSender(''), 'Unknown', 'empty sender becomes Unknown');
  t.equal(normalizeExportSender(null), 'Unknown', 'null sender becomes Unknown');
  t.equal(normalizeExportSender(undefined), 'Unknown', 'undefined sender becomes Unknown');
  t.equal(normalizeExportSender('John Smith'), 'John Smith', 'multi-word sender pass through unchanged');
  t.end();
});

// ---------------------------------------------------------------------------
// unicodeSenderImageInExport
// ---------------------------------------------------------------------------

tap.test('unicodeSenderImageInExport', (t) => {
  const refDate = '2026.05.22 00:00';
  const testCases = [
    {
      label: 'At 10:15 AM, Ötten Bernő: 3 images',
      fileName: 'image-3.html',
      expectedSender: 'Ötten Bernő',
      expectedType: 'image',
    },
    {
      label: 'At 11:00 AM, Álvaro: photo sent',
      fileName: 'image.html',
      expectedSender: 'Álvaro',
      expectedType: 'image',
    },
    {
      label: 'At 12:00 PM, 王明: text message',
      fileName: 'text.html',
      expectedSender: '王明',
      expectedType: 'text',
    },
  ];

  testCases.forEach(({ label, fileName, expectedSender, expectedType }, i) => {
    const dom = new JSDOM(`<div aria-roledescription="message" aria-label="${label}">content</div>`);
    const entry = extractMessageEntry(
      dom.window.document.querySelector('[aria-roledescription="message"]'),
      fileName,
      refDate
    );
    t.equal(entry.sender, expectedSender, `case ${i}: Unicode sender resolves to ${expectedSender}`);
    t.equal(entry.semanticType, expectedType, `case ${i}: type resolves to ${expectedType} for ${fileName}`);
  });

  t.end();
});

// ---------------------------------------------------------------------------
// extractMessageEntrySender — sender name extraction in export pipeline
// ---------------------------------------------------------------------------

tap.test('extractMessageEntrySender', (t) => {
  const refDate = '2026.05.22 00:00';
  const testCases = [
    {
      label: 'At 10:15 AM, You: Hello world',
      expectedSender: 'Youghurt',
      expectedType: 'text',
    },
    {
      label: 'At 10:15 AM, Alpha: Hi there',
      expectedSender: 'Alpha',
      expectedType: 'text',
    },
    {
      label: 'At 10:15 AM, Invalid Name With Four Words: test',
      expectedSender: 'Invalid Name With Four Words',
      expectedType: 'text',
    },
    {
      label: 'At 10:15 AM, Alpha: test : test : test',
      expectedSender: 'Alpha',
      expectedType: 'text',
    },
    {
      label: 'Enter, Message sent Saturday 4:36am by Alpha',
      expectedSender: 'Alpha',
      expectedType: 'text',
    },
  ];

  testCases.forEach(({ label, expectedSender, expectedType }, i) => {
    const dom = new JSDOM(`<div aria-roledescription="message" aria-label="${label}">content</div>`);
    const entry = extractMessageEntry(
      dom.window.document.querySelector('[aria-roledescription="message"]'),
      'text.html',
      refDate
    );
    t.equal(entry.sender, expectedSender, `case ${i}: sender resolves to ${expectedSender}`);
    t.equal(entry.semanticType, expectedType, `case ${i}: type resolves to ${expectedType}`);
  });

  t.end();
});

// ---------------------------------------------------------------------------
// scanToExportIntegration — full pipeline: DOM → entries → summary → header → text
// ---------------------------------------------------------------------------

tap.test('scanToExportIntegration', (t) => {
  const dom = new JSDOM(`
    <div aria-roledescription="message" aria-label="At April 12, 2026, 1:23 PM, Alpha: audio call 18 mins"></div>
    <div aria-roledescription="message" aria-label="At April 14, 2026, 6:34 PM, Alpha: Well i didn't know about this">Well i didn't know about this</div>
    <div aria-roledescription="message" aria-label="At May 13, 2026, 7:51 PM, Alpha">
      <img alt="image" />
    </div>
  `);

  const entries = buildEntriesFromDocument(dom.window.document, 'text.html', referenceDate);
  t.equal(entries.length, 3, 'Parses three message entries');

  const summaryEntries = entries.map((e) => ({
    sender: e.sender,
    date: new Date(e.ts),
    type: e.semanticType,
    isCall: e.semanticType === 'audio-call' || e.semanticType === 'video-call' || e.semanticType === 'missed-call',
    isImage: e.semanticType === 'image',
    callMinutes: e.duration ? (Number(e.duration.match(/^(\d+):/)?.[1] || 0) * 60 + Number(e.duration.match(/:(\d{2})/)?.[1] || 0)) : 0,
    ts: e.ts,
  }));

  const messageTypes = [...new Set(entries.map((e) => e.semanticType))].sort();
  const header = formatExportHeader({ method: 'browser', messageTypes });
  t.ok(header.startsWith('Method: browser'), 'Header starts with method line');
  t.ok(header.includes('---'), 'Header includes separator');

  const summaryText = buildSummary(summaryEntries, { useMessageLabel: true });
  t.ok(summaryText.includes('Total Summary'), 'Summary includes Total Summary');
  t.ok(summaryText.includes('3 messages'), 'Total message count is 3');
  t.ok(summaryText.includes('Alpha Summary'), 'Alpha appears in summary');

  const lines = entries.map((e) =>
    formatLine(e, { includeContent: true, includeLength: true })
  );
  const fullText = buildExportText(lines, header + summaryText);

  t.ok(fullText.startsWith('Method: browser'), 'Full export starts with header');
  t.ok(fullText.includes('Total Summary'), 'Full export includes summary');
  t.ok(fullText.includes('[2026-04-14 18:34] Alpha:'), 'Full export includes dated message line');
  t.ok(fullText.includes("Well i didn't know about this"), 'Full export includes message content');

  t.end();
});
