const tap = require('tap');
const { TIMED_CALL_TYPES, MISSED_CALL_TYPES, CALL_TYPES, CONTENT_TYPES } = require('../src/shared/constants');

tap.test('TIMED_CALL_TYPES', (t) => {
  t.ok(Array.isArray(TIMED_CALL_TYPES), 'is an array');
  t.ok(TIMED_CALL_TYPES.includes('audio-call'), 'includes audio-call');
  t.ok(TIMED_CALL_TYPES.includes('video-call'), 'includes video-call');
  t.ok(TIMED_CALL_TYPES.includes('voice-note'), 'includes voice-note');
  t.equal(TIMED_CALL_TYPES.length, new Set(TIMED_CALL_TYPES).size, 'no duplicates');
  t.end();
});

tap.test('MISSED_CALL_TYPES', (t) => {
  t.ok(Array.isArray(MISSED_CALL_TYPES), 'is an array');
  t.ok(MISSED_CALL_TYPES.includes('missed-call'), 'includes missed-call');
  t.ok(MISSED_CALL_TYPES.includes('missed-audio-call'), 'includes missed-audio-call');
  t.ok(MISSED_CALL_TYPES.includes('missed-video-call'), 'includes missed-video-call');
  t.equal(MISSED_CALL_TYPES.length, new Set(MISSED_CALL_TYPES).size, 'no duplicates');
  t.end();
});

tap.test('CALL_TYPES', (t) => {
  t.ok(Array.isArray(CALL_TYPES), 'is an array');
  CALL_TYPES.forEach((type) => {
    t.ok(
      TIMED_CALL_TYPES.includes(type) || MISSED_CALL_TYPES.includes(type),
      `${type} belongs to TIMED_CALL_TYPES or MISSED_CALL_TYPES`,
    );
  });
  t.equal(CALL_TYPES.length, TIMED_CALL_TYPES.length + MISSED_CALL_TYPES.length, 'combines all timed and missed types');
  t.equal(CALL_TYPES.length, new Set(CALL_TYPES).size, 'no duplicates');
  t.end();
});

tap.test('CONTENT_TYPES', (t) => {
  t.ok(CONTENT_TYPES instanceof Set, 'is a Set');
  t.ok(CONTENT_TYPES.has('text'), 'includes text');
  t.ok(CONTENT_TYPES.has('link'), 'includes link');
  t.ok(CONTENT_TYPES.has('reaction'), 'includes reaction');
  t.end();
});

tap.test('exports', (t) => {
  t.ok(TIMED_CALL_TYPES, 'TIMED_CALL_TYPES is exported');
  t.ok(MISSED_CALL_TYPES, 'MISSED_CALL_TYPES is exported');
  t.ok(CALL_TYPES, 'CALL_TYPES is exported');
  t.ok(CONTENT_TYPES, 'CONTENT_TYPES is exported');
  t.end();
});
