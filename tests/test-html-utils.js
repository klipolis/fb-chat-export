const tap = require('tap');
const {
  stripAttributes,
  normalizeTagStrings,
  findMatchingClosingTag,
  cleanXClasses,
} = require('../src/shared/html-utils');

// ---------------------------------------------------------------------------
// stripAttributes(tag, attrs)
// ---------------------------------------------------------------------------

tap.test('stripAttributes', (t) => {
  // Strips all attributes by default (no keepAttrs filter)
  t.equal(
    stripAttributes('div', ' class="foo"'),
    '<div>',
    'strips class attribute'
  );
  t.equal(
    stripAttributes('span', ' id="bar"'),
    '<span>',
    'strips id attribute'
  );
  t.equal(
    stripAttributes('p', ' style="color:red"'),
    '<p>',
    'strips style attribute'
  );
  t.equal(
    stripAttributes('a', ' href="http://example.com"'),
    '<a>',
    'strips href attribute'
  );
  t.equal(
    stripAttributes('img', ' src="pic.jpg" alt="photo"'),
    '<img>',
    'img tag always returns bare <img>'
  );

  // Keeps specified attributes (aria-label, aria-roledescription)
  t.equal(
    stripAttributes('div', ' aria-label="Hello" class="foo"'),
    '<div aria-label="Hello">',
    'keeps aria-label but strips class'
  );
  t.equal(
    stripAttributes('div', ' class="foo" aria-roledescription="slide"'),
    '<div aria-roledescription="slide">',
    'keeps aria-roledescription but strips class'
  );
  t.equal(
    stripAttributes('div', ' aria-label="A" aria-roledescription="B" class="x"'),
    '<div aria-label="A" aria-roledescription="B">',
    'keeps both aria-label and aria-roledescription'
  );

  // Handles single-quoted attribute values (not matched by regex, so preserved)
  t.equal(
    stripAttributes('div', " class='foo'"),
    "<div class='foo'>",
    'single-quoted class value is preserved (regex targets double-quotes only)'
  );

  // Handles double-quoted attribute values
  t.equal(
    stripAttributes('div', ' class="foo"'),
    '<div>',
    'double-quoted class value is stripped'
  );
  t.equal(
    stripAttributes('div', ' data-value="123"'),
    '<div>',
    'data-* attribute is stripped'
  );

  // Handles unquoted attribute values (not matched by regex, so preserved)
  t.equal(
    stripAttributes('div', ' class=foo'),
    '<div class=foo>',
    'unquoted class value is preserved (regex requires ="...")'
  );

  // Handles self-closing tags (attrs after slash preserved since not matched)
  t.equal(
    stripAttributes('br', ' /'),
    '<br />',
    'self-closing slash is preserved as attribute text'
  );
  t.equal(
    stripAttributes('br', ' class="x" /'),
    '<br />',
    'strips attribute but keeps self-closing slash'
  );

  // Handles multiple attributes on one tag
  t.equal(
    stripAttributes('div', ' class="a" id="b" style="c"'),
    '<div>',
    'strips multiple attributes'
  );
  t.equal(
    stripAttributes('div', ' class="a" aria-label="b" tabindex="3"'),
    '<div aria-label="b">',
    'strips all but aria-label among multiple attrs'
  );

  // Handles case-insensitive attribute names
  t.equal(
    stripAttributes('div', ' CLASS="foo"'),
    '<div>',
    'uppercase CLASS attribute is stripped'
  );
  t.equal(
    stripAttributes('div', ' ID="bar" STYLE="color:red"'),
    '<div>',
    'uppercase ID and STYLE attributes are stripped'
  );

  // Empty string attrs returns bare tag
  t.equal(
    stripAttributes('div', ''),
    '<div>',
    'empty attrs string returns bare tag'
  );

  t.end();
});

// ---------------------------------------------------------------------------
// normalizeTagStrings(html)
// ---------------------------------------------------------------------------

