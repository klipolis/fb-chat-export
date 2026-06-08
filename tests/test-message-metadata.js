const tap = require('tap');
const { getContentMeta } = require('../src/shared/message-metadata');
const { normalizeDuration } = require('../src/shared/duration-utils');
const { chooseRule } = require('../src/shared/rules');

// ---------------------------------------------------------------------------
// normalizeDuration
// ---------------------------------------------------------------------------

tap.test('normalizeDuration', (t) => {
  t.equal(normalizeDuration('0:20'), '00:00:20');
  t.equal(normalizeDuration('1:23:45'), '01:23:45');
  t.equal(normalizeDuration('31 mins'), '00:31:00');
  t.equal(normalizeDuration('45 sec'), '00:00:45');
  t.equal(normalizeDuration('2 min'), '00:02:00');
  t.equal(normalizeDuration('1:23 PM'), null);
  t.end();
});

// ---------------------------------------------------------------------------
// getContentMeta
// ---------------------------------------------------------------------------

tap.test('getContentMeta', (t) => {
  const linkMeta = getContentMeta({
    fileName: 'link-test.html',
    ariaLabel: 'At today at 12:00, You: Visit https://example.com',
    message: 'Visit https://example.com',
    hasLink: true,
  });
  t.equal(linkMeta.type, 'link');
  t.equal(linkMeta.text, 'https://example.com');
  t.equal(linkMeta.contentLength, undefined);

  const voiceMeta = getContentMeta({
    fileName: 'voice-test.html',
    ariaLabel: 'At today at 12:00, You: Voice message',
    message: 'voice message',
    timerText: '1:05',
  });
  t.equal(voiceMeta.type, 'voice-note');
  t.equal(voiceMeta.text, 'voice note');
  t.equal(voiceMeta.contentLength, undefined);
  t.equal(voiceMeta.duration, '00:01:05');

  const shortVoiceMeta = getContentMeta({
    fileName: 'voice-test.html',
    ariaLabel: 'At today at 12:00, You: Voice message',
    message: 'voice message',
    timerText: '0:20 mins',
  });
  t.equal(shortVoiceMeta.type, 'voice-note');
  t.equal(shortVoiceMeta.text, 'voice note');
  t.equal(shortVoiceMeta.contentLength, undefined);
  t.equal(shortVoiceMeta.duration, '00:00:20');

  const missedCallMeta = getContentMeta({
    fileName: 'missed-call.html',
    ariaLabel: 'At today at 14:00, You: Missed audio call',
    message: 'Missed audio call',
  });
  t.equal(missedCallMeta.type, 'missed-call');
  t.equal(missedCallMeta.text, 'Missed audio call');
  t.equal(missedCallMeta.contentLength, undefined);
  t.equal(missedCallMeta.duration, null);

  const embeddedLinkMeta = getContentMeta({
    fileName: 'link-embed.html',
    ariaLabel: 'At today at 15:00, You: Open Facebook',
    message: 'Open Facebook',
    rawMeta: { link: 'https://facebook.com' },
    hasLink: true,
  });
  t.equal(embeddedLinkMeta.type, 'link');
  t.equal(embeddedLinkMeta.text, 'https://facebook.com');
  t.equal(embeddedLinkMeta.contentLength, undefined);
  t.equal(embeddedLinkMeta.link, 'https://facebook.com');

  const redirectLinkMeta = getContentMeta({
    fileName: 'link-redirect.html',
    ariaLabel: 'At today at 15:00, You: Open link',
    message: 'Open link',
    rawMeta: { link: 'https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com' },
    hasLink: true,
  });
  t.equal(redirectLinkMeta.type, 'link');
  t.equal(redirectLinkMeta.text, 'https://example.com');
  t.equal(redirectLinkMeta.contentLength, undefined);
  t.equal(redirectLinkMeta.link, 'https://example.com');

  const attachmentMeta = getContentMeta({
    fileName: 'attachment.html',
    ariaLabel: 'At today at 16:00, You: View attachment',
    message: 'View attachment',
    hasLink: true,
  });
  t.equal(attachmentMeta.type, 'link');
  t.equal(attachmentMeta.text, 'link');
  t.equal(attachmentMeta.contentLength, undefined);

  const pinnedLocationMeta = getContentMeta({
    fileName: 'link-embed-no-text.html',
    ariaLabel: 'At Friday 1:51pm, Alpha',
    message:
      'Pinned Location Hall Mead Nursery, Nazeing Road Waltham Abbey England EN9 2EU United Kingdom',
    hasLink: true,
  });
  t.equal(pinnedLocationMeta.type, 'link');
  t.ok(
    /^https:\/\/www\.google\.com\/maps\/search\//.test(pinnedLocationMeta.text),
    'Pinned location link content is mapped as to a Google Maps URL'
  );
  t.ok(
    /^https:\/\/www\.google\.com\/maps\/search\//.test(pinnedLocationMeta.link),
    'Pinned location link field is mapped as to a Google Maps URL'
  );
  t.equal(pinnedLocationMeta.contentLength, undefined);

  const videoMeta = getContentMeta({
    fileName: 'call-video.html',
    ariaLabel: 'At today at 11:14, You',
    message: 'video call',
    timerText: '31 mins',
  });
  t.equal(videoMeta.type, 'video-call');
  t.equal(videoMeta.text, 'video call');
  t.equal(videoMeta.contentLength, undefined);
  t.equal(videoMeta.duration, '00:31:00');

  const imageOnlyMeta = getContentMeta({
    fileName: 'image-only.html',
    ariaLabel: 'At today at 8:59, You',
    message: '',
    hasImage: true,
  });
  t.equal(imageOnlyMeta.type, 'image', 'image-only messages are classified as image');
  t.equal(imageOnlyMeta.text, 'image sent');
  t.equal(imageOnlyMeta.contentLength, undefined);

  const image2Meta = getContentMeta({
    fileName: 'image-2.html',
    ariaLabel: 'At today at 9:00, You',
    message: '',
    hasImage: true,
    imageCount: 2,
  });
  t.equal(image2Meta.type, 'image', 'image-2 files are classified as image');
  t.equal(image2Meta.imageCount, 2, 'image-2 imageCount is preserved');

  const image3Meta = getContentMeta({
    fileName: 'image-3.html',
    ariaLabel: 'At today at 9:00, You',
    message: '',
    hasImage: true,
    imageCount: 4,
  });
  t.equal(image3Meta.type, 'image', 'image-3 files are classified as image');
  t.equal(image3Meta.imageCount, 4, 'image-3 imageCount is preserved');

  t.end();
});

