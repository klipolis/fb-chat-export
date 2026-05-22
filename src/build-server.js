const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { ensureDir, emptyDir, aliasChatNames, collectAutoName } = require('./shared/utils');
const { createOptimizedHtml } = require('./shared/optimize-html');
const { runCreateNodes } = require('./shared/create-nodes');
const {
  buildEntriesFromDocument,
  buildExportText,
  formatExportFileName,
  formatExportHeader,
  formatLine,
  formatSummarySection,
} = require('./shared/export-text');
const { chooseRule } = require('./shared/message-metadata');

const baseDir = path.resolve(__dirname, '..');
const rawDir = path.join(baseDir, 'demo/input-html-raw');
const optimizedDir = path.join(baseDir, 'demo/output-html');
const previewDir = path.join(baseDir, 'demo/output-json');
const rawMetadataPath = path.join(previewDir, 'raw-input-metadata.json');
const exportDir = path.join(baseDir, 'demo/output-txt');

const relRaw = './demo/input-html-raw';
const relOptimized = './demo/output-html';
const relPreview = './demo/output-json';
const relExport = './demo/output-txt';

const aliasNamesPath = path.join(baseDir, 'demo/alias-names.json');
const aliasNameMap = fs.existsSync(aliasNamesPath)
  ? JSON.parse(fs.readFileSync(aliasNamesPath, 'utf8'))
  : {};

const writeRaw = process.env.BUILD_RAW === 'true';

