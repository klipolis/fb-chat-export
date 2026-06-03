const fs = require('fs');
const path = require('path');
const { resolveRepoPath, repoRelative } = require('../src/shared/app-config');

const isFix = process.argv.some((arg) => ['--self-heal', '--fix'].includes(arg));
let hasError = false;

function fail(message) {
  console.error(`ERROR: ${message}`);
  if (!isFix) process.exitCode = 1;
  hasError = true;
}

const TODO_DIR = resolveRepoPath('.TODO');
const TODO_FILES = ['TODO-next.md', 'TODO-done.md', 'TODO-ignore.md', 'TODO-future.md'];
const CONFIG_LINK = '.todo/config.json';

function readAndValidate(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw.replace(/^\uFEFF/, '').split(/\r?\n/);
  } catch {
    fail(`Cannot read ${repoRelative(filePath)}`);
    return null;
  }
}

function validateHeader(lines, relPath) {
  if (!lines[0] || !/^# TODO/.test(lines[0])) {
    fail(`${relPath}: first line must be '\\u2014 TODO \\u2014 <Title>'`);
  }
}

function getOtherTodoFiles(fileName) {
  return TODO_FILES.filter((f) => f !== fileName);
}

function validateLinksSection(lines, relPath, fileName) {
  const linkIdx = lines.findIndex((l) => /^##\s+Links\s*$/.test(l));
  if (linkIdx === -1) {
    fail(`${relPath}: missing '## Links' section`);
    return;
  }
  const sepIdx = lines.findIndex((l, i) => i > linkIdx && /^---+/.test(l));
  if (sepIdx === -1) {
    fail(`${relPath}: '## Links' section must be followed by a '---' separator`);
    return;
  }
  const linkBlock = lines.slice(linkIdx + 1, sepIdx).filter((l) => l.trim()).join(' ');

  const otherFiles = getOtherTodoFiles(fileName);
  for (const other of otherFiles) {
    const esc = other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(esc).test(linkBlock)) {
      fail(`${relPath}: Links section should reference ${other}`);
    }
  }

  const escCfg = CONFIG_LINK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(escCfg).test(linkBlock) && !/\.todo\/config\.json/.test(linkBlock)) {
    fail(`${relPath}: Links section should reference .todo/config.json`);
  }
}

function validateTaskFormat(lines, relPath) {
  const linePrefixRe = /^\s*[-*]\s+T\d{2,}\.\s+/;
  const boldRe = /^\*\*/;
  for (let i = 0; i < lines.length; i++) {
    if (!linePrefixRe.test(lines[i])) continue;
    const afterPrefix = lines[i].replace(linePrefixRe, '');
    if (boldRe.test(afterPrefix)) continue;
    if (afterPrefix && !/^[A-Z]/.test(afterPrefix.trim())) {
      fail(`${relPath}:${i + 1} description should start with capital letter`);
    }
  }
}

function validateSectionHeaders(lines, relPath) {
  let pastLinks = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^---+/.test(lines[i])) { pastLinks = true; continue; }
    if (!pastLinks) continue;
    const hMatch = lines[i].match(/^##\s+(.+)$/);
    if (!hMatch) continue;
    const name = hMatch[1].trim();
    if (name === 'Links') continue;
    if (/[:;]$/.test(name)) {
      fail(`${relPath}:${i + 1} section header '${name}' should not end with punctuation`);
    }
  }
}

function main() {
  for (const file of TODO_FILES) {
    const filePath = path.join(TODO_DIR, file);
    if (!fs.existsSync(filePath)) {
      fail(`${repoRelative(filePath)} does not exist`);
      continue;
    }
    const relPath = repoRelative(filePath);
    const lines = readAndValidate(filePath);
    if (!lines) continue;

    validateHeader(lines, relPath);
    validateLinksSection(lines, relPath, file);
    validateTaskFormat(lines, relPath);
    if (file === 'TODO-next.md') {
      validateSectionHeaders(lines, relPath);
    }
  }

  if (!hasError) {
    console.log('\u2714 TODO file format and cross-references look good.');
  }
}

main();
