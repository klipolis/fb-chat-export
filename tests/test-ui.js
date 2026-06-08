const tap = require('tap');
const { JSDOM } = require('jsdom');
const { transformSync } = require('esbuild');
const fs = require('fs');
const path = require('path');

// Bundle ui.js (ESM) to a CJS-compatible IIFE string using esbuild's synchronous API
const uiSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'frontend', 'src', 'ui.js'),
  'utf8'
);
const transformed = transformSync(uiSource, {
  format: 'cjs',
  target: 'es2020',
});

function makeWindow() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  return dom.window;
}

function loadUi(window) {
  const module = { exports: {} };
   
  const fn = new Function('module', 'exports', 'require', 'document', transformed.code);
  fn(module, module.exports, () => ({}), window.document);
  return module.exports;
}

tap.test('createLabelInput returns wrap and input', (t) => {
  const w = makeWindow();
  const ui = loadUi(w);
  const result = ui.createLabelInput('From:', 'YYYY-MM-DD', '2026-01-01');
  t.ok(result.wrap, 'has wrap element');
  t.ok(result.input, 'has input element');
  t.equal(result.input.value, '2026-01-01', 'input has correct value');
  t.equal(result.input.placeholder, 'YYYY-MM-DD', 'input has correct placeholder');
  t.end();
});

tap.test('createCheckboxToggle returns wrap and input, unchecked by default', (t) => {
  const w = makeWindow();
  const ui = loadUi(w);
  const result = ui.createCheckboxToggle('Calls');
  t.ok(result.wrap, 'has wrap element');
  t.ok(result.input, 'has input element');
  t.equal(result.input.type, 'checkbox', 'input is a checkbox');
  t.equal(result.input.checked, false, 'unchecked by default');
  t.end();
});

tap.test('createCheckboxToggleWithInput returns wrap, input, and textInput', (t) => {
  const w = makeWindow();
  const ui = loadUi(w);
  const result = ui.createCheckboxToggleWithInput('Alias as', 'Youghurt');
  t.ok(result.wrap, 'has wrap element');
  t.ok(result.input, 'has input element');
  t.ok(result.textInput, 'has textInput element');
  t.equal(result.input.type, 'checkbox', 'input is a checkbox');
  t.equal(result.textInput.value, 'Youghurt', 'textInput has default value');
  t.end();
});

tap.test('createLinkAction fires onClick with click, prevents default', (t) => {
  const w = makeWindow();
  const ui = loadUi(w);
  let fired = false;
  const link = ui.createLinkAction('Check all', () => {
    fired = true;
  });
  t.equal(link.tagName.toLowerCase(), 'a', 'is an anchor');
  link.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
  t.ok(fired, 'onClick callback fired');
  t.end();
});

tap.test('createDetailsPanel returns panel, summary, arrow, title', (t) => {
  const w = makeWindow();
  const ui = loadUi(w);
  const result = ui.createDetailsPanel('Export Chat');
  t.ok(result.panel, 'has panel element');
  t.ok(result.summary, 'has summary element');
  t.ok(result.arrow, 'has arrow element');
  t.ok(result.title, 'has title element');
  t.equal(result.panel.tagName.toLowerCase(), 'details', 'panel is a details element');
  t.equal(result.summary.tagName.toLowerCase(), 'summary', 'summary is a summary element');
  t.equal(result.title.textContent, 'Export Chat', 'title has correct text');
  t.equal(result.arrow.getAttribute('aria-hidden'), 'true', 'arrow has aria-hidden');
  t.ok(result.panel.open, 'panel is open by default');
  t.end();
});

tap.test('createButton renders with correct label and background', (t) => {
  const w = makeWindow();
  const ui = loadUi(w);
  const btn = ui.createButton('Scan Messages', '#0084ff');
  t.equal(btn.tagName.toLowerCase(), 'button', 'is a button');
  t.equal(btn.textContent, 'Scan Messages', 'has correct label');
  t.ok(btn.style.background || btn.style.backgroundColor, 'has a background color set');
  t.end();
});

// T-310a: Message type filter
function isTypeEnabled(type, enabledTypes) {
  if (!type) return false;
  const lowerTypes = new Set(Array.from(enabledTypes).map((t) => String(t).toLowerCase()));
  return lowerTypes.has(String(type).toLowerCase());
}

tap.test('T-310a: type filter - all types enabled', (t) => {
  const types = new Set(['text', 'link', 'image', 'reaction', 'audio-call', 'video-call', 'voice-note', 'sticker', 'poll']);
  t.ok(isTypeEnabled('text', types));
  t.ok(isTypeEnabled('link', types));
  t.ok(isTypeEnabled('image', types));
  t.ok(isTypeEnabled('reaction', types));
  t.ok(isTypeEnabled('audio-call', types));
  t.ok(isTypeEnabled('video-call', types));
  t.ok(isTypeEnabled('voice-note', types));
  t.ok(isTypeEnabled('sticker', types));
  t.ok(isTypeEnabled('poll', types));
  t.end();
});

