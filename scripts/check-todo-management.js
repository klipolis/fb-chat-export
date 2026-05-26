const fs = require('fs');
const { todoConfigPath: configPath, resolveRepoPath, repoRelative } = require('../src/shared/app-config');

const FIX_FLAGS = ['--self-heal', '--fix'];
const isFix = process.argv.some((arg) => FIX_FLAGS.includes(arg));
let hasError = false;
let didFix = false;

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

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    failHard(`Failed to read or parse ${repoRelative(filePath)}: ${error.message}`);
    return null;
  }
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
    const match = line.match(/^\s*[-*]\s*(T\d{2,})\./);
    if (match) ids.push(match[1]);
  }
  return ids;
}

function assertLinksSection(fileText, expectedHeader) {
  const regex = new RegExp(`^##\\s+${expectedHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm');
  return regex.test(fileText);
}

function normalizeTaskLine(line) {
  const match = line.match(/^([*-]\s+T\d+\.\s*)(.+)$/i);
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

function addLinksHeader(fileText, expectedHeader) {
  const trimmed = fileText.replace(/\s+$/, '');
  return `${trimmed}\n\n## ${expectedHeader}\n`;
}

(function main() {
  const config = readJson(configPath);
  if (!config) process.exit(1);

  const requiredFields = ['currentTaskPrefix', 'nextTaskNumber', 'todoFiles', 'linksHeader'];
  for (const field of requiredFields) {
    if (!(field in config)) {
      failHard(`Missing required field in .todo/config.json: ${field}`);
    }
  }

  const { currentTaskPrefix, nextTaskNumber, todoFiles, linksHeader, taskIdPattern } = config;
  if (typeof currentTaskPrefix !== 'string' || currentTaskPrefix.length === 0) {
    failHard('currentTaskPrefix must be a non-empty string.');
  }

  if (!Number.isInteger(nextTaskNumber) || nextTaskNumber <= 0) {
    failHard('nextTaskNumber must be a positive integer.');
  }

  if (typeof todoFiles !== 'object' || todoFiles === null) {
    failHard('todoFiles must be an object with next/done/ignore/future file paths.');
  }

  const expectedFiles = ['next', 'done', 'ignore', 'future'];
  for (const fileKey of expectedFiles) {
    if (!todoFiles[fileKey] || typeof todoFiles[fileKey] !== 'string') {
      failHard(`.todo/config.json.todoFiles must include a string path for ${fileKey}.`);
    }
  }

  const pattern = taskIdPattern ? new RegExp(taskIdPattern) : new RegExp(`^${currentTaskPrefix}\\d{2,}$`);
  const allTaskIds = new Set();
  let maxTaskNumber = 0;
  const updatedFiles = new Map();

  for (const fileKey of expectedFiles) {
    const filePath = resolveRepoPath('.todo', todoFiles[fileKey]);
    let fileText = readText(filePath);
    if (fileText === null) continue;

    const { text: normalizedText, invalidLines } = validateTaskLanguage(filePath, fileText);
    if (invalidLines.length > 0) {
      if (isFix) {
        console.log(
          `Updated task wording in ${repoRelative(filePath)} for lines: ${invalidLines.join(', ')}`,
        );
        fileText = normalizedText;
        updatedFiles.set(filePath, fileText);
      } else {
        fail(`Task descriptions in ${repoRelative(filePath)} should not start with 'now'. Fix lines: ${invalidLines.join(', ')}.`);
      }
    }

    if (!assertLinksSection(fileText, linksHeader)) {
      if (isFix) {
        console.log(`Added missing '${linksHeader}' section header to ${repoRelative(filePath)}.`);
        fileText = addLinksHeader(fileText, linksHeader);
        updatedFiles.set(filePath, fileText);
        didFix = true;
      } else {
        fail(`${repoRelative(filePath)} must include a '${linksHeader}' section header.`);
      }
    }

    const taskIds = parseTaskIds(fileText);
    for (const id of taskIds) {
      if (!pattern.test(id)) {
        failHard(`${repoRelative(filePath)} contains invalid task id '${id}'. Expected pattern ${pattern}.`);
      }
      if (allTaskIds.has(id)) {
        failHard(`Duplicate task id found across todo files: ${id}`);
      }
      allTaskIds.add(id);
      const number = Number(id.slice(currentTaskPrefix.length));
      if (Number.isFinite(number) && number > maxTaskNumber) maxTaskNumber = number;
    }
  }

  if (nextTaskNumber <= maxTaskNumber) {
    if (isFix) {
      const updatedNumber = maxTaskNumber + 1;
      config.nextTaskNumber = updatedNumber;
      fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
      console.log(`Updated .todo/config.json nextTaskNumber to ${updatedNumber}.`);
      didFix = true;
    } else {
      fail(`.todo/config.json.nextTaskNumber must be greater than the highest existing task id (${currentTaskPrefix}${maxTaskNumber}).`);
    }
  }

  if (didFix) {
    for (const [filePath, text] of updatedFiles.entries()) {
      writeText(filePath, text);
    }
  }

  const stringTasks = Array.from(allTaskIds).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
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
