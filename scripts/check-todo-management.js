const fs = require('fs');
const path = require('path');
const { resolveRepoPath, repoRelative } = require('../src/shared/app-config.js');

const FIX_FLAGS = ['--self-heal', '--fix'];
const isFix = process.argv.some((arg) => FIX_FLAGS.includes(arg));
let hasError = false;
let didFix = false;

const DEFAULT_TODO_FILES = {
  next: 'TODO-next.md',
  done: 'TODO-done.md',
  ignore: 'TODO-ignore.md',
  future: 'TODO-future.md',
};

function normalizeTaskLine(line) {
  const match = line.match(/^([*-]\s+T-?\d+\.\s*)(.+)$/i);
  if (!match) return { line, changed: false };

  const taskText = match[2];
  if (!/^now\b/i.test(taskText)) return { line, changed: false };

  const updatedText = taskText.replace(/^now\b\s*/i, '').trimStart();
  return { line: `${match[1]}${updatedText}`, changed: true };
}

function validateTaskLanguage(filePath, fileText) {
  const invalidLines = [];
  const lines = fileText.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const originalLine = lines[index];
    const { line: updatedLine, changed } = normalizeTaskLine(originalLine);
    if (changed) {
      invalidLines.push(index + 1);
      if (isFix) {
        lines[index] = updatedLine;
        didFix = true;
      }
    }
  }

  return { text: lines.join('\n'), invalidLines };
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    failHard(`Failed to read ${repoRelative(filePath)}: ${error.message}`);
    return null;
  }
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text, 'utf8');
}

function parseTaskIds(fileText) {
  const ids = [];
  const lines = fileText.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*[-*]\s*(T-?\d+)\./);
    if (match) ids.push(match[1]);
  }
  return ids;
}

function normalizeTaskNumber(line) {
  const match = line.match(/^([*-]\s+)(T-?)(0+)(\d+)(\.\s*.*)$/i);
  if (!match) return { line, changed: false };
  const [, prefix, tPrefix, zeros, digits, rest] = match;
  const normalized = `${prefix}${tPrefix}${digits}${rest}`;
  return { line: normalized, changed: zeros.length > 0 };
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  if (!isFix) {
    process.exit(1);
  }
  hasError = true;
}

function failHard(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const repoRoot = process.env.REPO_ROOT ? path.resolve(process.env.REPO_ROOT) : process.cwd();
process.chdir(repoRoot);

(function main() {
  const todoFiles = DEFAULT_TODO_FILES;
  const currentTaskPrefix = 'T-';
  const expectedFiles = Object.keys(todoFiles);
  const nonTaskFiles = new Set(['ignore', 'future']);
  const pattern = new RegExp(`^${currentTaskPrefix}\\d+$`);
  const allTaskIds = new Set();
  let maxTaskNumber = 0;
  const updatedFiles = new Map();

  for (const fileKey of expectedFiles) {
    if (nonTaskFiles.has(fileKey)) continue;
    const filePath = resolveRepoPath('.TODO', todoFiles[fileKey]);
    let fileText = readText(filePath);
    if (fileText === null) continue;

    const zeroPadLines = [];
    const taskLines = fileText.split(/\r?\n/);
    for (let i = 0; i < taskLines.length; i++) {
      const { line: fixedLine, changed } = normalizeTaskNumber(taskLines[i]);
      if (changed) {
        zeroPadLines.push(i + 1);
        if (isFix) {
          taskLines[i] = fixedLine;
          didFix = true;
        }
      }
    }
    if (zeroPadLines.length > 0 && !isFix) {
      fail(
        `${repoRelative(filePath)} contains zero-padded task numbers. Fix lines: ${zeroPadLines.join(', ')}. Use --fix to auto-strip.`,
      );
    }
    fileText = taskLines.join('\n');

    const { text: normalizedText, invalidLines } = validateTaskLanguage(filePath, fileText);
    if (invalidLines.length > 0) {
      if (isFix) {
        console.log(
          `Updated task wording in ${repoRelative(filePath)} for lines: ${invalidLines.join(', ')}`,
        );
        fileText = normalizedText;
        updatedFiles.set(filePath, fileText);
      } else {
        fail(
          `Task descriptions in ${repoRelative(filePath)} should not start with 'now'. Fix lines: ${invalidLines.join(', ')}.`,
        );
      }
    }

    const taskIds = parseTaskIds(fileText);
    for (const id of taskIds) {
      if (!pattern.test(id)) {
        failHard(
          `${repoRelative(filePath)} contains invalid task id '${id}'. Expected pattern ${pattern}.`,
        );
      }
      if (allTaskIds.has(id)) {
        failHard(`Duplicate task id found across todo files: ${id}`);
      }
      allTaskIds.add(id);
      const number = Number(id.slice(currentTaskPrefix.length));
      if (Number.isFinite(number) && number > maxTaskNumber) maxTaskNumber = number;
    }
  }

  for (const fileKey of nonTaskFiles) {
    const filePath = resolveRepoPath('.TODO', todoFiles[fileKey]);
    const fileText = readText(filePath);
    if (fileText === null) continue;
    const ids = parseTaskIds(fileText);
    if (ids.length > 0) {
      failHard(
        `${repoRelative(filePath)} should not contain T-number task IDs (${ids.join(', ')}). Use TODO-next.md or TODO-done.md for numbered tasks.`,
      );
    }
  }

  if (didFix) {
    for (const [filePath, text] of updatedFiles.entries()) {
      writeText(filePath, text);
    }
  }

  const stringTasks = Array.from(allTaskIds).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  if (stringTasks.length === 0) {
    console.warn('No TODO task IDs were found in the configured todo files.');
  }

  if (isFix && didFix) {
    console.log('✔ TODO management self-healed.');
    process.exit(0);
  }

  if (hasError) {
    process.exit(1);
  }

  console.log('✔ TODO management configuration is valid.');
  process.exit(0);
})();