// ---------------------------------------------------------------------------
// testLinkFileUsesLinkType
// ---------------------------------------------------------------------------

tap.test('testLinkFileUsesLinkType', (t) => {
  const result = getContentMeta({
    fileName: 'link-text.html',
    ariaLabel: 'At Thursday 5:34pm, Alpha: image sent',
    message: 'image sent',
    rawMeta: { link: 'https://www.scan.co.uk/' },
    hasLink: false,
  });
  t.equal(result.type, 'link', 'link-text files is classified as link when raw meta link is present');
  t.equal(result.text, 'https://www.scan.co.uk/ image sent', 'link-text content includes URL prefix and user text');
  t.ok(result.text.includes('image sent'), 'link-text content keep message text after the URL');
  t.ok(/\d+ words$/.test(result.contentLength), 'link-text previews with text includes content_length');
  t.equal(result.link, 'https://www.scan.co.uk/');
  t.end();
});

// ---------------------------------------------------------------------------
// testMissedCallNoDuration
// ---------------------------------------------------------------------------

tap.test('testMissedCallNoDuration', (t) => {
  const result = getContentMeta({
    fileName: 'missed-calls.html',
    ariaLabel: 'At Thursday 5:34pm, Alpha: Missed audio call',
    message: 'Missed audio call',
    rawMeta: {},
    hasLink: false,
  });
  t.equal(result.type, 'missed-call');
  t.equal(result.duration, null, 'missed calls does not include duration');
  t.equal(result.contentLength, undefined, 'missed-call previews does not include content_length');
  t.end();
});

