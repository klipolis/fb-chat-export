const fs = require('fs');

const { isValidSender } = require('./sender-constants');
const { escapeRegExp, replaceWholeWord } = require('./string-utils');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }

  for (const entry of fs.readdirSync(dir)) {
    const entryPath = `${dir}/${entry}`;
    if (fs.lstatSync(entryPath).isDirectory()) {
      fs.rmSync(entryPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(entryPath);
    }
  }
}

const normalizeName = (name) => name.trim().replace(/\s+/g, ' ');

function extractAriaLabelCandidates(html) {
  const candidates = [];
  const nameWord = "[\\p{L}][\\p{L}.'-]*";
  const candidateName = `${nameWord}(?:\\s+${nameWord}){0,2}`;
  const byRegex = new RegExp(`\\bby\\s+(${candidateName})(?=\\s*[:]|$)`, 'giu');
  const atRegex = new RegExp(`\\bAt\\s+.+?,\\s*(${candidateName})(?=\\s*[:]|\\s+[-–—]|$)`, 'giu');

  html.replace(/aria-label="([^"]*)"/g, (_, label) => {
    let match;
    while ((match = byRegex.exec(label))) {
      const name = normalizeName(match[1]);
      if (!/^you$/i.test(name) && isValidSender(name)) candidates.push(name);
    }
    while ((match = atRegex.exec(label))) {
      const name = normalizeName(match[1]);
      if (!/^you$/i.test(name) && isValidSender(name)) candidates.push(name);
    }
    return '';
  });
  return candidates;
}

function pickBestName(candidates, htmlForCounts, excludeNames) {
  if (!candidates.length) return null;
  const nameStats = new Map();
  for (const name of candidates) {
    const stats = nameStats.get(name) || { labelCount: 0, totalCount: 0 };
    stats.labelCount += 1;
    nameStats.set(name, stats);
  }
  for (const [name, stats] of nameStats.entries()) {
    stats.totalCount = (htmlForCounts.match(new RegExp(`(?<![\\p{L}])${escapeRegExp(name)}(?![\\p{L}])`, 'giu')) || []).length;
    nameStats.set(name, stats);
  }
  return (
    Array.from(nameStats.entries())
      .filter(
        ([name, stats]) =>
          stats.labelCount >= 2 &&
          stats.totalCount >= 3 &&
          !excludeNames.has(name.toLowerCase())
      )
      .sort((a, b) => {
        const [, aStats] = a;
        const [, bStats] = b;
        if (bStats.labelCount !== aStats.labelCount) return bStats.labelCount - aStats.labelCount;
        if (bStats.totalCount !== aStats.totalCount) return bStats.totalCount - aStats.totalCount;
        return b[0].length - a[0].length;
      })
      .map(([name]) => name)[0] || null
  );
}

// Build the set of names to exclude from auto-detection:
// the replacement target, all explicit-map source names, and all
// explicit-map target names — so neither end of a fixed pair can be
// mistaken for the "any" candidate.
function makeExcludeSet(nameMap) {
  const replacementName = nameMap.any || 'Alpha';
  const explicit = Object.entries(nameMap).filter(([k]) => k !== 'any');
  return new Set([
    replacementName.toLowerCase(),
    ...explicit.map(([k]) => k.toLowerCase()),
    ...explicit.map(([, v]) => v.toLowerCase()),
  ]);
}

// Scan multiple raw HTML strings and return the single best name to
// replace with nameMap.any.  Explicit-map source names are excluded so
// they are handled by their own explicit entries instead.
function collectAutoName(htmlArray, nameMap = {}) {
  const excludeNames = makeExcludeSet(nameMap);
  const allCandidates = htmlArray.flatMap(extractAriaLabelCandidates);
  return pickBestName(allCandidates, htmlArray.join('\n'), excludeNames);
}

function aliasChatNames(html, nameMap = {}, preDetectedName) {
  const replacementName = nameMap.any || 'Alpha';
  const excludeNames = makeExcludeSet(nameMap);
  let result = html;

  // Determine the name to auto-replace with nameMap.any.
  // preDetectedName supplied (even null) → use it directly (build-server global pass).
  // preDetectedName absent → per-HTML detection (frontend / standalone tests).
  let selectedName;
  if (preDetectedName !== undefined) {
    selectedName = preDetectedName || null;
  } else {
    const candidates = extractAriaLabelCandidates(html);
    selectedName = pickBestName(candidates, html, excludeNames);
  }

  if (selectedName) {
    result = result.replace(/aria-label="([^"]*)"/g, (match, label) => {
      const updated = replaceWholeWord(label, selectedName, replacementName);
      return updated === label ? match : `aria-label="${updated}"`;
    });

    result = result.replace(
      /(<img\b[^>]*\balt=")([^"]*)("[^>]*>)/gi,
      (match, prefix, altText, suffix) => {
        if (selectedName && new RegExp(`^${escapeRegExp(selectedName)}\\s`, 'i').test(altText)) {
          return `${prefix}${replacementName}${suffix}`;
        }
        const updatedAlt = replaceWholeWord(altText, selectedName, replacementName);
        return updatedAlt === altText ? match : `${prefix}${updatedAlt}${suffix}`;
      }
    );

    result = replaceWholeWord(result, selectedName, replacementName);
  }

  // Apply explicit name entries from the map (e.g. "You" -> "Youghurt").
  // Skip entries where source and target are the same (already aliased).
  for (const [from, to] of Object.entries(nameMap)) {
    if (from === 'any') continue;
    if (from.toLowerCase() === to.toLowerCase()) continue;

    result = result.replace(/aria-label="([^"]*)"/g, (match, label) => {
      const updated = replaceWholeWord(label, from, to);
      return updated === label ? match : `aria-label="${updated}"`;
    });

    result = result.replace(
      /(<img\b[^>]*\balt=")([^"]*)("[^>]*>)/gi,
      (match, prefix, altText, suffix) => {
        if (new RegExp(`^${escapeRegExp(from)}\\s`, 'i').test(altText)) {
          return `${prefix}${to}${suffix}`;
        }
        const updated = replaceWholeWord(altText, from, to);
        return updated === altText ? match : `${prefix}${updated}${suffix}`;
      }
    );

    result = replaceWholeWord(result, from, to);
  }

  return result;
}

function normalizeExportSender(sender, aliasMap = {}) {
  const normalized = String(sender || '').trim();
  if (normalized) {
    if (Object.prototype.hasOwnProperty.call(aliasMap, normalized)) return aliasMap[normalized];
    if (Object.prototype.hasOwnProperty.call(aliasMap, normalized.toLowerCase())) return aliasMap[normalized.toLowerCase()];
    if (Object.prototype.hasOwnProperty.call(aliasMap, normalized.toUpperCase())) return aliasMap[normalized.toUpperCase()];
    if (normalized === 'You') return 'Youghurt';
    if (Object.values(aliasMap).includes(normalized)) return normalized;
    if (aliasMap.any) return aliasMap.any;
  }
  return normalized || 'Unknown';
}

module.exports = {
  ensureDir,
  emptyDir,
  aliasChatNames,
  collectAutoName,
  normalizeExportSender,
};
