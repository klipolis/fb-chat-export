const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { ensureDir, emptyDir, aliasChatNames, collectAutoName } = require('./shared/utils');
const { createOptimizedHtml } = require('./shared/optimize-html');
const { runCreateNodes } = require('./shared/create-nodes');
const {
  buildEntriesFromDocument,
  buildExportText,
  formatServerExportFileName,
  formatExportHeader,
  formatLine,
  formatSummarySection,
} = require('./shared/export-text');
const { buildSummaryJson } = require('./shared/export-summary');
const { chooseRule } = require('./shared/message-metadata');
const { resolveRepoPath } = require('./shared/app-config');
const schemaConfig = require('./shared/export-config.json');
const jsonSchema = require('../tests/generated-json-schema.json');

const rawDir = resolveRepoPath('data-input-test');
const hotDir = resolveRepoPath('data-input-test', 'userscript');
const optimizedDir = resolveRepoPath('data-output-auto', 'optimized-html');
const previewDir = resolveRepoPath('data-output-auto', 'json-format');
const rawMetadataPath = resolveRepoPath('data-output-auto', 'json-format', 'raw-input-metadata.json');
const exportDir = resolveRepoPath('data-output-auto', 'final-export');

const sharedConfigPath = resolveRepoPath('data-config', 'frontend_shared.json');
const serverConfigPath = resolveRepoPath('data-config', 'server.json');

const cacheManifestPath = resolveRepoPath('data-output-auto', 'build-cache.json');

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
  const hotPath = path.join(hotDir, fileName);
  const outputPath = path.join(optimizedDir, fileName);
  if (writeRaw && cleanedHtml !== rawHtml) {
    const targetPath = fs.existsSync(hotPath) ? hotPath : inputPath;
    fs.writeFileSync(targetPath, cleanedHtml, 'utf8');
  }
  const html = createOptimizedHtml(cleanedHtml);
  fs.writeFileSync(outputPath, html, 'utf8');
}

