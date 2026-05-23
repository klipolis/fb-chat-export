const fs = require('fs');
const path = require('path');
const { selectors, messageRules } = require('./rules');
const { parseAriaLabel, normalizeDateToSimple } = require('./aria-label-parser');
const { getContentMeta, normalizeDuration } = require('./message-metadata');

const helperDir = path.resolve(__dirname);
const baseDir = path.resolve(helperDir, '..', '..');
const rawDir = path.join(baseDir, 'data-input');
const optimizedDir = path.join(baseDir, 'data-output/optimized-html');
const nodesDir = path.join(baseDir, 'data-output/json-format');
const metadataDir = path.join(helperDir, 'metadata-generated');

function relativePath(p) {
  const rel = path.relative(baseDir, p).replace(/\\/g, '/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function stripTrackingParams(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    for (const key of Array.from(u.searchParams.keys())) {
      if (
        key.toLowerCase().startsWith('utm_') ||
        ['fbclid', 'gclid', 'dclid', 'msclkid', 'ref', 'ref_src'].includes(key.toLowerCase())
      ) {
        u.searchParams.delete(key);
      }
    }
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJsonIfChanged(targetPath, data) {
  const content = JSON.stringify(data, null, 2) + '\n';
  if (fs.existsSync(targetPath)) {
    const existing = fs.readFileSync(targetPath, 'utf8');
    if (existing === content) return false;
  }
  fs.writeFileSync(targetPath, content, 'utf8');
  return true;
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
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractRawDuration(text) {
  if (!text) return null;
  const normalized = normalizeLabel(text);
  const hhmmss = normalized.match(/(\d+:\d{2}:\d{2})/i);
  if (hhmmss) return hhmmss[1];
  const mmss = normalized.match(/(\d+:\d{2})(?!\s*(?:am|pm)\b)/i);
  if (mmss) return mmss[1];
  const mins = normalized.match(/(\d+(?:\.\d+)?\s*min(?:s)?)/i);
  if (mins) return mins[1];
  const secs = normalized.match(/(\d+\s*sec(?:ond)?s?)/i);
  if (secs) return secs[1];
  return null;
}

function extractHtmlLocale(html) {
  const match = String(html || '').match(/\blang="([^"]+)"/i);
  return match ? match[1] : null;
}

function extractPlainText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMessageMetaMap(rawHtml) {
  const map = new Map();
  const rawTagRe = /<([a-zA-Z0-9]+)([^>]*)>/gi;
  let match;

  while ((match = rawTagRe.exec(rawHtml)) !== null) {
    const attrs = match[2];
    if (!/aria-label="[^"]+"/i.test(attrs)) {
      continue;
    }

    const ariaLabelMatch = attrs.match(/aria-label="([^"]+)"/i);
    if (!ariaLabelMatch) continue;

    const normalizedLabel = normalizeLabel(ariaLabelMatch[1]);
    if (/^(?:message actions|open attachment)/i.test(normalizedLabel)) {
      continue;
    }

    const ariaLabel = normalizedLabel;
    const tagName = match[1];
    const start = match.index + match[0].length;
    const end = findMatchingClosingTag(rawHtml, tagName, start);
    if (end === -1) continue;

    const segment = rawHtml.slice(start, end);
    const segmentText = extractPlainText(segment);
    const hrefMatch = segment.match(/href="([^"]+)"/i);
    const timerMatch = segment.match(/role="timer"[^>]*>([^<]+)</i);
    const duration = timerMatch
      ? normalizeLabel(timerMatch[1].trim())
      : extractRawDuration(segmentText);
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

  const rawFiles = fs.readdirSync(rawDir).filter((name) => name.endsWith('.html'));
  rawFiles.forEach((fileName) => {
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

  const fileRule = messageRules.find((rule) => rule.matchFile && rule.matchFile.test(loweredFile));
  if (fileRule) return fileRule;

  const labelRule = messageRules.find(
    (rule) => rule.matchLabel && rule.matchLabel.test(loweredLabel)
  );
  if (labelRule) return labelRule;

  return messageRules.find((rule) => rule.type === 'text') || messageRules[0];
}

function extractDate(ariaLabel) {
  const parsed = parseAriaLabel(ariaLabel);
  return parsed.date || null;
}

function generateSimpleDate(ariaLabel, referenceDate) {
  const parsed = parseAriaLabel(ariaLabel);
  return normalizeDateToSimple(parsed.date, referenceDate);
}

function parseReferenceDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})$/);
    if (match) {
      return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        0,
        0
      );
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function formatLocalDateTime(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
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
  const referenceDate = parseReferenceDate(exportDate);
  const nodes = [];
  const messageTagRe = /<([a-zA-Z0-9]+)([^>]*)>/gi;
  let match;
  const route = path.join('data-output/optimized-html', fileName).replace(/\\/g, '/');

  while ((match = messageTagRe.exec(html)) !== null) {
    const attrs = match[2];
    if (!/aria-label="[^"]+"/i.test(attrs)) {
      continue;
    }

    const ariaLabelMatch = attrs.match(/aria-label="([^"]+)"/i);
    const ariaLabel = ariaLabelMatch ? ariaLabelMatch[1] : '';
    const normalizedLabel = normalizeLabel(ariaLabel);
    if (/^(?:message actions|open attachment)/i.test(normalizedLabel)) {
      continue;
    }
    const rawMeta = Object.assign({}, metaMap.get(normalizedLabel) || {});
    const parsedLabel = parseAriaLabel(ariaLabel);
    const start = match.index + match[0].length;
    const end = findMatchingClosingTag(html, match[1], start);
    if (end === -1) continue;

    const rawSegment = html.slice(start, end);
    const segmentText = extractPlainText(rawSegment);
    if (!rawMeta.duration) {
      const fallbackDuration = extractRawDuration(segmentText);
      if (fallbackDuration) {
        rawMeta.duration = fallbackDuration;
      }
    }
    const senderAlt = parsedLabel.sender ? parsedLabel.sender.trim() : '';
    const imageTags = Array.from(rawSegment.matchAll(/<img\b[^>]*>/gi));
    // Only count as image if there is an <img> that is NOT a sender avatar (alt is not a person name and not empty)
    const hasImage = imageTags.some((tag) => {
      const altMatch = tag[0].match(/alt="([^"]*)"/i);
      const altText = altMatch ? altMatch[1].trim() : '';
      // If alt is missing or empty, treat as possible image (could be sticker, etc)
      if (!altText) return true;
      // If alt is a person name, treat as avatar, not message image
      const isPersonName = /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/.test(altText);
      return !isPersonName;
    });
    const hasLink = Boolean(rawMeta.link || /<a\s[^>]*href=/i.test(rawSegment));
    const hasPlayButton = /aria-label="Play"/i.test(rawSegment);
    let message = parsedLabel.message || '';
    if (!message && segmentText) {
      if (/\bvideo[- ]call\b/i.test(segmentText)) {
        message = 'video call';
      } else if (/\bmissed[- ]call\b/i.test(segmentText)) {
        message = 'missed call';
      } else if (/\bvoice(?: message| note)\b/i.test(segmentText)) {
        message = 'voice message';
      } else {
        message = segmentText;
      }
    }

    const originalDate = parsedLabel.date;
    const simpleDate = normalizeDateToSimple(parsedLabel.date, referenceDate);
    const timestamp = simpleDate || originalDate;
    const contentMeta = getContentMeta({
      fileName,
      ariaLabel,
      message,
      rawMeta,
      hasImage,
      hasLink,
      hasPlayButton,
      timerText: rawMeta.duration || '',
    });

    const rawDuration = normalizeDuration(rawMeta.duration) || null;
    const rawContent = contentMeta.type === 'reaction'
      ? null
      : contentMeta.link
        ? stripTrackingParams(rawMeta.link || contentMeta.link) || null
        : (message || null);

    nodes.push({
      html_locale: null,
      title: contentMeta.type,
      type: contentMeta.type,
      timestamp,
      data_raw: {
        date: originalDate,
        content: rawContent,
        duration: rawDuration,
        length: null,
      },
      data_preview: {
        date: simpleDate || originalDate,
        content: contentMeta.text,
        duration: contentMeta.duration || null,
        length: contentMeta.contentLength || null,
      },
    });

    messageTagRe.lastIndex = end;
  }

  return nodes;
}

