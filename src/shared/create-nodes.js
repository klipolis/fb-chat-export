const fs = require('fs');
const path = require('path');
const { selectors } = require('./rules');
const { parseAriaLabel, normalizeDateToSimple } = require('./aria-label-parser');
const { getContentMeta } = require('./message-metadata');

const helperDir = path.resolve(__dirname);
const baseDir = path.resolve(helperDir, '..', '..');
const rawDir = path.join(baseDir, 'Data-input-html-raw');
const optimizedDir = path.join(baseDir, 'Data-output-html');
const nodesDir = path.join(baseDir, 'Data-output-json');

function relativePath(p) {
  const rel = path.relative(baseDir, p).replace(/\\/g, '/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function findMatchingClosingTag(html, tag, fromIndex) {
  const openRe = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  const closeRe = new RegExp(`</${tag}>`, 'gi');
  openRe.lastIndex = fromIndex;
  closeRe.lastIndex = fromIndex;

  let depth = 1;
  let nextOpen = openRe.exec(html);
  let nextClose = closeRe.exec(html);

  while (nextClose) {
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      openRe.lastIndex = nextOpen.index + nextOpen[0].length;
      nextOpen = openRe.exec(html);
      continue;
    }

    depth -= 1;
    if (depth === 0) {
      return nextClose.index;
    }

    closeRe.lastIndex = nextClose.index + nextClose[0].length;
    nextClose = closeRe.exec(html);
  }

  return -1;
}

function normalizeLabel(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function buildMessageMetaMap(rawHtml) {
  const map = new Map();
  const rawTagRe = /<([a-zA-Z0-9]+)([^>]*)>/gi;
  let match;

  while ((match = rawTagRe.exec(rawHtml)) !== null) {
    const attrs = match[2];
    if (!/aria-roledescription="message"/i.test(attrs) || !/aria-label="[^"]+"/i.test(attrs)) {
      continue;
    }

    const ariaLabelMatch = attrs.match(/aria-label="([^"]+)"/i);
    if (!ariaLabelMatch) continue;

    const ariaLabel = normalizeLabel(ariaLabelMatch[1]);
    const tagName = match[1];
    const start = match.index + match[0].length;
    const end = findMatchingClosingTag(rawHtml, tagName, start);
    if (end === -1) continue;

    const segment = rawHtml.slice(start, end);
    const hrefMatch = segment.match(/href="([^"]+)"/i);
    const timerMatch = segment.match(/role="timer"[^>]*>([^<]+)</i);
    const duration = timerMatch ? parseDurationMinutes(timerMatch[1].trim()) : null;
    const metadata = {};

    if (hrefMatch) metadata.link = hrefMatch[1];
    if (duration) metadata.duration = duration;

    if (Object.keys(metadata).length) {
      if (!map.has(ariaLabel)) {
        map.set(ariaLabel, metadata);
      }
    }

    rawTagRe.lastIndex = end;
  }

  return map;
}

function buildAllMessageMetaMap(rawDir) {
  const metaMap = new Map();
  if (!fs.existsSync(rawDir)) return metaMap;

  const rawFiles = fs.readdirSync(rawDir).filter(name => name.endsWith('.html'));
  rawFiles.forEach(fileName => {
    const rawHtml = fs.readFileSync(path.join(rawDir, fileName), 'utf8');
    const fileMeta = buildMessageMetaMap(rawHtml);
    fileMeta.forEach((meta, ariaLabel) => {
      if (!metaMap.has(ariaLabel)) {
        metaMap.set(ariaLabel, meta);
      }
    });
  });

  return metaMap;
}

function chooseRule(fileName, ariaLabel) {
  const loweredFile = fileName.toLowerCase();
  const loweredLabel = ariaLabel.toLowerCase();

  const fileRule = messageRules.find(rule => rule.matchFile && rule.matchFile.test(loweredFile));
  if (fileRule) return fileRule;

  const labelRule = messageRules.find(rule => rule.matchLabel && rule.matchLabel.test(loweredLabel));
  if (labelRule) return labelRule;

  return messageRules.find(rule => rule.type === 'text') || messageRules[0];
}

function extractDate(ariaLabel) {
  const parsed = parseAriaLabel(ariaLabel);
  return parsed.date || null;
}

function generateSimpleDate(ariaLabel) {
  const parsed = parseAriaLabel(ariaLabel);
  return normalizeDateToSimple(parsed.date);
}

