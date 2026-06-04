const tap = require('tap');
const { aliasChatNames } = require('../src/shared/utils');
const { applyAliasToText } = require('../src/shared/alias-utils');

// ---------------------------------------------------------------------------
// aliasChatNames
// ---------------------------------------------------------------------------

tap.test('aliasChatNames', (t) => {
  const rawHtml =
    '<title>Rob</title><div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"><img alt="Rob Leon"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div>Message body mentioning Rob is aliased.</div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('aria-label="At Wednesday 7:54pm, Alpha"'), 'Sender aria-label is aliased');
  t.ok(cleaned.includes('aria-label="Enter, Message sent Wednesday 7:54pm by Alpha"'), 'Enter message sender is aliased');
  t.ok(cleaned.includes('<img alt="Alpha Leon"'), 'Profile alt text sender word is aliased');
  t.notOk(cleaned.includes('Rob deleted a message'), 'Message content is aliased');
  t.notOk(cleaned.includes('Message body mentioning Rob is aliased.'), 'Message body text references is aliased');
  t.ok(cleaned.includes('<title>Alpha</title>'), 'Chat title is aliased');
  t.end();
});

tap.test('aliasChatNamesPreservesYou', (t) => {
  const rawHtml =
    '<div aria-label="At Thursday 5:34pm, You" aria-roledescription="message"></div><div aria-label="Enter, Message sent Thursday 5:34pm by You"></div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('aria-label="At Thursday 5:34pm, You"'), 'Self-label You remains unchanged');
  t.ok(cleaned.includes('aria-label="Enter, Message sent Thursday 5:34pm by You"'), 'Self-label by You remains unchanged');
  t.end();
});

tap.test('aliasChatNamesWithNameMap', (t) => {
  const nameMap = { You: 'Youghurt', any: 'Alpha' };
  const rawHtml =
    '<title>Rob</title><div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div aria-label="At Wednesday 8:00pm, You" aria-roledescription="message"></div><div>You sent a message</div>';
  const cleaned = aliasChatNames(rawHtml, nameMap);
  // Other person replaced using nameMap.any
  t.ok(cleaned.includes('Alpha deleted a message'), 'Detected name replaced with nameMap.any');
  t.ok(cleaned.includes('aria-label="At Wednesday 7:54pm, Alpha"'), 'Detected sender in aria-label replaced');
  // "You" replaced using explicit nameMap entry
  t.ok(cleaned.includes('aria-label="At Wednesday 8:00pm, Youghurt"'), 'You replaced with Youghurt in aria-label');
  t.ok(cleaned.includes('Youghurt sent a message'), 'You replaced with Youghurt in body text');
  t.end();
});

tap.test('aliasChatNamesOnlyReplacesShortSenderNames', (t) => {
  const rawHtml =
    '<div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent Wednesday 7:54pm by Rob"></div><div>All of this is a long phrase that is not a sender name</div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('Alpha deleted a message'), 'Valid short sender name is aliased');
  t.ok(cleaned.includes('All of this is a long phrase that is not a sender name'), 'Long non-name phrases is not aliased');
  t.end();
});

tap.test('aliasChatNamesPreservesRawDateText', (t) => {
  const rawHtml =
    '<title>Rob</title><div aria-label="At May 15, 2026, Rob" aria-roledescription="message"></div><div>Rob deleted a message</div><div aria-label="Enter, Message sent May 15, 2026 by Rob"></div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('May 15, 2026'), 'Raw date text remains unchanged');
  t.ok(
    cleaned.includes('Alpha deleted a message') || cleaned.includes('Alpha'),
    'Confirmed sender name is aliased'
  );
  t.end();
});

tap.test('aliasChatNamesIgnoresNamesWithNumbers', (t) => {
  const rawHtml =
    '<div aria-label="At Thursday 5:34pm, Alice 2024" aria-roledescription="message"></div><div>Alice 2024 deleted a message</div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('Alice 2024'), 'Numeric names is not aliased');
  t.notOk(cleaned.includes('Alpha 2024'), 'Numeric names is not replaced with Alpha');
  t.end();
});