function createNodeJson(fileName, metaMap, exportDate) {
  const html = fs.readFileSync(path.join(optimizedDir, fileName), 'utf8');
  const htmlLocale = extractHtmlLocale(html);
  const nodes = parseMessageNodes(html, fileName, exportDate, metaMap);
  const uniqueNodes = [...new Map(nodes.map((node) => [node.data_preview.content, node])).values()];
  const node = uniqueNodes.length ? uniqueNodes[0] : null;
  const output = {
    html_locale: htmlLocale,
    title: node ? node.type : path.parse(fileName).name,
    type: node ? node.type : 'unknown',
    data_raw: node
      ? node.data_raw
      : { date: null, content: null, duration: null, length: null },
    data_preview: node
      ? node.data_preview
      : { date: exportDate, content: null, duration: null, length: null },
  };

  const targetPath = path.join(nodesDir, `${path.parse(fileName).name}.json`);
  writeJsonIfChanged(targetPath, output);
  return targetPath;
}

function writeExportMetadata(createdFiles) {
  const meta = {
    file_count: createdFiles.length,
    files: createdFiles.map((filePath) => path.basename(filePath)),
  };

  writeJsonIfChanged(path.join(metadataDir, 'metadata.json'), meta);
}

function main() {
  ensureDir(nodesDir);
  ensureDir(metadataDir);

  const relOptimizedDir = relativePath(optimizedDir);
  const relNodesDir = relativePath(nodesDir);
  const relRawDir = relativePath(rawDir);

  if (!fs.existsSync(optimizedDir)) {
    console.error('Missing optimized HTML folder:', relOptimizedDir);
    process.exit(1);
  }

  const htmlFiles = fs.readdirSync(optimizedDir).filter((name) => name.endsWith('.html'));
  if (!htmlFiles.length) {
    console.error('No optimized HTML files found in', relOptimizedDir);
    process.exit(1);
  }

  const exportDate = formatLocalDateTime();
  const metaMap = buildAllMessageMetaMap(rawDir);
  const created = htmlFiles.map((fileName) => createNodeJson(fileName, metaMap, exportDate));
  writeExportMetadata(created);
  console.log(`Generated ${created.length} JSON files in ${relNodesDir}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  runCreateNodes: () => main(),
  parseMessageNodes,
  buildAllMessageMetaMap,
};
