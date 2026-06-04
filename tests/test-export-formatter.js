const tap = require('tap');
const { formatExportHeader, formatLine, buildExportText, buildEntryFromEntry, formatSummarySection } = require(
  '../src/shared/export-formatter'
);
const { buildSummary, buildDetailedSummary, buildSummaryJson } = require(
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

// ---------------------------------------------------------------------------
// buildEntryFromEntry
// ---------------------------------------------------------------------------

tap.test('buildEntryFromEntry', (t) => {
  const textEntry = buildEntryFromEntry({
    sender: 'Alice',
    ts: Date.parse('2026-01-01T12:00:00Z'),
    fileType: 'text',
    semanticType: 'text',
    content: 'Hello world',
    duration: '',
    imageCount: 0,
    words: 2,
  });
  t.equal(textEntry.sender, 'Alice', 'sender preserved');
  t.equal(textEntry.date.getTime(), Date.parse('2026-01-01T12:00:00Z'), 'date parsed from ts');
  t.equal(textEntry.type, 'text', 'type lowered from semanticType');
  t.equal(textEntry.isCall, false, 'text is not a call');
  t.equal(textEntry.isImage, false, 'text is not an image');
  t.equal(textEntry.callSeconds, 0, 'text has no call seconds');
  t.equal(textEntry.wordCount, 2, 'wordCount from entry.words');
  t.equal(textEntry.imageCount, 0, 'no images');

  const imageEntry = buildEntryFromEntry({
    sender: 'Bob',
    ts: Date.parse('2026-01-01T13:00:00Z'),
    fileType: 'image-3',
    semanticType: 'image',
    content: '',
    duration: '',
    imageCount: 4,
    words: 0,
  });
  t.equal(imageEntry.type, 'image', 'image type lowered');
  t.equal(imageEntry.isImage, true, 'image entry flagged');
  t.equal(imageEntry.wordCount, 0, 'image has zero wordCount');
  t.equal(imageEntry.imageCount, 4, 'imageCount preserved');

  const callEntry = buildEntryFromEntry({
    sender: 'Alice',
    ts: Date.parse('2026-01-01T14:00:00Z'),
    fileType: 'audio-call',
    semanticType: 'audio-call',
    content: '',
    duration: '0:05:30',
    imageCount: 0,
    words: 0,
  });
  t.equal(callEntry.type, 'audio-call', 'call type lowered');
  t.equal(callEntry.isCall, true, 'call flagged');
  t.equal(callEntry.wordCount, 0, 'call has zero wordCount');
  t.equal(callEntry.callSeconds, 330, 'call seconds from duration');

  const missedEntry = buildEntryFromEntry({
    sender: 'Bob',
    ts: Date.parse('2026-01-01T15:00:00Z'),
    fileType: 'missed-video-call',
    semanticType: 'missed-video-call',
    content: '',
    duration: '',
    imageCount: 0,
    words: 0,
  });
  t.equal(missedEntry.isCall, true, 'missed call flagged');
  t.equal(missedEntry.callSeconds, 0, 'missed call has 0 seconds');

  const voiceEntry = buildEntryFromEntry({
    sender: 'Alice',
    ts: Date.parse('2026-01-01T16:00:00Z'),
    fileType: 'voice-note',
    semanticType: 'voice-note',
    content: 'voice note',
    duration: '0:01:15',
    imageCount: 0,
    words: 0,
  });
  t.equal(voiceEntry.type, 'voice-note', 'voice-note type');
  t.equal(voiceEntry.isCall, true, 'voice-note is a call');
  t.equal(voiceEntry.wordCount, 0, 'voice-note zero wordCount');
  t.equal(voiceEntry.callSeconds, 75, 'voice-note call seconds');

  const noTsEntry = buildEntryFromEntry({
    sender: 'Charlie',
    fileType: 'text',
    semanticType: 'text',
    content: 'hello',
    duration: '',
    imageCount: 0,
    words: 1,
  });
  t.ok(isNaN(noTsEntry.date.getTime()), 'missing ts produces NaD date');

  t.end();
});

tap.test('unicodeSenderImageEntry', (t) => {
  const refDate = Date.parse('2026-01-01T12:00:00Z');

  // Image entry with two-word Hungarian sender
  const otvesEntry = buildEntryFromEntry({
    sender: 'Ötten Bernő',
    ts: refDate,
    fileType: 'image-3',
    semanticType: 'image',
    content: '',
    duration: '',
    imageCount: 3,
    words: 0,
  });
  t.equal(otvesEntry.type, 'image', 'type normalized to image for Unicode sender');
  t.equal(otvesEntry.isImage, true, 'flagged as image');
  t.equal(otvesEntry.sender, 'Ötten Bernő', 'Unicode sender preserved');
  t.equal(otvesEntry.imageCount, 3, 'image count preserved');
  t.equal(otvesEntry.wordCount, 0, 'wordCount forced to 0 for image');

  // Image entry with Japanese sender
  const jpEntry = buildEntryFromEntry({
    sender: '田中太郎',
    ts: refDate,
    fileType: 'image',
    semanticType: 'image',
    content: '',
    duration: '',
    imageCount: 1,
    words: 0,
  });
  t.equal(jpEntry.type, 'image', 'Japanese sender image type');
  t.equal(jpEntry.sender, '田中太郎', 'Japanese sender preserved');
  t.equal(jpEntry.imageCount, 1, 'single image count');

  // Text entry with Unicode sender (not image)
  const alvarEntry = buildEntryFromEntry({
    sender: 'Álvaro',
    ts: refDate,
    fileType: 'text',
    semanticType: 'text',
    content: 'hola mundo',
    duration: '',
    imageCount: 0,
    words: 2,
  });
  t.equal(alvarEntry.type, 'text', 'text type preserved for Unicode sender');
  t.equal(alvarEntry.isImage, false, 'not flagged as image');
  t.equal(alvarEntry.wordCount, 2, 'wordCount preserved for text');

  t.end();
});

// ---------------------------------------------------------------------------
// buildDetailedSummary
// ---------------------------------------------------------------------------

tap.test('buildDetailedSummary', (t) => {
  const empty = buildDetailedSummary([], { useMessageLabel: true });
  t.equal(empty, '', 'empty entries returns empty string (delegates to buildSummary which returns empty for no entries)');

  const singleText = buildDetailedSummary([
    { sender: 'Alice', date: new Date('2026-01-01T12:00:00Z'), type: 'text', isCall: false, isImage: false, wordCount: 3, imageCount: 0, callSeconds: 0 },
  ], { useMessageLabel: true });
  t.ok(singleText.includes('Total Summary'), 'includes title');
  t.ok(singleText.includes('1 message / 1 day'), 'useMessageLabel: message/day labels');
  t.ok(singleText.includes('~ 3 words'), 'word count shown');
  t.ok(singleText.includes('~ 1 text'), 'type count shown');
  t.ok(singleText.includes('Alice Summary'), 'participant section');
  t.ok(singleText.endsWith('---\n'), 'ends with separator');

  const multiType = buildDetailedSummary([
    { sender: 'Alice', date: new Date('2026-01-01'), type: 'text', isCall: false, isImage: false, wordCount: 5, imageCount: 0, callSeconds: 0 },
    { sender: 'Alice', date: new Date('2026-01-01'), type: 'image', isCall: false, isImage: true, wordCount: 0, imageCount: 1, callSeconds: 0 },
    { sender: 'Bob', date: new Date('2026-01-02'), type: 'audio-call', isCall: true, isImage: false, wordCount: 0, imageCount: 0, callSeconds: 120 },
  ]);
  t.ok(multiType.includes('3 posts / 2 days'), 'default: posts/days labels');
  t.ok(multiType.includes('~ 5 words'), 'total words');
  t.ok(multiType.includes('~ 1 text'), 'text type count');
  t.ok(multiType.includes('~ 1 image'), 'image type count');
  t.ok(multiType.includes('~ 1 audio call'), 'audio-call type count');
  t.ok(multiType.includes('~ 1 calls 00:02:00'), 'call duration line');
  t.ok(multiType.includes('Alice Summary'), 'Alice section');
  t.ok(multiType.includes('Bob Summary'), 'Bob section');
  t.ok(multiType.includes('1 post / 1 day'), 'Bob: 1 post 1 day');

  const fixedParticipants = buildDetailedSummary([
    { sender: 'Alice', date: new Date('2026-01-01'), type: 'text', isCall: false, isImage: false, wordCount: 2, imageCount: 0, callSeconds: 0 },
    { sender: 'Bob', date: new Date('2026-01-02'), type: 'text', isCall: false, isImage: false, wordCount: 3, imageCount: 0, callSeconds: 0 },
  ], { fixedParticipants: ['Alice'] });
  t.ok(fixedParticipants.includes('Alice Summary'), 'fixed includes Alice');
  t.notOk(fixedParticipants.includes('Bob Summary'), 'fixed excludes Bob');

  t.end();
});

// ---------------------------------------------------------------------------
// buildSummaryJson
// ---------------------------------------------------------------------------

tap.test('buildSummaryJson', (t) => {
  const empty = buildSummaryJson([]);
  const emptyParsed = JSON.parse(empty);
  t.equal(emptyParsed.total.messages, 0, 'empty summary has 0 messages');
  t.equal(emptyParsed.total.days, 0, 'empty summary has 0 days');
  t.strictSame(emptyParsed.participants, [], 'empty summary has no participants');
  t.equal(empty.endsWith('\n'), true, 'json ends with newline');

  const basic = buildSummaryJson([
    { sender: 'Alice', date: new Date('2026-01-01'), type: 'text', isCall: false, isImage: false, wordCount: 5, imageCount: 0, callSeconds: 0 },
    { sender: 'Bob', date: new Date('2026-01-02'), type: 'audio-call', isCall: true, isImage: false, wordCount: 0, imageCount: 0, callSeconds: 300 },
  ]);
  const parsed = JSON.parse(basic);
  t.equal(parsed.total.messages, 2, '2 total messages');
  t.equal(parsed.total.days, 2, '2 total days');
  t.equal(parsed.total.rough.words, 5, '5 total words');
  t.equal(parsed.total.rough.calls, 1, '1 total call');
  t.equal(parsed.total.rough.callSeconds, 300, '300 total call seconds');
  t.equal(parsed.total.rough.images, 0, '0 images');

  t.equal(parsed.participants.length, 2, '2 participants');
  t.equal(parsed.participants[0].name, 'Alice', 'first participant Alice');
  t.equal(parsed.participants[0].rough.text, 1, 'Alice text count');
  t.equal(parsed.participants[1].name, 'Bob', 'second participant Bob');
  t.equal(parsed.participants[1].rough.calls, 1, 'Bob call count');

  const fixedJson = buildSummaryJson([
    { sender: 'Alice', date: new Date('2026-01-01'), type: 'text', isCall: false, isImage: false, wordCount: 1, imageCount: 0, callSeconds: 0 },
    { sender: 'Bob', date: new Date('2026-01-02'), type: 'text', isCall: false, isImage: false, wordCount: 2, imageCount: 0, callSeconds: 0 },
  ], { fixedParticipants: ['Alice'] });
  const fixedParsed = JSON.parse(fixedJson);
  t.equal(fixedParsed.participants.length, 1, 'fixedParticipants: 1 participant');
  t.equal(fixedParsed.participants[0].name, 'Alice', 'fixedParticipants: Alice only');

  t.end();
});

// ---------------------------------------------------------------------------
// wordCountConsistencyAcrossMessageTypes
// ---------------------------------------------------------------------------

tap.test('wordCountConsistencyAcrossMessageTypes', (t) => {
  const refDate = Date.parse('2026-01-01T12:00:00Z');

  function makeEntry(sender, semanticType, content, words, duration) {
    return {
      sender,
      ts: refDate,
      fileType: semanticType,
      semanticType,
      content,
      contentLength: words > 0 ? `${words} words` : undefined,
      duration: duration || '',
      imageCount: semanticType === 'image' ? 1 : 0,
      words,
    };
  }

  const entries = [
    makeEntry('Alice', 'text', 'hello world', 2),
    makeEntry('Alice', 'text', 'one two three four five', 5),
    makeEntry('Bob', 'link-text', 'check this link', 3),
    makeEntry('Bob', 'reaction', '👍', 1),
    makeEntry('Alice', 'image', '', 0),
    makeEntry('Alice', 'voice-note', 'voice note', 0, '0:01:15'),
    makeEntry('Bob', 'audio-call', '', 0, '0:05:30'),
    makeEntry('Bob', 'video-call', '', 0, '0:10:00'),
    makeEntry('Alice', 'missed-video-call', '', 0),
    makeEntry('Alice', 'sticker', '', 0),
    makeEntry('Bob', 'unsent', '', 0),
    makeEntry('Bob', 'poll', '', 0),
    makeEntry('Alice', 'text-image-replied', 'reply with text', 3),
    makeEntry('Alice', 'text-replied', 'a simple reply', 3),
  ];

  const totalExpectedWords = 2 + 5 + 3 + 1 + 3 + 3;

  // 1. Verify formatLine shows word count for content-bearing types only
  entries.forEach((e) => {
    const line = formatLine(e, { includeLength: true, includeContent: false });
    if (e.contentLength) {
      t.ok(line.includes(e.contentLength), `formatLine shows "${e.contentLength}" for ${e.semanticType}`);
    } else {
      t.notOk(line.includes(' words'), `formatLine omits word count for ${e.semanticType}`);
    }
  });

  // 2. Build summary entries and verify word counts
  const summaryEntries = entries.map((e) => buildEntryFromEntry(e));

  t.equal(summaryEntries[0].wordCount, 2, 'text entry wordCount');
  t.equal(summaryEntries[1].wordCount, 5, 'second text entry wordCount');
  t.equal(summaryEntries[2].wordCount, 3, 'link-text entry wordCount');
  t.equal(summaryEntries[3].wordCount, 1, 'reaction entry wordCount');
  t.equal(summaryEntries[4].wordCount, 0, 'image entry wordCount forced to 0');
  t.equal(summaryEntries[5].wordCount, 0, 'voice-note entry wordCount forced to 0');
  t.equal(summaryEntries[6].wordCount, 0, 'audio-call entry wordCount forced to 0');
  t.equal(summaryEntries[7].wordCount, 0, 'video-call entry wordCount forced to 0');
  t.equal(summaryEntries[8].wordCount, 0, 'missed-call entry wordCount forced to 0');
  t.equal(summaryEntries[9].wordCount, 0, 'sticker entry wordCount forced to 0');
  t.equal(summaryEntries[10].wordCount, 0, 'unsent entry wordCount');

  // 3. Text summary word count matches (format: "~ N text / N words")
  const textSummary = buildSummary(summaryEntries);
  const wordsPattern = new RegExp(`~\\s+\\d+\\s+text\\s+/\\s+${totalExpectedWords}\\s+words`);
  t.ok(wordsPattern.test(textSummary), `text summary shows ${totalExpectedWords} total words in "~ N text / N words"`);

  // 4. JSON summary word count matches
  const jsonSummary = buildSummaryJson(summaryEntries);
  const parsed = JSON.parse(jsonSummary);
  t.equal(parsed.total.rough.words, totalExpectedWords, `JSON summary shows ${totalExpectedWords} total words`);
  t.equal(parsed.total.rough.text, 8, '8 text entries in JSON summary');

  // 5. Per-participant word counts match in JSON
  const alice = parsed.participants.find((p) => p.name === 'Alice');
  const bob = parsed.participants.find((p) => p.name === 'Bob');
  t.equal(alice.rough.words, 2 + 5 + 3 + 3, 'Alice word count in JSON summary');
  t.equal(bob.rough.words, 3 + 1, 'Bob word count in JSON summary');

  t.end();
});