tap.test('aliasChatNamesSkipsAlreadyTargetName', (t) => {
  // Auto-detect: if the detected name is already the replacement, skip (no double-replace).
  const nameMap = { any: 'Alpha' };
  const rawHtml =
    '<div aria-label="At Thursday 5:34pm, Alpha" aria-roledescription="message"></div>' +
    '<div>Alpha deleted a message</div>' +
    '<div aria-label="At Thursday 5:35pm, Alpha" aria-roledescription="message"></div>' +
    '<div>Alpha sent another message</div>';
  const cleaned = aliasChatNames(rawHtml, nameMap);
  // Remains unchanged — "Alpha" is already the replacement name
  t.ok(cleaned.includes('Alpha deleted a message'), 'Already-target name kept unchanged');
  t.notOk(cleaned.includes('Alpha Alpha'), 'Name not double-replaced');

  // Explicit map: if from === to (same name), skip replacement
  const nameMap2 = { You: 'You', any: 'Alpha' };
  const rawHtml2 =
    '<div aria-label="At Thursday 5:34pm, You" aria-roledescription="message"></div>' +
    '<div>You sent a message</div>';
  const cleaned2 = aliasChatNames(rawHtml2, nameMap2);
  t.ok(cleaned2.includes('You sent a message'), 'from===to explicit entry is a no-op');
  t.end();
});

tap.test('aliasChatNamesWithRealConfig', (t) => {
  // Explicit Rob→Barnabas mapping with You→Youghurt
  const nameMap = { You: 'Youghurt', Rob: 'Barnabas', any: 'XYZ' };
  const rawHtml =
    '<title>Chat with Rob</title>' +
    '<div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"></div>' +
    '<div>Rob deleted a message</div>' +
    '<div aria-label="At Wednesday 8:00pm, You" aria-roledescription="message"></div>' +
    '<div>You sent a sticker</div>';
  const cleaned = aliasChatNames(rawHtml, nameMap);
  t.ok(cleaned.includes('Barnabas deleted a message'), 'Rob explicitly mapped to Barnabas');
  t.ok(cleaned.includes('aria-label="At Wednesday 7:54pm, Barnabas"'), 'Explicit map in aria-label');
  t.ok(cleaned.includes('aria-label="At Wednesday 8:00pm, Youghurt"'), 'You mapped to Youghurt');
  t.ok(cleaned.includes('Youghurt sent a sticker'), 'You mapped in body text');
  t.ok(cleaned.includes('<title>Chat with Barnabas</title>'), 'Detected sender in title replaced');
  t.end();
});

tap.test('aliasChatNamesAnyFallback', (t) => {
  // When only 'any' is provided, auto-detected name gets the fallback alias
  // Need enough occurrences for auto-detection to cross the threshold
  const nameMap = { any: 'XYZ' };
  const rawHtml =
    '<title>Chat with Rob</title>' +
    '<div aria-label="At Wednesday 7:54pm, Rob" aria-roledescription="message"></div>' +
    '<div aria-label="At Wednesday 7:55pm, Rob" aria-roledescription="message"></div>' +
    '<div>Rob deleted a message</div>';
  const cleaned = aliasChatNames(rawHtml, nameMap);
  t.ok(cleaned.includes('XYZ deleted a message'), 'Auto-detected Rob aliased to any: XYZ');
  t.ok(cleaned.includes('aria-label="At Wednesday 7:54pm, XYZ"'), 'Rob in first aria-label aliased to XYZ');
  t.ok(cleaned.includes('aria-label="At Wednesday 7:55pm, XYZ"'), 'Rob in second aria-label aliased to XYZ');
  t.ok(cleaned.includes('<title>Chat with XYZ</title>'), 'Chat title aliased to XYZ');
  t.end();
});

