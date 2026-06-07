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