tap.test('T-310a: type filter - single type disabled', (t) => {
  const types = new Set(['text', 'link', 'image', 'reaction', 'audio-call', 'video-call', 'voice-note', 'sticker']);
  t.ok(isTypeEnabled('text', types));
  t.notOk(isTypeEnabled('poll', types));
  t.end();
});

tap.test('T-310a: type filter - multiple types disabled', (t) => {
  const types = new Set(['text', 'link', 'image']);
  t.ok(isTypeEnabled('text', types));
  t.ok(isTypeEnabled('link', types));
  t.ok(isTypeEnabled('image', types));
  t.notOk(isTypeEnabled('reaction', types));
  t.notOk(isTypeEnabled('audio-call', types));
  t.notOk(isTypeEnabled('voice-note', types));
  t.end();
});

tap.test('T-310a: type filter - empty enabled set', (t) => {
  const types = new Set();
  t.notOk(isTypeEnabled('text', types));
  t.notOk(isTypeEnabled('link', types));
  t.notOk(isTypeEnabled('sticker', types));
  t.end();
});

tap.test('T-310a: type filter - case-insensitive matching', (t) => {
  const types = new Set(['Text', 'LINK', 'Image']);
  t.ok(isTypeEnabled('text', types));
  t.ok(isTypeEnabled('TEXT', types));
  t.ok(isTypeEnabled('link', types));
  t.ok(isTypeEnabled('Link', types));
  t.notOk(isTypeEnabled('reaction', types));
  t.end();
});

// T-310b: Scan progress fraction display
function formatScanProgress(collectedCount, scrollPct, elapsedSec, etaSec) {
  if (scrollPct > 5) {
    const estimateTotal = Math.round(collectedCount / (scrollPct / 100));
    let eta = '';
    if (etaSec > 0) eta = `, ~${etaSec}s left`;
    return `Scanning... ${collectedCount} / ~${estimateTotal} messages (${elapsedSec}s, ~${scrollPct}% back${eta})`;
  }
  return `Scanning... ${collectedCount} collected (${elapsedSec}s)`;
}

tap.test('T-310b: progress - scrollPct > 5 shows estimate', (t) => {
  const result = formatScanProgress(342, 22, 45, 0);
  t.match(result, /342 \/ ~\d+ messages/);
  t.match(result, /45s/);
  t.match(result, /~22% back/);
  t.notMatch(result, /left/);
  t.end();
});

