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
const { resolveRepoPath } = require('./shared/app-config');

const rawDir = resolveRepoPath('data-input');
const optimizedDir = resolveRepoPath('data-output', 'optimized-html');
const previewDir = resolveRepoPath('data-output', 'json-format');
const rawMetadataPath = resolveRepoPath('data-output', 'json-format', 'raw-input-metadata.json');
const exportDir = resolveRepoPath('data-output', 'final-export');

const relRaw = './data-input';
const relOptimized = './data-output/optimized-html';
const relPreview = './data-output/json-format';
const relExport = './data-output/final-export';

const sharedConfigPath = resolveRepoPath('data-config', 'frontend_shared.json');
const serverConfigPath = resolveRepoPath('data-config', 'server.json');

const sharedConfig = fs.existsSync(sharedConfigPath)
  ? JSON.parse(fs.readFileSync(sharedConfigPath, 'utf8'))
  : {};
const serverConfig = fs.existsSync(serverConfigPath)
  ? JSON.parse(fs.readFileSync(serverConfigPath, 'utf8'))
  : {};

const aliasNameMap = sharedConfig.aliasNames || {};
const baseDir = resolveRepoPath('.');

const writeRaw = process.env.BUILD_RAW === 'true';
const referenceDate = process.env.BUILD_REFERENCE_DATE ||
  (serverConfig.overwriteToday ? `${serverConfig.overwriteToday.replace(/-/g, '.')} 00:00` : '2026.05.22 00:00');

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

function buildTextEntries(files, cleanedHtmlByFile, referenceDate) {
  const entries = [];

  files.forEach((fileName) => {
    const html =
      cleanedHtmlByFile?.get(fileName) ??
      fs.readFileSync(path.join(rawDir, fileName), 'utf8');
    const document = new JSDOM(html).window.document;
    const docEntries = buildEntriesFromDocument(document, fileName, referenceDate);
    if (!docEntries.length) {
      return;
    }

    entries.push(...docEntries);
  });

  return entries.sort((a, b) => a.ts - b.ts);
}

function buildTextExport(files, options = {}, referenceDate) {
  const sorted = buildTextEntries(files, undefined, referenceDate);
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

function writeTextExports(files, cleanedHtmlByFile, referenceDate) {
  ensureDir(exportDir);
  const sortedEntries = buildTextEntries(files, cleanedHtmlByFile, referenceDate);
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
  const summaryTextForSummaryOnlyCombined = formatSummarySection(sortedEntries, {
    useMessageLabel: false,
    fixedParticipants: participants,
  });
  const summaryTextForSummaryOnlyDetailed = formatSummarySection(sortedEntries, {
    useMessageLabel: false,
    fixedParticipants: participants,
    detailed: true,
  });
  const contentOn = buildExportText(contentOnLines, `${headerTextContentOn}${summaryTextForContentOn}`);
  const contentOff = buildExportText(contentOffLines, headerTextContentOff);

  const summaryCombined = buildExportText([], `${headerTextSummaryOnly}${summaryTextForSummaryOnlyCombined}`);
  const summaryDetailed = buildExportText([], `${headerTextSummaryOnly}${summaryTextForSummaryOnlyDetailed}`);

  const onPath = path.join(exportDir, formatExportFileName('export-max'));
  const offPath = path.join(exportDir, formatExportFileName('export-minimal'));
  const summaryCombinedPath = path.join(exportDir, 'export-summary-combined.txt');
  const summaryDetailedPath = path.join(exportDir, 'export-summary-detailed.txt');
  fs.writeFileSync(onPath, contentOn, 'utf8');
  fs.writeFileSync(offPath, contentOff, 'utf8');
  fs.writeFileSync(summaryCombinedPath, summaryCombined, 'utf8');
  fs.writeFileSync(summaryDetailedPath, summaryDetailed, 'utf8');
  return [onPath, offPath, summaryCombinedPath, summaryDetailedPath];
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
  const exportPaths = writeTextExports(files, cleanedHtmlByFile, referenceDate);
  console.log(`Done: HTML + JSON in ./data-output/optimized-html and ./data-output/json-format`);
  exportPaths.forEach((exportPath) => {
    console.log(`Generated chat text export: ${path.relative(baseDir, exportPath)}`);
  });
}

main();