function writeRawMetadata(fileRecords) {
  const payload = {
    files: fileRecords,
  };
  fs.writeFileSync(rawMetadataPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function getFileRecord(fileName) {
  const filePath = path.join(rawDir, fileName);
  const hotPath = path.join(hotDir, fileName);
  const sourcePath = fs.existsSync(hotPath) ? hotPath : filePath;
  const stats = fs.statSync(sourcePath);
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
    messageTypes: getBaseSemanticTypes(files),
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

function getBaseSemanticTypes(fileNames) {
  const schemaTypes = schemaConfig.messageTypes;
  const baseTypes = new Set();

  // Map filename stems whose chooseRule type differs from the schema name
  const schemaAlias = {
    'call-video': 'video-call',
    'missed-call-audio': 'missed-audio-call',
    'missed-call-video': 'missed-video-call',
  };

  fileNames.forEach((fileName) => {
    const base = path.parse(fileName).name;
    if (schemaAlias[base]) {
      baseTypes.add(schemaAlias[base]);
    } else {
      const semanticType = base.replace(/-\d+$/, '');
      baseTypes.add(semanticType);
    }
  });
  return schemaTypes.filter((type) => baseTypes.has(type));
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
    messageTypes: getBaseSemanticTypes(files),
    exportOptions: {
      includeContent: true,
      includeLength: true,
      includeSummary: true,
    },
    aliasMap: aliasNameMap,
  });
  const headerTextContentOff = formatExportHeader({
    method: 'server',
    messageTypes: getBaseSemanticTypes(files),
    exportOptions: {
      includeContent: false,
      includeLength: true,
      includeSummary: false,
    },
    aliasMap: aliasNameMap,
  });
  const headerTextSummaryOnly = formatExportHeader({
    method: 'server',
    messageTypes: getBaseSemanticTypes(files),
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

  const onPath = path.join(exportDir, formatServerExportFileName('export-max'));
  const offPath = path.join(exportDir, formatServerExportFileName('export-minimal'));
  const summaryCombinedPath = path.join(exportDir, 'export-summary-combined.txt');
  const summaryDetailedPath = path.join(exportDir, 'export-summary-detailed.txt');
  const rawDateLines = sortedEntries.map((entry) =>
    formatLine(entry, { includeContent: true, includeLength: true, includeRawDate: true })
  );
  const headerTextRawDate = formatExportHeader({
    method: 'server',
    messageTypes: getBaseSemanticTypes(files),
    exportOptions: {
      includeContent: true,
      includeLength: true,
      includeSummary: true,
      includeRawDate: true,
    },
    aliasMap: aliasNameMap,
  });
  const rawDateText = buildExportText(rawDateLines, `${headerTextRawDate}${summaryTextForContentOn}`);

  const summaryJsonPath = path.join(exportDir, 'export-summary-json.txt');
  const summaryJsonText = buildSummaryJson(sortedEntries, { fixedParticipants: participants });
  const rawDatePath = path.join(exportDir, 'export-raw-date.txt');
  fs.writeFileSync(onPath, contentOn, 'utf8');
  fs.writeFileSync(offPath, contentOff, 'utf8');
  fs.writeFileSync(summaryCombinedPath, summaryCombined, 'utf8');
  fs.writeFileSync(summaryDetailedPath, summaryDetailed, 'utf8');
  fs.writeFileSync(summaryJsonPath, summaryJsonText, 'utf8');
  fs.writeFileSync(rawDatePath, rawDateText, 'utf8');
  return [onPath, offPath, summaryCombinedPath, summaryDetailedPath, summaryJsonPath, rawDatePath];
}

function validateGeneratedJson() {
  const files = fs.readdirSync(previewDir).filter((name) => name.endsWith('.json') && name !== 'raw-input-metadata.json');
  const props = jsonSchema.properties;
  const rawProps = props.data_raw.properties;
  const previewProps = props.data_preview.properties;
  let errors = 0;

  files.forEach((fileName) => {
    const data = JSON.parse(fs.readFileSync(path.join(previewDir, fileName), 'utf8'));

    if (typeof data.title !== 'string') { console.error(`  ${fileName}: title must be a string`); errors++; }
    if (typeof data.type !== 'string') { console.error(`  ${fileName}: type must be a string`); errors++; }

    ['data_raw', 'data_preview'].forEach((section) => {
      const obj = data[section];
      if (!obj || typeof obj !== 'object') { console.error(`  ${fileName}: ${section} is required`); errors++; return; }
      const schemaProps = section === 'data_raw' ? rawProps : previewProps;
      Object.keys(schemaProps).forEach((field) => {
        if (!(field in obj)) { console.error(`  ${fileName}: ${section}.${field} is required`); errors++; }
      });
    });

    const raw = data.data_raw;
    if (raw && raw.length !== null && !/^\d+ words$/.test(raw.length)) {
      console.error(`  ${fileName}: data_raw.length must be null or "N words"`);
      errors++;
    }
    if (raw && raw.name !== null && typeof raw.name !== 'string') {
      console.error(`  ${fileName}: data_raw.name must be string or null`);
      errors++;
    }
  });

  if (errors) {
    console.error(`Build validation failed: ${errors} schema violations in generated JSON`);
    process.exit(1);
  }
  console.log(`Validated ${files.length} generated JSON files against schema`);
}

function getConfigMtimes() {
  const configPaths = [sharedConfigPath, serverConfigPath, resolveRepoPath('src/shared/export-config.json')];
  const result = {};
  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      result[p] = fs.statSync(p).mtimeMs;
    }
  }
  return result;
}

function computeInputStates(files) {
  const states = {};
  for (const fileName of files) {
    const hotPath = path.join(hotDir, fileName);
    const sourcePath = fs.existsSync(hotPath) ? hotPath : path.join(rawDir, fileName);
    const stats = fs.statSync(sourcePath);
    states[fileName] = { mtimeMs: stats.mtimeMs, size: stats.size };
  }
  return states;
}

function loadCacheManifest() {
  if (!fs.existsSync(cacheManifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(cacheManifestPath, 'utf8'));
  } catch {
    return null;
  }
}

function saveCacheManifest(inputStates) {
  const manifest = {
    inputStates,
    configMtimes: getConfigMtimes(),
    complete: true,
  };
  fs.writeFileSync(cacheManifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

function reportArtifactSizes() {
  const outputDir = resolveRepoPath('data-output-auto');
  if (!fs.existsSync(outputDir)) {
    console.log('No output directory found at data-output-auto');
    return;
  }

  let totalBytes = 0;
  const entries = [];

  function walk(dir) {
    const dirContent = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of dirContent) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const stats = fs.statSync(fullPath);
        totalBytes += stats.size;
        entries.push({ path: fullPath, size: stats.size });
      }
    }
  }

  walk(outputDir);

  entries.sort((a, b) => a.path.localeCompare(b.path));
  entries.forEach(({ path: filePath, size }) => {
    const kb = (size / 1024).toFixed(1);
    console.log(`  ${path.relative(baseDir, filePath)} — ${kb} KB`);
  });

  const totalKb = (totalBytes / 1024).toFixed(1);
  console.log(`  Total: ${totalKb} KB across ${entries.length} files`);
}