// ---------------------------------------------------------------------------
// textMessageDoesNotBecomeVoiceMessage
// ---------------------------------------------------------------------------

tap.test('textMessageDoesNotBecomeVoiceMessage', (t) => {
  const meta = getContentMeta({
    fileName: '',
    ariaLabel: 'At 3:30 PM, John: Hello how are you doing today',
    message: 'Hello how are you doing today',
    timerText: '',
  });
  t.equal(meta.type, 'text', 'text message with no timer not be classified as voice-message');
  t.end();
});

tap.test('reactionAsciiSmileyPreservesContent', (t) => {
  const meta = getContentMeta({
    fileName: '',
    ariaLabel: 'At 3:30 PM, John: :)',
    message: ':)',
    timerText: '',
  });
  t.equal(meta.type, 'reaction', 'pure smiley text should be classified as reaction');
  t.equal(meta.text, ':)', 'ascii smiley content should be preserved for reaction text');
  t.equal(meta.contentLength, '1 words', 'smiley content length should count as 1 words');
  t.end();
});

tap.test('textContentLengthUsesWordCount', (t) => {
  const meta = getContentMeta({
    fileName: 'text.html',
    ariaLabel: 'At 4:00 PM, John: Hello world from messenger',
    message: 'Hello world from messenger',
    timerText: '',
  });
  t.equal(meta.type, 'text', 'message should be classified as text');
  t.equal(meta.contentLength, '4 words', 'text content length should count words not chars');
  t.end();
});

// ---------------------------------------------------------------------------
// chooseRuleAllEntries
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// extractMessageEntry - replied message extraction
// ---------------------------------------------------------------------------

tap.test('extractMessageEntry replied text', (t) => {
  const { JSDOM } = require('jsdom');
  const { extractMessageEntry } = require('../src/shared/export-text');

  const html = `<div aria-label="At April 16, 2026, 10:55 AM, Alpha: Reply text" aria-roledescription="message">
    <h3><span>Alpha replied to you</span></h3>
    <div aria-label="Go to replied message" role="button" tabindex="-1">
      <div><span dir="auto"><div><div>Original quoted text</div></div></span></div>
    </div>
    <span dir="auto"><div>Reply text</div></span>
  </div>`;
  const doc = new JSDOM(html).window.document;
  const el = doc.querySelector('[aria-roledescription="message"]');
  const entry = extractMessageEntry(el, 'text-replied.html', '2026.04.16 12:00');
  t.equal(entry.semanticType, 'text', 'replied message type is text');
  t.equal(entry.repliedTo, 'Original quoted text', 'repliedTo extracts quoted text');
  t.equal(entry.repliedType, 'text', 'repliedType is text');
  t.end();
});

tap.test('extractMessageEntry replied image', (t) => {
  const { JSDOM } = require('jsdom');
  const { extractMessageEntry } = require('../src/shared/export-text');

  const html = `<div aria-label="At April 14, 2026, 6:34 PM, Alpha: Reply text" aria-roledescription="message">
    <h3><span>Alpha replied to you</span></h3>
    <div aria-label="Go to replied message" role="button" tabindex="-1">
      <div><img alt="Original image" src="blob:test"></div>
    </div>
    <span dir="auto"><div>Reply text</div></span>
  </div>`;
  const doc = new JSDOM(html).window.document;
  const el = doc.querySelector('[aria-roledescription="message"]');
  const entry = extractMessageEntry(el, 'text-image-replied.html', '2026.04.14 18:34');
  t.equal(entry.semanticType, 'text', 'image-replied message type is text');
  t.equal(entry.repliedTo, 'Original image', 'repliedTo extracts img alt text');
  t.equal(entry.repliedType, 'image', 'repliedType is image');
  t.end();
});

