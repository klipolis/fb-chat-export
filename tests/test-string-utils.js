const tap = require('tap');
const { escapeRegExp, replaceWholeWord } = require(
  '../src/shared/string-utils'
);

// ---------------------------------------------------------------------------
// escapeRegExp(value)
// ---------------------------------------------------------------------------

tap.test('escapeRegExp', (t) => {
  t.equal(escapeRegExp('.'), '\\.', 'escapes dot');
  t.equal(escapeRegExp('*'), '\\*', 'escapes asterisk');
  t.equal(escapeRegExp('+'), '\\+', 'escapes plus');
  t.equal(escapeRegExp('?'), '\\?', 'escapes question mark');
  t.equal(escapeRegExp('^'), '\\^', 'escapes caret');
  t.equal(escapeRegExp('$'), '\\$', 'escapes dollar');
  t.equal(escapeRegExp('{'), '\\{', 'escapes open curly brace');
  t.equal(escapeRegExp('}'), '\\}', 'escapes close curly brace');
  t.equal(escapeRegExp('('), '\\(', 'escapes open paren');
  t.equal(escapeRegExp(')'), '\\)', 'escapes close paren');
  t.equal(escapeRegExp('|'), '\\|', 'escapes pipe');
  t.equal(escapeRegExp('['), '\\[', 'escapes open square bracket');
  t.equal(escapeRegExp(']'), '\\]', 'escapes close square bracket');
  t.equal(escapeRegExp('\\'), '\\\\', 'escapes backslash');

  t.equal(
    escapeRegExp('hello world'),
    'hello world',
    'passes through normal text unchanged'
  );

  t.equal(escapeRegExp(''), '', 'handles empty string');
  t.equal(escapeRegExp(null), '', 'coerces null to empty string');
  t.equal(escapeRegExp(undefined), '', 'coerces undefined to empty string');

  t.end();
});

// ---------------------------------------------------------------------------
// replaceWholeWord(text, name, replacement)
// ---------------------------------------------------------------------------

tap.test('replaceWholeWord', (t) => {
  t.equal(
    replaceWholeWord('the quick brown fox', 'quick', 'slow'),
    'the slow brown fox',
    'replaces a whole word in the middle of text'
  );

  t.equal(
    replaceWholeWord('hello world', 'hello', 'hi'),
    'hi world',
    'replaces a word at the beginning'
  );

  t.equal(
    replaceWholeWord('say hello', 'hello', 'bye'),
    'say bye',
    'replaces a word at the end'
  );

  t.equal(
    replaceWholeWord('artificial art', 'art', 'craft'),
    'artificial craft',
    'does not replace a word that is part of another word'
  );

  t.equal(
    replaceWholeWord('hello world', 'Hello', 'hi'),
    'hi world',
    'is case-insensitive (different case in search name)'
  );

  t.equal(
    replaceWholeWord('Hello world', 'hello', 'hi'),
    'hi world',
    'is case-insensitive (different case in text)'
  );

  t.equal(
    replaceWholeWord('say,hello,world', 'hello', 'bye'),
    'say,bye,world',
    'preserves comma boundary characters'
  );

  t.equal(
    replaceWholeWord('hello! world?', 'hello', 'hi'),
    'hi! world?',
    'preserves punctuation boundary characters'
  );

  t.equal(
    replaceWholeWord('foo.bar baz', 'foo.bar', 'qux'),
    'qux baz',
    'handles special regex dot in search name'
  );

  t.equal(
    replaceWholeWord('foo+bar baz', 'foo+bar', 'qux'),
    'qux baz',
    'handles special regex plus in search name'
  );

  t.equal(
    replaceWholeWord('you are great', 'you', 'them'),
    'you are great',
    'does not replace standalone lowercase "you" (special case)'
  );

  t.equal(
    replaceWholeWord('You are great', 'you', 'them'),
    'them are great',
    'replaces capitalized "You" (not protected by special case)'
  );

  t.equal(replaceWholeWord('', 'hello', 'hi'), '', 'handles empty text');
  t.equal(replaceWholeWord(null, 'hello', 'hi'), '', 'handles null text');
  t.equal(replaceWholeWord(undefined, 'hello', 'hi'), '', 'handles undefined text');

  t.end();
});
