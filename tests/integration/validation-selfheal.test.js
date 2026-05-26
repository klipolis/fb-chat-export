const tap = require('tap');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const { resolveRepoPath } = require('../../src/shared/app-config');

const scriptsDir = resolveRepoPath('scripts');

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function runValidationScript(scriptName, args, env = {}) {
  return childProcess.spawnSync(
    'node',
    [path.join(scriptsDir, scriptName), ...args],
    {
      cwd: resolveRepoPath(),
      env: { ...process.env, ...env },
      encoding: 'utf8',
    }
  );
}

function createTodoFixture(rootDir) {
  const todoDir = path.join(rootDir, '.todo');
  fs.mkdirSync(todoDir, { recursive: true });

  writeJson(path.join(todoDir, 'config.json'), {
    currentTaskPrefix: 'T',
    nextTaskNumber: 1,
    todoFiles: {
      next: 'next.md',
      done: 'done.md',
      ignore: 'ignore.md',
      future: 'future.md',
    },
    linksHeader: 'Links',
    taskIdPattern: '^T\\d{2,}$',
  });

  fs.writeFileSync(
    path.join(todoDir, 'next.md'),
    '- T01. now tidy sample\n- T02. now fix bug\n',
    'utf8'
  );
  fs.writeFileSync(path.join(todoDir, 'done.md'), '- T03. done task\n', 'utf8');
  fs.writeFileSync(path.join(todoDir, 'ignore.md'), '- T04. now ignore this\n', 'utf8');
  fs.writeFileSync(path.join(todoDir, 'future.md'), '- T05. now future step\n', 'utf8');
}

function createChangelogFixture(rootDir, content) {
  fs.writeFileSync(path.join(rootDir, 'CHANGELOG.md'), content, 'utf8');
}

tap.test('validation scripts are failsafe and self-healing', (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-chat-export-validation-'));
  t.teardown(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

  const packageJsonPath = path.join(tempRoot, 'package.json');
  writeJson(packageJsonPath, {
    version: '1.0.0',
    name: 'chat-exporter',
    private: true,
    packageManager: 'pnpm@11.1.2',
    type: 'module',
    license: 'MIT',
    pnpm: { onlyBuiltDependencies: ['esbuild'] },
    engines: { node: '>=26.0.0', pnpm: '>=11.1.2' },
    scripts: {
      lint: 'pnpm run lint:package',
      build: 'pnpm run build',
    },
    devDependencies: {
      eslint: '^10.0.0',
    },
  });

  createTodoFixture(tempRoot);
  createChangelogFixture(tempRoot, '# Changelog\n\n## [1.0.0] 2026-05-01\n- Released stable build\n');

  const env = { CHAT_EXPORTER_ROOT: tempRoot };

  t.test('check-package-json supports --fix alias and sorts package.json', (t) => {
    const result = runValidationScript('check-package-json.js', ['--fix'], env);
    t.equal(result.status, 0, `package script should succeed: ${result.stderr || result.stdout}`);

    const actual = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    t.strictSame(
      Object.keys(actual),
      ['name', 'type', 'version', 'license', 'engines', 'packageManager', 'pnpm', 'private', 'scripts', 'devDependencies'],
      'package.json root keys should be reordered to the explicit schema'
    );
    t.strictSame(
      Object.keys(actual.scripts),
      ['build', 'lint'],
      'package.json scripts should be alphabetized'
    );
    t.ok(result.stdout.includes('self-healed'), 'package script should report self-heal success');
    t.end();
  });

  t.test('check-unreleased self-heals a missing [Unreleased] section', (t) => {
    const result = runValidationScript('check-unreleased.js', ['--fix'], env);
    t.equal(result.status, 0, `unreleased script should succeed: ${result.stderr || result.stdout}`);

    const changelog = fs.readFileSync(path.join(tempRoot, 'CHANGELOG.md'), 'utf8');
    t.match(changelog, /^## \[Unreleased\]/m, 'CHANGELOG.md should contain [Unreleased] section after fix');
    t.match(changelog, /- TODO: add release notes here/, 'CHANGELOG.md should include a placeholder entry after fix');
    t.end();
  });

  t.test('check-todo-management self-heals invalid task wording and nextTaskNumber', (t) => {
    const result = runValidationScript('check-todo-management.js', ['--fix'], env);
    t.equal(result.status, 0, `todo management script should succeed: ${result.stderr || result.stdout}`);

    const config = JSON.parse(fs.readFileSync(path.join(tempRoot, '.todo', 'config.json'), 'utf8'));
    t.equal(config.nextTaskNumber, 6, 'nextTaskNumber should advance past the highest existing task id');

    const nextFile = fs.readFileSync(path.join(tempRoot, '.todo', 'next.md'), 'utf8');
    t.notMatch(nextFile, /now tidy sample/, 'invalid "now" prefix should be removed by self-heal');
    t.match(nextFile, /## Links/, 'Links header should be added to next.md when missing');

    const ignoreFile = fs.readFileSync(path.join(tempRoot, '.todo', 'ignore.md'), 'utf8');
    t.match(ignoreFile, /## Links/, 'Links header should be added to ignore.md when missing');

    t.ok(result.stdout.includes('self-healed'), 'todo management script should report self-heal success');
    t.end();
  });

  t.test('check-package-json passes once fixed', (t) => {
    const result = runValidationScript('check-package-json.js', [], env);
    t.equal(result.status, 0, `package script should pass after self-heal: ${result.stderr || result.stdout}`);
    t.end();
  });

  t.test('check-unreleased passes once fixed', (t) => {
    const result = runValidationScript('check-unreleased.js', [], env);
    t.equal(result.status, 0, `unreleased script should pass after self-heal: ${result.stderr || result.stdout}`);
    t.end();
  });

  t.test('check-todo-management passes once fixed', (t) => {
    const result = runValidationScript('check-todo-management.js', [], env);
    t.equal(result.status, 0, `todo management script should pass after self-heal: ${result.stderr || result.stdout}`);
    t.end();
  });

  t.end();
});
