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
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const chatName = titleMatch ? titleMatch[1].trim() : '';
  const hasMainName = chatName && !/^Messenger$/i.test(chatName);
  const mainNameRe = hasMainName ? new RegExp(`\\b${escapeRegExp(chatName)}\\b`, 'gi') : null;

  const replaceText = (text) => {
    let result = text.replace(/\bYou\b/g, 'Yoghurt');
    if (mainNameRe) {
      result = result.replace(mainNameRe, 'Alpha');
    }
    return result;
  };

  let result = html;
  if (hasMainName) {
    result = result.replace(/<title>[\s\S]*?<\/title>/i, '<title>Alpha</title>');
  }

  result = result
    .replace(/aria-label="([^\"]*)"/g, (match, value) => `aria-label="${replaceText(value)}"`)
    .replace(/>\s*You\s*</g, '>Yoghurt<')
    .replace(/\bYou\b/g, 'Yoghurt');

  if (hasMainName) {
    result = result.replace(mainNameRe, 'Alpha');
  }

  return result;
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