function formatLocalDateTime(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function parseDurationMinutes(text) {
  if (!text) return null;
  const hhmm = text.match(/(\d{1,2}):(\d{2})/);
  if (hhmm) {
    const minutes = parseInt(hhmm[1], 10);
    const seconds = parseInt(hhmm[2], 10);
    return `${minutes + (seconds > 0 ? 1 : 0)} min`;
  }
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*min/i);
  if (minMatch) return `${Math.ceil(parseFloat(minMatch[1]))} min`;
  const secMatch = text.match(/(\d+)\s*sec/i);
  if (secMatch) return `${Math.ceil(parseInt(secMatch[1], 10) / 60)} min`;
  return null;
}

function extractLink(text) {
  const urlMatch = text.match(/https?:\/\/[^"]+/i);
  return urlMatch ? urlMatch[0] : null;
}

function extractMessageText(ariaLabel) {
  const parsed = parseAriaLabel(ariaLabel);
  return parsed.message || '';
}

function parseMessageNodes(html, fileName, exportDate, metaMap) {
  const nodes = [];
  const messageTagRe = /<([a-zA-Z0-9]+)([^>]*)>/gi;
  let match;
  const route = path.join('Data-output-html', fileName).replace(/\\/g, '/');

  while ((match = messageTagRe.exec(html)) !== null) {
    const attrs = match[2];
    if (!/aria-roledescription="message"/i.test(attrs) || !/aria-label="[^"]+"/i.test(attrs)) {
      continue;
    }

    const ariaLabelMatch = attrs.match(/aria-label="([^\"]+)"/i);
    const ariaLabel = ariaLabelMatch ? ariaLabelMatch[1] : '';
    const normalizedLabel = normalizeLabel(ariaLabel);
    const rawMeta = metaMap.get(normalizedLabel) || {};
    const parsedLabel = parseAriaLabel(ariaLabel);
    const message = parsedLabel.message;
    const originalDate = parsedLabel.date;
    const simpleDate = normalizeDateToSimple(parsedLabel.date);
    const timestamp = simpleDate || originalDate;
    const contentMeta = getContentMeta({
      fileName,
      ariaLabel,
      message,
      rawMeta,
      timerText: rawMeta.duration || ''
    });

    const preview = {
      original_date: originalDate,
      optimised_date: simpleDate || originalDate,
      content: contentMeta.text,
      content_type: contentMeta.type
    };

    if (contentMeta.link !== undefined) preview.content_link = contentMeta.link;
    if (contentMeta.contentLength !== undefined) preview.content_length = contentMeta.contentLength;
    if (Object.keys(rawMeta).length) {
      preview.raw_meta = rawMeta;
    }
    if (contentMeta.type === 'voice-message') {
      preview.voice_duration_source = contentMeta.voiceDurationSource;
    }

    nodes.push({
      title: contentMeta.type,
      timestamp,
      locate: {
        message: selectors.message,
        label: selectors.messageLabel,
        textContent: selectors.messageText
      },
      data_preview: preview
    });
  }

  return nodes;
}

function createNodeJson(fileName, metaMap) {
  const html = fs.readFileSync(path.join(optimizedDir, fileName), 'utf8');
  const exportDate = formatLocalDateTime();
  const nodes = parseMessageNodes(html, fileName, exportDate, metaMap);
  const route = path.join('Data-output-html', fileName).replace(/\\/g, '/');
  const uniqueNodes = [...new Map(nodes.map(node => [node.data_preview.content, node])).values()];
  const node = uniqueNodes.length ? uniqueNodes[0] : null;
  const output = {
    title: path.parse(fileName).name,
    export_date: exportDate,
    locate: node ? node.locate : {
      message: selectors.message,
      label: selectors.messageLabel,
      textContent: selectors.messageText
    },
    data_preview: node ? node.data_preview : {
      original_date: null,
      optimised_date: exportDate,
      content: null,
      content_type: 'unknown'
    }
  };

  const targetPath = path.join(nodesDir, `${path.parse(fileName).name}.json`);
  fs.writeFileSync(targetPath, JSON.stringify(output, null, 2), 'utf8');
  return targetPath;
}

function main() {
  ensureDir(nodesDir);

  const relOptimizedDir = relativePath(optimizedDir);
  const relNodesDir = relativePath(nodesDir);
  const relRawDir = relativePath(rawDir);

  if (!fs.existsSync(optimizedDir)) {
    console.error('Missing optimized HTML folder:', relOptimizedDir);
    process.exit(1);
  }

  const htmlFiles = fs.readdirSync(optimizedDir).filter(name => name.endsWith('.html'));
  if (!htmlFiles.length) {
    console.error('No optimized HTML files found in', relOptimizedDir);
    process.exit(1);
  }

  const metaMap = buildAllMessageMetaMap(rawDir);
  const created = htmlFiles.map(fileName => createNodeJson(fileName, metaMap));
  console.log(`Generated ${created.length} JSON files in ${relNodesDir}`);
}

if (require.main === module) {
  main(false);
}

module.exports = { runCreateNodes: () => main() };
