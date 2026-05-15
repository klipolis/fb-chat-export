const fs = require('fs');
const path = require('path');
const { ensureDir, emptyDir, anonymizeChatNames } = require('./shared/utils');
const { createOptimizedHtml } = require('./shared/optimize-html');
const { runCreateNodes } = require('./shared/create-nodes');

const baseDir = path.resolve(__dirname, '..');
const rawDir = path.join(baseDir, 'Data-input-html-raw');
const optimizedDir = path.join(baseDir, 'Data-output-html');
const previewDir = path.join(baseDir, 'Data-output-json');
const rawMetadataPath = path.join(previewDir, 'raw-input-metadata.json');

const relRaw = './Data-input-html-raw';
const relOptimized = './Data-output-html';
const relPreview = './Data-output-json';

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
    generated_at: new Date().toISOString(),
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

function main() {
  ensureDir(optimizedDir);
  ensureDir(previewDir);
  emptyDir(optimizedDir);
  emptyDir(previewDir);

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
  console.log('Done: HTML + JSON in ./Data-output-html and ./Data-output-json');
}

main();