function main() {
  if (!fs.existsSync(rawDir)) {
    console.error('Missing HTML Raw folder:', './data-input-test');
    process.exit(1);
  }

  // Merge cold input (data-input-test) with hot input (data-input-test/userscript).
  // Hot files take precedence when names collide.
  const coldFiles = fs.readdirSync(rawDir).filter((name) => name.endsWith('.html'));
  const hotFiles = fs.existsSync(hotDir)
    ? fs.readdirSync(hotDir).filter((name) => name.endsWith('.html'))
    : [];
  const hotFileSet = new Set(hotFiles);
  const files = [...hotFiles, ...coldFiles.filter((name) => !hotFileSet.has(name))];

  if (!files.length) {
    console.error('No raw HTML files found in', './data-input-test');
    process.exit(1);
  }

  // Incremental build: skip processing if no input files or config changed.
  const previousCache = loadCacheManifest();
  const currentInputStates = computeInputStates(files);
  const currentConfigMtimes = getConfigMtimes();
  const configChanged = !previousCache ||
    Object.keys(currentConfigMtimes).some((p) => currentConfigMtimes[p] !== previousCache.configMtimes?.[p]);
  const inputChanged = !previousCache ||
    files.some((fileName) => {
      const prev = previousCache.inputStates?.[fileName];
      const curr = currentInputStates[fileName];
      return !prev || prev.mtimeMs !== curr.mtimeMs || prev.size !== curr.size;
    });

  if (!configChanged && !inputChanged && previousCache?.complete) {
    console.log('All input files and config unchanged — skipping build');
    reportArtifactSizes();
    return;
  }

  ensureDir(optimizedDir);
  ensureDir(previewDir);
  ensureDir(exportDir);
  emptyDir(optimizedDir);
  emptyDir(previewDir);
  emptyDir(exportDir);

  // Read all raw HTML before modifying anything, then detect the
  // "any" replacement name once across all files (two-pass approach).
  const rawHtmlByFile = new Map(
    files.map((fileName) => {
      const hotPath = path.join(hotDir, fileName);
      const sourcePath = fs.existsSync(hotPath) ? hotPath : path.join(rawDir, fileName);
      return [fileName, fs.readFileSync(sourcePath, 'utf8')];
    })
  );

  // Validate that every input file contains at least one message element
  for (const [fileName, html] of rawHtmlByFile) {
    if (!/<[a-zA-Z0-9]+[^>]*\saria-roledescription="message"/i.test(html)) {
      console.error(`Input file ${fileName} has no aria-roledescription="message" elements`);
      process.exit(1);
    }
  }
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

  runCreateNodes(cleanedHtmlByFile);
  validateGeneratedJson();
  const exportPaths = writeTextExports(files, cleanedHtmlByFile, referenceDate);
  reportArtifactSizes();
  saveCacheManifest(currentInputStates);
  console.log(`Done: HTML + JSON in ./data-output-auto/optimized-html and ./data-output-auto/json-format`);
  exportPaths.forEach((exportPath) => {
    console.log(`Generated chat text export: ${path.relative(baseDir, exportPath)}`);
  });
}

main();