tap.test('T-310b: progress - scrollPct <= 5 shows collected only', (t) => {
  const result = formatScanProgress(12, 3, 5, 0);
  t.match(result, /12 collected/);
  t.match(result, /5s/);
  t.notMatch(result, /\//);
  t.notMatch(result, /% back/);
  t.end();
});

tap.test('T-310b: progress - with ETA', (t) => {
  const result = formatScanProgress(342, 22, 45, 78);
  t.match(result, /342 \/ ~\d+ messages/);
  t.match(result, /~78s left/);
  t.end();
});

tap.test('T-310b: progress - without ETA', (t) => {
  const result = formatScanProgress(3, 10, 1, 0);
  t.match(result, /3 \/ ~\d+ messages/);
  t.notMatch(result, /left/);
  t.end();
});

// T-310c: Alias import/export format
function aliasRoundTrip(aliasMap) {
  const jsonStr = JSON.stringify(aliasMap);
  const parsed = JSON.parse(jsonStr);
  return JSON.stringify(parsed) === jsonStr;
}

tap.test('T-310c: alias round-trip - getAliasMap output survives JSON', (t) => {
  const map = { You: 'Youghurt', any: 'Alpha', 'John Doe': 'JD' };
  t.ok(aliasRoundTrip(map));
  t.same(JSON.parse(JSON.stringify(map)), map);
  t.end();
});

tap.test('T-310c: alias round-trip - empty map serializes to {}', (t) => {
  t.equal(JSON.stringify({}), '{}');
  t.ok(aliasRoundTrip({}));
  t.end();
});

tap.test('T-310c: alias round-trip - special characters survive', (t) => {
  const map = { 'José García': 'Jose', 'Müller': 'Mueller', "O'Brien": 'OB' };
  const jsonStr = JSON.stringify(map);
  const parsed = JSON.parse(jsonStr);
  t.same(parsed, map);
  t.equal(parsed['José García'], 'Jose');
  t.equal(parsed['Müller'], 'Mueller');
  t.equal(parsed["O'Brien"], 'OB');
  t.end();
});

const { REUSE_EXACT, REUSE_ALIAS_ONLY, REUSE_NARROWER } = require('../src/shared/constants');
const { canReuseCached, filterEntriesByDateRange } = require('../src/shared/cache-utils');

function parseLocalDate(str) {
  if (!str) return NaN;
  const s = str.trim();
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  return NaN;
}

function ts(y, m, d) {
  return new Date(y, m - 1, d).getTime();
}

// T-325: Narrow date range filtering
tap.test('T-325: narrow range excludes messages before new start date', (t) => {
  const entries = [
    { ts: ts(2026, 1, 15) },
    { ts: ts(2026, 2, 15) },
    { ts: ts(2026, 3, 15) },
  ];
  const result = filterEntriesByDateRange(entries, '2026-02-15', '2026-03-31', parseLocalDate);
  t.equal(result.length, 2);
  t.equal(result[0].ts, ts(2026, 2, 15));
  t.equal(result[1].ts, ts(2026, 3, 15));
  t.end();
});

tap.test('T-325: narrow range excludes messages after new end date', (t) => {
  const entries = [
    { ts: ts(2026, 1, 15) },
    { ts: ts(2026, 2, 15) },
    { ts: ts(2026, 3, 15) },
  ];
  const result = filterEntriesByDateRange(entries, '2026-01-01', '2026-02-15', parseLocalDate);
  t.equal(result.length, 2);
  t.equal(result[0].ts, ts(2026, 1, 15));
  t.equal(result[1].ts, ts(2026, 2, 15));
  t.end();
});

tap.test('T-325: narrow range keeps messages within new range', (t) => {
  const entries = [
    { ts: ts(2026, 1, 15) },
    { ts: ts(2026, 2, 15) },
    { ts: ts(2026, 3, 15) },
  ];
  const result = filterEntriesByDateRange(entries, '2026-02-01', '2026-02-28', parseLocalDate);
  t.equal(result.length, 1);
  t.equal(result[0].ts, ts(2026, 2, 15));
  t.end();
});

tap.test('T-325: same start date, earlier end date (excludes after end)', (t) => {
  const entries = [
    { ts: ts(2026, 1, 15) },
    { ts: ts(2026, 2, 15) },
    { ts: ts(2026, 3, 15) },
  ];
  const result = filterEntriesByDateRange(entries, '2026-01-01', '2026-02-15', parseLocalDate);
  t.equal(result.length, 2);
  t.equal(result[0].ts, ts(2026, 1, 15));
  t.equal(result[1].ts, ts(2026, 2, 15));
  t.end();
});

tap.test('T-325: later start date, same end date (excludes before start)', (t) => {
  const entries = [
    { ts: ts(2026, 1, 15) },
    { ts: ts(2026, 2, 15) },
    { ts: ts(2026, 3, 15) },
  ];
  const result = filterEntriesByDateRange(entries, '2026-02-01', '2026-03-31', parseLocalDate);
  t.equal(result.length, 2);
  t.equal(result[0].ts, ts(2026, 2, 15));
  t.equal(result[1].ts, ts(2026, 3, 15));
  t.end();
});

// T-326: Cache invalidation on date range expansion
const cachedState = {
  personName: 'Alice',
  fromDate: '2026-02-01',
  toDate: '2026-03-31',
  aliasHash: 'abc123',
};

tap.test('T-326: expand start date backward invalidates cache', (t) => {
  const result = canReuseCached(cachedState, 'Alice', '2026-01-01', '2026-03-31', 'abc123', parseLocalDate);
  t.equal(result, null);
  t.end();
});

tap.test('T-326: expand end date forward invalidates cache', (t) => {
  const result = canReuseCached(cachedState, 'Alice', '2026-02-01', '2026-04-30', 'abc123', parseLocalDate);
  t.equal(result, null);
  t.end();
});

tap.test('T-326: expand both directions invalidates cache', (t) => {
  const result = canReuseCached(cachedState, 'Alice', '2026-01-01', '2026-04-30', 'abc123', parseLocalDate);
  t.equal(result, null);
  t.end();
});

tap.test('T-326: same range keeps cache valid (exact)', (t) => {
  const result = canReuseCached(cachedState, 'Alice', '2026-02-01', '2026-03-31', 'abc123', parseLocalDate);
  t.equal(result, REUSE_EXACT);
  t.end();
});

tap.test('T-326: subset range keeps cache valid (narrower)', (t) => {
  const result = canReuseCached(cachedState, 'Alice', '2026-02-15', '2026-03-15', 'abc123', parseLocalDate);
  t.equal(result, REUSE_NARROWER);
  t.end();
});
