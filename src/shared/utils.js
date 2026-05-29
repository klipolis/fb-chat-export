const fs = require('fs');

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const normalizeName = (name) => name.trim().replace(/\s+/g, ' ');
const isValidName = (name) =>
  /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ.' -]{0,80}$/i.test(name) &&
  !/\d/.test(name) &&
  name.split(/\s+/).length <= 2;

function extractAriaLabelCandidates(html) {
  const candidates = [];
  const nameWord = "[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ.'-]*";
  const candidateName = `${nameWord}(?:\\s+${nameWord})?`;
  const byRegex = new RegExp(`\\bby\\s+(${candidateName})(?=\\s*[:]|$)`, 'gi');
  const atRegex = new RegExp(`\\bAt\\s+.+?,\\s*(${candidateName})(?=\\s*[:]|$)`, 'gi');

  html.replace(/aria-label="([^"]*)"/g, (_, label) => {
    let match;
    while ((match = byRegex.exec(label))) {
      const name = normalizeName(match[1]);
      if (!/^you$/i.test(name) && isValidName(name)) candidates.push(name);
    }
    while ((match = atRegex.exec(label))) {
      const name = normalizeName(match[1]);
      if (!/^you$/i.test(name) && isValidName(name)) candidates.push(name);
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
    stats.totalCount = (htmlForCounts.match(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi')) || []).length;
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

  // Replace name only when it appears as a whole word (not as substring of another name)
  // using a pattern that works with Unicode letters
  const isWholeWord = (text, name, pos) => {
    const before = pos === 0 || /[\s,:;]/.test(text[pos - 1]);
    const after = pos + name.length >= text.length || /[\s,:;]/.test(text[pos + name.length]);
    return before && after;
  };

  const replaceWholeWord = (text, name, replacement) => {
    const nameLen = name.length;
    let result = '';
    let i = 0;
    while (i < text.length) {
      const idx = text.toLowerCase().indexOf(name.toLowerCase(), i);
      if (idx === -1) {
        result += text.slice(i);
        break;
      }
      if (isWholeWord(text, name, idx)) {
        result += text.slice(i, idx) + replacement;
        i = idx + nameLen;
      } else {
        result += text.slice(i, idx + nameLen);
        i = idx + nameLen;
      }
    }
    return result;
  };

  if (selectedName) {
    result = result.replace(/aria-label="([^"]*)"/g, (match, label) => {
      const updated = replaceWholeWord(label, selectedName, replacementName);
      return updated === label ? match : `aria-label="${updated}"`;
    });

    result = result.replace(
      /(<img\b[^>]*\balt=")([^"]*)("[^>]*>)/gi,
      (match, prefix, altText, suffix) => {
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
        const updated = replaceWholeWord(altText, from, to);
        return updated === altText ? match : `${prefix}${updated}${suffix}`;
      }
    );

    result = replaceWholeWord(result, from, to);
  }

  return result;
}

module.exports = {
  ensureDir,
  emptyDir,
  aliasChatNames,
  collectAutoName,
};