tap.test('normalizeTagStrings', (t) => {
  // Strips attributes but preserves original tag case
  t.equal(
    normalizeTagStrings('<BR>'),
    '<BR>',
    '<BR> without attributes returns unchanged'
  );
  t.equal(
    normalizeTagStrings('<DIV>'),
    '<DIV>',
    '<DIV> without attributes returns unchanged'
  );
  t.equal(
    normalizeTagStrings('</DIV>'),
    '</DIV>',
    'closing tag is not matched by regex and remains unchanged'
  );

  // Handles mixed case (tag case preserved)
  t.equal(
    normalizeTagStrings('<DiV>'),
    '<DiV>',
    '<DiV> without attributes returns unchanged'
  );

  // Handles tags with attributes (attributes stripped, tag case preserved)
  t.equal(
    normalizeTagStrings('<DIV CLASS="foo">'),
    '<DIV>',
    'strips class attribute from <DIV>'
  );
  t.equal(
    normalizeTagStrings('<A HREF="http://x.com" aria-label="Link">'),
    '<A aria-label="Link">',
    'strips href but keeps aria-label from <A>'
  );

  // Handles self-closing tags (tag case preserved, slash kept)
  t.equal(
    normalizeTagStrings('<BR />'),
    '<BR />',
    '<BR /> with self-closing slash is unchanged'
  );

  // img tag is special-cased to always return <img>
  t.equal(
    normalizeTagStrings('<IMG SRC="pic.jpg">'),
    '<img>',
    '<IMG> attributes are stripped and tag becomes <img>'
  );

  // Multiple tags
  t.equal(
    normalizeTagStrings('<DIV><P CLASS="x">text</P></DIV>'),
    '<DIV><P>text</P></DIV>',
    'strips attributes from open tags, closing tags unchanged'
  );

  // Empty string returns empty string
  t.equal(
    normalizeTagStrings(''),
    '',
    'empty string returns empty string'
  );

  // String without HTML tags returns unchanged
  t.equal(
    normalizeTagStrings('hello world'),
    'hello world',
    'plain text without tags is unchanged'
  );
  t.equal(
    normalizeTagStrings('a < b > c'),
    'a < b > c',
    'non-tag angle brackets are unchanged'
  );

  t.end();
});

// ---------------------------------------------------------------------------
// findMatchingClosingTag(html, tag, fromIndex)
// ---------------------------------------------------------------------------

tap.test('findMatchingClosingTag', (t) => {
  t.equal(
    findMatchingClosingTag('<div><span>text</span></div>', 'div', 0),
    22,
    'finds matching closing div tag after an opening div tag'
  );
  t.equal(
    findMatchingClosingTag('<div><div>inner</div>outer</div>', 'div', 0),
    26,
    'handles nested tags — finds correct closing tag for outer div'
  );
  t.equal(
    findMatchingClosingTag('<div>no close', 'div', 0),
    -1,
    'returns -1 when no matching closing tag exists'
  );
  t.equal(
    findMatchingClosingTag('<span>text</span>', 'div', 0),
    -1,
    'returns -1 when tag is not found at all'
  );
  t.equal(
    findMatchingClosingTag('<div><br /><br /></div>', 'div', 0),
    17,
    'self-closing tags are not mistaken for opening tags'
  );
  t.equal(
    findMatchingClosingTag('<div>first</div><div>second</div>', 'div', 15),
    27,
    'works from a specific fromIndex offset'
  );
  t.equal(
    findMatchingClosingTag('<p>hello</p>', 'p', 0),
    8,
    'works with p tag'
  );
  t.equal(
    findMatchingClosingTag('<span>a<span>b</span>c</span>', 'span', 0),
    22,
    'works with nested span tags'
  );

  t.end();
});

// ---------------------------------------------------------------------------
// cleanXClasses(html)
// ---------------------------------------------------------------------------

tap.test('cleanXClasses', (t) => {
  t.equal(
    cleanXClasses('<div style="color:red">text</div>'),
    '<div>text</div>',
    'removes style attributes entirely'
  );
  t.equal(
    cleanXClasses('<div class="x-foo">text</div>'),
    '<div>text</div>',
    'removes classes starting with x prefix'
  );
  t.equal(
    cleanXClasses('<div class="foo">text</div>'),
    '<div class="foo">text</div>',
    'keeps non-x classes'
  );
  t.equal(
    cleanXClasses('<div class="x-foo foo bar">text</div>'),
    '<div class="foo bar">text</div>',
    'keeps non-x classes and removes x-classes among multiple'
  );
  t.equal(
    cleanXClasses('<div class="">text</div>'),
    '<div>text</div>',
    'removes empty class attribute'
  );
  t.equal(
    cleanXClasses('<div>text</div>'),
    '<div>text</div>',
    'returns unchanged when no classes present'
  );
  t.equal(
    cleanXClasses('<div style="">text</div>'),
    '<div>text</div>',
    'removes empty style attribute'
  );
  t.equal(
    cleanXClasses('<p class="x-a">a</p><p class="b">b</p>'),
    '<p>a</p><p class="b">b</p>',
    'handles multiple tags — removes x-classes, keeps non-x-classes'
  );

  t.end();
});
