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

function anonymizeChatNames(html) {
  const normalizeName = (name) => name.trim().replace(/\s+/g, ' ');
  const isValidName = (name) => /^[A-Za-z][A-Za-z .'\-]{0,80}$/i.test(name)
    && !/\d/.test(name)
    && name.split(/\s+/).length <= 3;
  const extractCandidateNames = (text) => {
    const names = [];
    const byRegex = /\bby\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})(?=\s*[:]|$)/gi;
    const atRegex = /\bAt\s+[^,]+,\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,2})(?=\s*[:]|$)/gi;
    let match;

    while ((match = byRegex.exec(text))) {
      const name = normalizeName(match[1]);
      if (!/^you$/i.test(name) && isValidName(name)) {
        names.push(name);
      }
    }

    while ((match = atRegex.exec(text))) {
      const name = normalizeName(match[1]);
      if (!/^you$/i.test(name) && isValidName(name)) {
        names.push(name);
      }
    }

    return names;
  };

  const candidateNames = [];
  html.replace(/aria-label="([^"]*)"/g, (_, label) => {
    extractCandidateNames(label).forEach((name) => candidateNames.push(name));
    return '';
  });

  if (candidateNames.length === 0) {
    return html;
  }

  const nameStats = new Map();
  for (const name of candidateNames) {
    const stats = nameStats.get(name) || { labelCount: 0, totalCount: 0 };
    stats.labelCount += 1;
    nameStats.set(name, stats);
  }

  for (const [name, stats] of nameStats.entries()) {
    stats.totalCount = (html.match(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi')) || []).length;
    nameStats.set(name, stats);
  }

  const eligibleNames = Array.from(nameStats.entries())
    .filter(([, stats]) => stats.labelCount >= 2 && stats.totalCount >= 3)
    .sort((a, b) => {
      const [, aStats] = a;
      const [, bStats] = b;
      if (bStats.labelCount !== aStats.labelCount) return bStats.labelCount - aStats.labelCount;
      if (bStats.totalCount !== aStats.totalCount) return bStats.totalCount - aStats.totalCount;
      return b[0].length - a[0].length;
    })
    .map(([name]) => name);

  if (eligibleNames.length === 0) {
    return html;
  }

  const selectedName = eligibleNames[0];
  const senderRegex = new RegExp(`\\b${escapeRegExp(selectedName)}\\b`, 'gi');

  const anonymizeText = (text) => text.replace(senderRegex, 'Alpha');

  let result = html.replace(/aria-label="([^"]*)"/g, (match, label) => {
    const updated = anonymizeText(label);
    return updated === label ? match : `aria-label="${updated}"`;
  });

  result = result.replace(/(<img\b[^>]*\balt=")([^"]*)("[^>]*>)/gi, (match, prefix, altText, suffix) => {
    const updatedAlt = anonymizeText(altText);
    return updatedAlt === altText ? match : `${prefix}${updatedAlt}${suffix}`;
  });

  return result.replace(senderRegex, 'Alpha');
}

function minifyJs(code) {
  const lines = code.split(/\r?\n/);
  const headerLines = [];
  const bodyLines = [];
  let inHeader = true;

  for (const line of lines) {
    if (inHeader) {
      headerLines.push(line);
      if (line.includes('==/UserScript==')) {
        inHeader = false;
      }
      continue;
    }
    bodyLines.push(line);
  }

  const body = bodyLines
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/;\s*(?=(const|let|var|function))/g, ';\n')
    .replace(/}\s*(?=(const|let|var|function))/g, '}\n')
    .replace(/\)\s*{\s*/g, ') {\n')
    .replace(/}\s*else\s*/g, '}\nelse ')
    .replace(/}\s*while\s*/g, '}\nwhile ')
    .replace(/}\s*return\s*/g, '}\nreturn ')
    .replace(/}\s*;/g, '};\n')
    .trim();

  const header = headerLines.join('\n').trim();
  return `${header}\n\n${body}\n`;
}

module.exports = {
  ensureDir,
  emptyDir,
  anonymizeChatNames,
  minifyJs
};
