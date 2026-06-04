const tap = require('tap');
const { stripAttributes, normalizeTagStrings } = require(
  '../src/shared/html-utils'
);

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
