const tap = require('tap');
const { formatExportHeader, formatLine, buildExportText, formatSummarySection } = require(
  '../src/shared/export-formatter'
);
const { buildSummary } = require(
  '../src/shared/export-summary'
);
const { formatServerExportFileName } = require(
  '../src/shared/export-text'
);

// ---------------------------------------------------------------------------
// browserExportFormatting
// ---------------------------------------------------------------------------

tap.test('browserExportFormatting', (t) => {
  const header = formatExportHeader({
    method: 'browser',
    messageTypes: ['text', 'image'],
    exportOptions: { content: true, rawLink: true },
    aliasMap: { You: 'Youghurt' },
  });
  t.ok(header.includes('Method: browser'), 'header includes method browser');
  t.ok(header.includes('- text'), 'header lists text message type');
  t.ok(header.includes('- image'), 'header lists image message type');
  t.ok(header.includes('Options:'), 'header includes Options line');
  t.ok(header.includes('Unused:'), 'header includes Unused line');
  t.ok(header.includes('Options: content, rawLink'), 'header includes active options');
  t.ok(header.includes('Aliases:'), 'header includes Aliases block');
  t.ok(header.includes('  You : Youghurt'), 'header includes alias entries');

  const formattedLine = formatLine(
    {
      fileType: 'text',
      semanticType: 'text',
      dateText: '2026-05-17 11:00',
      sender: 'Alpha',
      duration: '0:20 mins',
      content: 'Hello',
      contentLength: 5,
    },
    { includeContent: true, includeLength: true }
  );
  t.equal(
    formattedLine,
    '[2026-05-17 11:00] Alpha: text 00:00:20 5 / Hello\n',
    'Browser line formatting includes type, duration, length, and content'
  );

  const summary = buildSummary(
    [
      {
        sender: 'Alpha',
        date: new Date('2026-05-17T11:00:00Z'),
        type: 'text',
        isCall: false,
        isImage: false,
        callMinutes: 0,
      },
      {
        sender: 'Youghurt',
        date: new Date('2026-05-17T11:05:00Z'),
        type: 'image',
        isCall: false,
        isImage: true,
        callMinutes: 0,
      },
    ],
    { useMessageLabel: true }
  );
  t.ok(summary.includes('Total Summary'), 'Summary output includes Total Summary title');
  t.ok(
    summary.includes('1 message / 1 day'),
    'Summary output use message/day labels with useMessageLabel'
  );
  t.ok(summary.includes('Alpha Summary'), 'Summary output includes Alpha Summary');
  t.ok(summary.includes('Youghurt Summary'), 'Summary output includes Youghurt Summary');

  t.end();
});

// ---------------------------------------------------------------------------
// formatLine option combinations
// ---------------------------------------------------------------------------

tap.test('formatLineOptions', (t) => {
  const base = {
    fileType: 'text',
    semanticType: 'text',
    dateText: '2026-01-01 10:00',
    sender: 'Alice',
    content: 'Hello',
    contentLength: '5 chars',
  };

  const withBoth = formatLine(base, { includeContent: true, includeLength: true });
  t.ok(withBoth.includes('5 chars'), 'includes length when includeLength: true');
  t.ok(withBoth.includes('Hello'), 'includes content when includeContent: true');

  const noContent = formatLine(base, { includeContent: false, includeLength: true });
  t.notOk(noContent.includes('Hello'), 'omits content when includeContent: false');
  t.ok(noContent.includes('5 chars'), 'shows length when includeContent: false');

  const noLength = formatLine(base, { includeContent: true, includeLength: false });
  t.notOk(noLength.includes('5 chars'), 'omits length when includeLength: false');
  t.ok(noLength.includes('Hello'), 'shows content when includeLength: false');

  const neither = formatLine(base, { includeContent: false, includeLength: false });
  t.notOk(neither.includes('Hello'), 'omits content when neither option set');
  t.notOk(neither.includes('5 chars'), 'omits length when neither option set');

  t.end();
});

// ---------------------------------------------------------------------------
// buildSummary edge cases
// ---------------------------------------------------------------------------