tap.test('applyAliasToTextWithRealConfig', (t) => {
  // Explicit mapping
  t.equal(
    applyAliasToText('Rob replied', { Rob: 'Barnabas', any: 'XYZ' }, 'Rob'),
    'Barnabas replied',
    'explicit Rob→Barnabas replacement'
  );
  // Fallback for unknown sender
  t.equal(
    applyAliasToText('MysteryPerson said hello', { Rob: 'Barnabas', any: 'XYZ' }, 'MysteryPerson'),
    'XYZ said hello',
    'unknown sender falls back to any: XYZ'
  );
  // You preservation with custom Youghurt
  t.equal(
    applyAliasToText('You sent a message', { You: 'Youghurt', any: 'XYZ' }, 'You'),
    'Youghurt sent a message',
    'You→Youghurt with custom any'
  );
  // Generic lowercase you not replaced in alias
  t.equal(
    applyAliasToText('I told you so', { You: 'Youghurt', any: 'XYZ' }, 'You'),
    'I told you so',
    'generic lowercase you not replaced'
  );
  // Explicit map takes priority; fallback activates for non-mapped occurrences
  t.equal(
    applyAliasToText('Rob and UnknownPerson are chatting', { Rob: 'Barnabas', any: 'XYZ' }, 'Rob'),
    'Barnabas and UnknownPerson are chatting',
    'explicit Rob→Barnabas applied; fallback not needed since Rob is explicitly mapped'
  );
  // Fallback for unknown sender that is not explicitly mapped
  t.equal(
    applyAliasToText('UnknownPerson said hi', { Rob: 'Barnabas', any: 'XYZ' }, 'UnknownPerson'),
    'XYZ said hi',
    'fallback any applied for unmapped sender'
  );
  t.end();
});

tap.test('aliasChatNamesSupportsUnicodeNames', (t) => {
  const rawHtml =
    '<title>Łukasz</title>' +
    '<div aria-label="At Wednesday 7:54pm, Łukasz" aria-roledescription="message"></div>' +
    '<div aria-label="At Wednesday 7:55pm, Łukasz" aria-roledescription="message"></div>' +
    '<div>Łukasz deleted a message</div>';
  const cleaned = aliasChatNames(rawHtml);
  t.ok(cleaned.includes('aria-label="At Wednesday 7:54pm, Alpha"'), 'Unicode sender aria-label is aliased');
  t.ok(cleaned.includes('aria-label="At Wednesday 7:55pm, Alpha"'), 'Second Unicode sender aria-label is aliased');
  t.ok(cleaned.includes('<title>Alpha</title>'), 'Unicode chat title is aliased');
  t.notOk(cleaned.includes('Łukasz deleted a message'), 'Unicode message content sender is aliased');
  t.end();
});

// ---------------------------------------------------------------------------
// applyAliasToText
// ---------------------------------------------------------------------------

tap.test('applyAliasToText replaces explicit and any fallback names', (t) => {
  t.equal(
    applyAliasToText('You sent a message', { You: 'Youghurt', any: 'Alpha' }, 'You'),
    'Youghurt sent a message',
    'explicit alias replacement works for sender name in text'
  );
  t.equal(
    applyAliasToText('Argos for you', { You: 'Youghurt', any: 'Alpha' }, 'You'),
    'Argos for you',
    'generic lowercase you is not replaced by the user alias'
  );
  t.equal(
    applyAliasToText('Rob replied', { any: 'Alpha' }, 'Rob'),
    'Alpha replied',
    'any fallback alias replaces sender name when explicit mapping is absent'
  );
  t.equal(
    applyAliasToText('Anybody can join', { any: 'Alpha' }, 'Bob'),
    'Anybody can join',
    'partial word matches are not replaced'
  );
  t.equal(
    applyAliasToText('Álvaro said hi', { Álvarez: 'Al', any: 'Alpha' }, 'Álvaro'),
    'Alpha said hi',
    'unicode sender fallback alias replaces non-English sender name'
  );
  t.equal(
    applyAliasToText('Борис replied', { 'Борис': 'Boris', any: 'Alpha' }, 'Борис'),
    'Boris replied',
    'explicit unicode alias replacement works in text'
  );
  t.end();
});