function optimizeFile(fileName, rawHtml, cleanedHtml) {
  const inputPath = path.join(rawDir, fileName);
  const outputPath = path.join(optimizedDir, fileName);
  if (writeRaw && cleanedHtml !== rawHtml) {
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
    files: fileRecords,
  };
  fs.writeFileSync(rawMetadataPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function getFileRecord(fileName) {
  const filePath = path.join(rawDir, fileName);
  const stats = fs.statSync(filePath);
  return {
    fileName,
    mtimeMs: stats.mtimeMs,
    size: stats.size,
  };
}

function buildTextEntries(files, cleanedHtmlByFile) {
  const entries = [];

  files.forEach((fileName) => {
    const html =
      cleanedHtmlByFile?.get(fileName) ??
      fs.readFileSync(path.join(rawDir, fileName), 'utf8');
    const document = new JSDOM(html).window.document;
    const docEntries = buildEntriesFromDocument(document, fileName);
    if (!docEntries.length) {
      return;
    }

    const expectedType = (() => {
      const rule = chooseRule(fileName, '');
      if (!rule || !rule.type) return 'text';
      return rule.type === 'you-text' ? 'text' : rule.type;
    })();

    const matchingType = docEntries.filter((entry) => entry.semanticType === expectedType);
    let preferred = matchingType[0];
    if (expectedType === 'link') {
      preferred =
        matchingType.find((entry) => /^https?:\/\//i.test(String(entry.content || ''))) ||
        matchingType[0];
    }

    entries.push(preferred || docEntries[0]);
  });

  return entries.sort((a, b) => a.ts - b.ts);
}

function buildTextExport(files, options = {}) {
  const sorted = buildTextEntries(files);
  const lines = sorted.map((entry) => formatLine(entry, options));
  const headerText = formatExportHeader({
    method: 'server',
    messageTypes: files.map((fileName) => path.parse(fileName).name),
    exportOptions: {
      includeContent: true,
      includeLength: true,
      includeSummary: Boolean(options.includeSummary),
    },
    aliasMap: aliasNameMap,
  });
  const summaryText = options.includeSummary
    ? formatSummarySection(sorted, { useMessageLabel: options.useMessageLabel })
    : '';
  return buildExportText(lines, `${headerText}${summaryText}`);
}

function summaryParticipants() {
  const any = aliasNameMap.any || 'Alpha';
  const explicit = Object.entries(aliasNameMap)
    .filter(([k]) => k !== 'any')
    .map(([, v]) => v);
  return [any, ...explicit];
}

function writeTextExports(files, cleanedHtmlByFile) {
  ensureDir(exportDir);
  const sortedEntries = buildTextEntries(files, cleanedHtmlByFile);
  const contentOnLines = sortedEntries.map((entry) =>
    formatLine(entry, { includeContent: true, includeLength: true })
  );
  const contentOffLines = sortedEntries.map((entry) =>
    formatLine(entry, { includeContent: false, includeLength: true })
  );

  const headerTextContentOn = formatExportHeader({
    method: 'server',
    messageTypes: files.map((fileName) => path.parse(fileName).name),
    exportOptions: {
      includeContent: true,
      includeLength: true,
      includeSummary: true,
    },
    aliasMap: aliasNameMap,
  });
  const headerTextContentOff = formatExportHeader({
    method: 'server',
    messageTypes: files.map((fileName) => path.parse(fileName).name),
    exportOptions: {
      includeContent: false,
      includeLength: true,
      includeSummary: false,
    },
    aliasMap: aliasNameMap,
  });
  const headerTextSummaryOnly = formatExportHeader({
    method: 'server',
    messageTypes: files.map((fileName) => path.parse(fileName).name),
    exportOptions: {
      includeContent: false,
      includeLength: false,
      includeSummary: true,
    },
    aliasMap: aliasNameMap,
  });
  const participants = summaryParticipants();
  const summaryTextForContentOn = formatSummarySection(sortedEntries, { useMessageLabel: true, fixedParticipants: participants });
  const summaryTextForSummaryOnly = formatSummarySection(sortedEntries, { fixedParticipants: participants });
  const contentOn = buildExportText(contentOnLines, `${headerTextContentOn}${summaryTextForContentOn}`);
  const contentOff = buildExportText(contentOffLines, headerTextContentOff);

  const summaryOnly = buildExportText([], `${headerTextSummaryOnly}${summaryTextForSummaryOnly}`);

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
  const previousFileMap = new Map(
    (previousRawMetadata?.files || []).map((file) => [file.fileName, file])
  );
  const files = fs.readdirSync(rawDir).filter((name) => name.endsWith('.html'));
  if (!files.length) {
    console.error('No raw HTML files found in', relRaw);
    process.exit(1);
  }

  // Read all raw HTML before modifying anything, then detect the
  // "any" replacement name once across all files (two-pass approach).
  const rawHtmlByFile = new Map(
    files.map((fileName) => [
      fileName,
      fs.readFileSync(path.join(rawDir, fileName), 'utf8'),
    ])
  );
  const preDetectedName = collectAutoName(
    Array.from(rawHtmlByFile.values()),
    aliasNameMap
  );

  // Build aliased HTML for every file (used for both optimized output
  // and text-export entry parsing, so names are correct without write-back).
  const cleanedHtmlByFile = new Map(
    files.map((fileName) => [
      fileName,
      aliasChatNames(rawHtmlByFile.get(fileName), aliasNameMap, preDetectedName),
    ])
  );

  const fileRecords = files.map((fileName) => {
    optimizeFile(fileName, rawHtmlByFile.get(fileName), cleanedHtmlByFile.get(fileName));
    return getFileRecord(fileName);
  });

  writeRawMetadata(fileRecords);

  const unchanged = fileRecords.every((record) => {
    const previous = previousFileMap.get(record.fileName);
    return previous && previous.mtimeMs === record.mtimeMs && previous.size === record.size;
  });
  if (unchanged) {
    console.log('Raw input files are unchanged since the last build.');
  }

  runCreateNodes();
  const exportPaths = writeTextExports(files, cleanedHtmlByFile);
  console.log(`Done: HTML + JSON in ./demo/output-html and ./demo/output-json`);
  exportPaths.forEach((exportPath) => {
    console.log(`Generated chat text export: ${path.relative(baseDir, exportPath)}`);
  });
}

main();
