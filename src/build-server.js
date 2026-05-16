const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { ensureDir, emptyDir, anonymizeChatNames } = require('./shared/utils');
const { createOptimizedHtml } = require('./shared/optimize-html');
const { runCreateNodes } = require('./shared/create-nodes');
const { buildEntriesFromDocument, buildExportText, formatExportFileName, formatExportHeader, formatLine, formatSummarySection } = require('./shared/export-text');
const { chooseRule } = require('./shared/message-metadata');

const baseDir = path.resolve(__dirname, '..');
const rawDir = path.join(baseDir, 'Data-input-html-raw');
const optimizedDir = path.join(baseDir, 'Data-output-html');
const previewDir = path.join(baseDir, 'Data-output-json');
const rawMetadataPath = path.join(previewDir, 'raw-input-metadata.json');
const exportDir = path.join(baseDir, 'Data-output-txt');

const relRaw = './Data-input-html-raw';
const relOptimized = './Data-output-html';
const relPreview = './Data-output-json';
const relExport = './Data-output-txt';

function optimizeFile(fileName) {
  const inputPath = path.join(rawDir, fileName);
  const outputPath = path.join(optimizedDir, fileName);
  const rawHtml = fs.readFileSync(inputPath, 'utf8');
  const cleanedHtml = anonymizeChatNames(rawHtml);
  if (cleanedHtml !== rawHtml) {
    fs.writeFileSync(inputPath, cleanedHtml, 'utf8');
  }
  const html = createOptimizedHtml(cleanedHtml);
  fs.writeFileSync(outputPath, html, 'utf8');
}

function loadRawMetadata() {
  if (!fs.existsSync(rawMetadataPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(rawMetadataPath, 'utf8'));
  } catch {
    return null;
  }
}

function writeRawMetadata(fileRecords) {
  const payload = {
    files: fileRecords
  };
  fs.writeFileSync(rawMetadataPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function getFileRecord(fileName) {
  const filePath = path.join(rawDir, fileName);
  const stats = fs.statSync(filePath);
  return {
    fileName,
    mtimeMs: stats.mtimeMs,
    size: stats.size
  };
}

function buildTextEntries(files) {
  const entries = [];

  files.forEach(fileName => {
    const rawHtml = fs.readFileSync(path.join(rawDir, fileName), 'utf8');
    const document = new JSDOM(rawHtml).window.document;
    const docEntries = buildEntriesFromDocument(document, fileName);
    if (!docEntries.length) {
      return;
    }

    const expectedType = (() => {
      const rule = chooseRule(fileName, '');
      if (!rule || !rule.type) return 'text';
      return rule.type === 'you-text' ? 'text' : rule.type;
    })();

    const matchingType = docEntries.filter(entry => entry.semanticType === expectedType);
    let preferred = matchingType[0];
    if (expectedType === 'link') {
      preferred = matchingType.find(entry => /^https?:\/\//i.test(String(entry.content || ''))) || matchingType[0];
    }

    entries.push(preferred || docEntries[0]);
  });

  return entries.sort((a, b) => a.ts - b.ts);
}

function buildTextExport(files, options = {}) {
  const sorted = buildTextEntries(files);
  const lines = sorted.map(entry => formatLine(entry, options));
  const headerText = formatExportHeader({
    method: 'server',
    messageTypes: files.map(fileName => path.parse(fileName).name)
  });
  const summaryText = options.includeSummary ? formatSummarySection(sorted) : '';
  return buildExportText(lines, `${headerText}${summaryText}`);
}

function writeTextExports(files) {
  ensureDir(exportDir);
  const sortedEntries = buildTextEntries(files);
  const contentOnLines = sortedEntries.map(entry => formatLine(entry, { includeContent: true, includeLength: true }));
  const contentOffLines = sortedEntries.map(entry => formatLine(entry, { includeContent: false, includeLength: true }));

  const headerText = formatExportHeader({
    method: 'server',
    messageTypes: files.map(fileName => path.parse(fileName).name)
  });
  const summaryText = formatSummarySection(sortedEntries);
  const contentOn = buildExportText(contentOnLines, `${headerText}${summaryText}`);
  const contentOff = buildExportText(contentOffLines, headerText);

  const summaryOnly = buildExportText([], `${headerText}${summaryText}`);

  const onPath = path.join(exportDir, formatExportFileName('content-on'));
  const offPath = path.join(exportDir, formatExportFileName('content-off'));
  const summaryPath = path.join(exportDir, 'fb-chats-export-summary.txt');
  fs.writeFileSync(onPath, contentOn, 'utf8');
  fs.writeFileSync(offPath, contentOff, 'utf8');
  fs.writeFileSync(summaryPath, summaryOnly, 'utf8');
  return [onPath, offPath, summaryPath];
}

function main() {
  ensureDir(optimizedDir);
  ensureDir(previewDir);
  ensureDir(exportDir);
  emptyDir(optimizedDir);
  emptyDir(previewDir);
  emptyDir(exportDir);

  if (!fs.existsSync(rawDir)) {
    console.error('Missing HTML Raw folder:', relRaw);
    process.exit(1);
  }

  const previousRawMetadata = loadRawMetadata();
  const previousFileMap = new Map((previousRawMetadata?.files || []).map(file => [file.fileName, file]));
  const files = fs.readdirSync(rawDir).filter(name => name.endsWith('.html'));
  if (!files.length) {
    console.error('No raw HTML files found in', relRaw);
    process.exit(1);
  }

  const fileRecords = files.map(fileName => {
    const filePath = path.join(rawDir, fileName);
    const rawHtml = fs.readFileSync(filePath, 'utf8');
    const cleanedHtml = anonymizeChatNames(rawHtml);
    const hasChanged = cleanedHtml !== rawHtml;

    if (hasChanged) {
      fs.writeFileSync(filePath, cleanedHtml, 'utf8');
    }

    optimizeFile(fileName);
    return getFileRecord(fileName);
  });

  writeRawMetadata(fileRecords);

  const unchanged = fileRecords.every(record => {
    const previous = previousFileMap.get(record.fileName);
    return previous && previous.mtimeMs === record.mtimeMs && previous.size === record.size;
  });
  if (unchanged) {
    console.log('Raw input files are unchanged since the last build.');
  }

  runCreateNodes();
  const exportPaths = writeTextExports(files);
  console.log(`Done: HTML + JSON in ./Data-output-html and ./Data-output-json`);
  exportPaths.forEach(exportPath => {
    console.log(`Generated chat text export: ${path.relative(baseDir, exportPath)}`);
  });
}

main();