tap.test('extractMessageEntry non-reply has null fields', (t) => {
  const { JSDOM } = require('jsdom');
  const { extractMessageEntry } = require('../src/shared/export-text');

  const html = `<div aria-label="At April 14, 2026, 6:34 PM, Alpha: Normal message" aria-roledescription="message">
    <span dir="auto"><div>Normal message</div></span>
  </div>`;
  const doc = new JSDOM(html).window.document;
  const el = doc.querySelector('[aria-roledescription="message"]');
  const entry = extractMessageEntry(el, 'text.html', '2026.04.14 18:34');
  t.equal(entry.semanticType, 'text', 'non-reply message type is text');
  t.equal(entry.repliedTo, null, 'non-reply repliedTo is null');
  t.equal(entry.repliedType, null, 'non-reply repliedType is null');
  t.end();
});

tap.test('chooseRuleAllEntries', (t) => {
  const cases = [
    { file: 'deleted.html', label: '', expected: 'unsent' },
    { file: 'missed-audio-call.html', label: '', expected: 'missed-call' },
    { file: 'missed-call-audio.html', label: '', expected: 'missed-call' },
    { file: 'missed-video-call.html', label: '', expected: 'missed-call' },
    { file: 'missed-call-video.html', label: '', expected: 'missed-call' },
    { file: 'audio-call.html', label: '', expected: 'audio-call' },
    { file: 'image.html', label: '', expected: 'image' },
    { file: 'link-embed-no-text.html', label: '', expected: 'link' },
    { file: 'link-text.html', label: '', expected: 'link' },
    { file: 'text-image-replied.html', label: '', expected: 'text' },
    { file: 'text-replied.html', label: '', expected: 'text' },
    { file: 'call-video.html', label: '', expected: 'video-call' },
    { file: 'video-call.html', label: '', expected: 'video-call' },
    { file: 'voice-note.html', label: '', expected: 'voice-note' },
    { file: 'sticker.html', label: '', expected: 'sticker' },
    { file: 'animated-gif.html', label: '', expected: 'reaction' },
    { file: 'poll.html', label: '', expected: 'poll' },
    { file: 'reaction.html', label: '', expected: 'reaction' },
    { file: 'reaction-emoji.html', label: '', expected: 'reaction' },
    { file: 'video-link.html', label: '', expected: 'link' },
    { file: 'text.html', label: '', expected: 'text' },
    { file: '', label: 'Missed audio call', expected: 'missed-call' },
    { file: '', label: 'Missed video call', expected: 'missed-call' },
    { file: '', label: 'audio call 5 mins', expected: 'audio-call' },
    { file: '', label: 'image sent', expected: 'image' },
    { file: '', label: 'open attachment', expected: 'link' },
    { file: '', label: 'voice message 1:05', expected: 'voice-note' },
    { file: '', label: 'voice note', expected: 'voice-note' },
    { file: '', label: 'sticker', expected: 'sticker' },
    { file: '', label: 'This is a gif', expected: 'reaction' },
    { file: '', label: '👍', expected: 'reaction' },
    { file: '', label: 'At 11:16 AM, You: 🥳', expected: 'reaction' },
    { file: '', label: 'At 11:57 AM, You: https://youtube.com/shorts/IKS2vNOcZ7A', expected: 'link' },
    { file: '', label: 'At 12:00 PM, You: https://instagram.com/p/xyz', expected: 'link' },
    { file: '', label: 'At 12:01 PM, You: https://twitter.com/user/status/123', expected: 'link' },
    { file: '', label: 'At 12:02 PM, You: https://x.com/user/status/123', expected: 'link' },
    { file: '', label: 'At 12:03 PM, You: https://twitch.tv/clip/abc', expected: 'link' },
    { file: '', label: 'Hello how are you', expected: 'text' },
  ];

  cases.forEach(({ file, label, expected }) => {
    const rule = chooseRule(file, label);
    t.equal(
      rule && rule.type === 'you-text' ? 'text' : rule && rule.type,
      expected,
      `chooseRule(${JSON.stringify(file)}, ${JSON.stringify(label)}) → ${expected}`
    );
  });
  t.end();
});