tap.test('buildSummaryEdgeCases', (t) => {
  const empty = buildSummary([], { useMessageLabel: true });
  t.equal(typeof empty, 'string', 'buildSummary with empty array returns string');

  const singleMsg = buildSummary(
    [{ sender: 'Alice', date: new Date('2026-01-01'), type: 'text', isCall: false, isImage: false, callMinutes: 0, ts: Date.now() }],
    { useMessageLabel: true }
  );
  t.ok(singleMsg.includes('Alice'), 'single-participant summary includes sender name');

  const multiImageSummary = buildSummary(
    [
      { sender: 'Alice', date: new Date('2026-01-01'), type: 'image', isCall: false, isImage: true, imageCount: 4, ts: Date.now() },
    ],
    { useMessageLabel: true }
  );
  t.ok(multiImageSummary.includes('~ 4 images'), 'summary counts multiple images from one entry');

  const withFixed = buildSummary(
    [
      { sender: 'Alice', date: new Date('2026-01-01'), type: 'text', isCall: false, isImage: false, ts: Date.parse('2026-01-01T12:00:00Z') },
      { sender: 'Bob', date: new Date('2026-01-02'), type: 'text', isCall: false, isImage: false, ts: Date.parse('2026-01-02T12:00:00Z') },
    ],
    { fixedParticipants: ['Alice'] }
  );
  t.ok(withFixed.includes('Alice'), 'fixedParticipants summary includes filtered participant');
  t.notOk(withFixed.includes('Bob'), 'fixedParticipants summary excludes non-filtered participant');

  const summarySection = formatSummarySection(
    [
      {
        sender: 'Alice',
        date: Number(Date.parse('2026-01-01T12:00:00Z')),
        fileType: 'image-3',
        semanticType: 'image',
        imageCount: 4,
        ts: Date.now(),
      },
    ],
    { useMessageLabel: true }
  );
  t.ok(summarySection.includes('~ 4 images'), 'formatSummarySection preserves imageCount through summary conversion');
  t.end();
});

// ---------------------------------------------------------------------------
// formatExportHeaderAllTypes
// ---------------------------------------------------------------------------

tap.test('formatExportHeaderAllTypes', (t) => {
  const allTypes = [
    'audio-call', 'deleted', 'image', 'link-embed-no-text', 'link-text',
    'missed-audio-call', 'missed-video-call', 'poll', 'reaction',
    'sticker', 'text', 'text-image-replied', 'text-replied', 'video-call', 'voice-note',
  ];
  const header = formatExportHeader({ method: 'server', messageTypes: allTypes });
  t.equal(header.split('\n')[0], 'Method: server', 'header starts with method line');
  t.equal(header.split('\n')[1], 'Message types:', 'second line is message types label');
  allTypes.forEach((type) => {
    t.ok(header.includes(`- ${type}`), `header includes type: ${type}`);
  });
  const sep = header.split('\n').find((l) => l === '---');
  t.ok(sep, 'header includes --- separator');
  t.end();
});

// ---------------------------------------------------------------------------
// formatServerExportFileNameDateRange
// ---------------------------------------------------------------------------

tap.test('formatServerExportFileNameDateRange', (t) => {
  t.equal(
    formatServerExportFileName('export-max', { fromDate: '2026-05-01', toDate: '2026-05-19' }),
    'export-2026-05-01\u20132026-05-19-max.txt',
    'export-max with date range'
  );
  t.equal(
    formatServerExportFileName('export-minimal', { fromDate: '2026-05-01', toDate: '2026-05-19' }),
    'export-2026-05-01\u20132026-05-19-minimal.txt',
    'export-minimal with date range'
  );
  t.equal(
    formatServerExportFileName('export-max'),
    'export-max.txt',
    'no date range falls back to fixed name'
  );
  t.equal(
    formatServerExportFileName('export-minimal'),
    'export-minimal.txt',
    'export-minimal no date range falls back to fixed name'
  );
  t.equal(
    formatServerExportFileName(undefined),
    'export-max.txt',
    'undefined mode defaults to export-max'
  );
  t.equal(
    formatServerExportFileName(null),
    'export-max.txt',
    'null mode defaults to export-max'
  );
  t.equal(
    formatServerExportFileName(''),
    'export-max.txt',
    'empty string mode defaults to export-max'
  );
  t.equal(
    formatServerExportFileName('unknown-mode'),
    'export-max.txt',
    'arbitrary mode uses the mode as filename base'
  );
  t.end();
});
