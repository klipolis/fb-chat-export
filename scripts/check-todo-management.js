const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const configPath = path.join(baseDir, '.todo', 'config.json');
const todoDir = path.join(baseDir, '.TODO');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Failed to read or parse ${path.relative(baseDir, filePath)}: ${error.message}`);
    return null;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(`Failed to read ${path.relative(baseDir, filePath)}: ${error.message}`);
    return null;
  }
}

function parseTaskIds(fileText) {
  const ids = [];
  const lines = fileText.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*-\s*(T\d{2,})\./);
    if (match) ids.push(match[1]);
  }
  return ids;
}

function assertLinksSection(fileText, expectedHeader) {
  const regex = new RegExp(`^##\\s+${expectedHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm');
  return regex.test(fileText);
}

(function main() {
  const config = readJson(configPath);
  if (!config) process.exit(1);

  const requiredFields = ['currentTaskPrefix', 'nextTaskNumber', 'todoFiles', 'linksHeader'];
  for (const field of requiredFields) {
    if (!(field in config)) {
      fail(`Missing required field in .todo/config.json: ${field}`);
    }
  }

  const { currentTaskPrefix, nextTaskNumber, todoFiles, linksHeader, taskIdPattern } = config;
  if (typeof currentTaskPrefix !== 'string' || currentTaskPrefix.length === 0) {
    fail('currentTaskPrefix must be a non-empty string.');
  }

  if (!Number.isInteger(nextTaskNumber) || nextTaskNumber <= 0) {
    fail('nextTaskNumber must be a positive integer.');
  }

  if (typeof todoFiles !== 'object' || todoFiles === null) {
    fail('todoFiles must be an object with next/done/ignore/future file paths.');
  }

  const expectedFiles = ['next', 'done', 'ignore', 'future'];
  for (const fileKey of expectedFiles) {
    if (!todoFiles[fileKey] || typeof todoFiles[fileKey] !== 'string') {
      fail(`.todo/config.json.todoFiles must include a string path for ${fileKey}.`);
    }
  }

  const pattern = taskIdPattern ? new RegExp(taskIdPattern) : new RegExp(`^${currentTaskPrefix}\\d{2,}$`);
  const allTaskIds = new Set();
  let maxTaskNumber = 0;

  for (const fileKey of expectedFiles) {
    const filePath = path.join(baseDir, todoFiles[fileKey]);
    const fileText = readText(filePath);
    if (fileText === null) continue;

    if (!assertLinksSection(fileText, linksHeader)) {
      fail(`${path.relative(baseDir, filePath)} must include a '${linksHeader}' section header.`);
    }

    const taskIds = parseTaskIds(fileText);
    for (const id of taskIds) {
      if (!pattern.test(id)) {
        fail(`${path.relative(baseDir, filePath)} contains invalid task id '${id}'. Expected pattern ${pattern}.`);
      }
      if (allTaskIds.has(id)) {
        fail(`Duplicate task id found across todo files: ${id}`);
      }
      allTaskIds.add(id);
      const number = Number(id.slice(currentTaskPrefix.length));
      if (Number.isFinite(number) && number > maxTaskNumber) maxTaskNumber = number;
    }
  }

  if (nextTaskNumber <= maxTaskNumber) {
    fail(`.todo/config.json.nextTaskNumber must be greater than the highest existing task id (${currentTaskPrefix}${maxTaskNumber}).`);
  }

  const stringTasks = Array.from(allTaskIds).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (stringTasks.length === 0) {
    console.warn('No TODO task IDs were found in the configured todo files.');
  }

  console.log('✔ TODO management configuration is valid.');
  process.exit(process.exitCode || 0);
})();
