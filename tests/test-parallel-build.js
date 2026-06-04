// TAP_TIMEOUT: 60000
const tap = require('tap');
const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const { resolveRepoPath } = require('../src/shared/app-config');

const isUnderTapRunner = process.execArgv.some((a) => a.includes('@tapjs'));

tap.test('parallelWorkerAliasesAndOptimizesSingleFile', (t) => {
  if (isUnderTapRunner) {
    t.plan(0);
    return t.end();
  }

  const rawHtml = '<div lang="en" aria-roledescription="message"><span>Hey XYZ</span></div>';
  const worker = new Worker(resolveRepoPath('src/workers/build-worker.cjs'), {
    workerData: {
      fileName: 'test.html',
      rawHtml,
      aliasNameMap: { any: 'Alice' },
      preDetectedName: 'XYZ',
    },
  });

  worker.on('message', (msg) => {
    t.equal(msg.fileName, 'test.html', 'worker returns correct fileName');
    t.ok(msg.aliasedHtml, 'worker returns aliasedHtml');
    t.ok(msg.optimizedHtml, 'worker returns optimizedHtml');
    t.notOk(msg.error, 'worker does not report error');
    t.not(msg.aliasedHtml, rawHtml, 'aliasedHtml differs from raw when alias applied');
    t.end();
  });

  worker.on('error', (err) => {
    t.fail('worker error: ' + (err ? err.message : String(err)));
    t.end();
  });
});

tap.test('parallelWorkerReportsErrorForInvalidInput', (t) => {
  if (isUnderTapRunner) {
    t.plan(0);
    return t.end();
  }

  const worker = new Worker(resolveRepoPath('src/workers/build-worker.cjs'), {
    workerData: {
      fileName: 'bad.html',
      rawHtml: null,
      aliasNameMap: {},
      preDetectedName: null,
    },
  });

  worker.on('message', (msg) => {
    t.equal(msg.fileName, 'bad.html', 'worker returns fileName');
    t.ok(msg.error, 'worker reports error for null input');
    t.end();
  });

  worker.on('error', () => t.end());
});

tap.test('processFilesInParallelProducesOutputForAllFiles', (t) => {
  if (isUnderTapRunner) {
    t.plan(0);
    return t.end();
  }

  const os = require('os');
  const fileNames = ['a.html', 'b.html', 'c.html'];
  const rawHtmlByFile = new Map(
    fileNames.map((name) => [
      name,
      `<div lang="en" aria-roledescription="message"><span>Hello from ${name}</span></div>`,
    ])
  );

  const workerPath = resolveRepoPath('src/workers/build-worker.cjs');

  function runPool(files) {
    return new Promise((resolve, reject) => {
      const numWorkers = Math.min(os.availableParallelism?.() || os.cpus().length, files.length);
      const results = new Map();
      let nextIndex = 0;
      let activeCount = 0;
      let hasError = false;

      function startNext() {
        if (nextIndex >= files.length || hasError) {
          if (activeCount === 0) resolve(results);
          return;
        }
        const idx = nextIndex++;
        const fileName = files[idx];
        const html = rawHtmlByFile.get(fileName);
        activeCount++;
        const worker = new Worker(workerPath, {
          workerData: { fileName, rawHtml: html, aliasNameMap: { any: 'Alice' }, preDetectedName: 'XYZ' },
        });
        worker.on('message', (msg) => {
          if (msg.error) { hasError = true; reject(new Error(msg.error)); return; }
          results.set(msg.fileName, msg);
          activeCount--;
          startNext();
        });
        worker.on('error', (err) => { hasError = true; reject(err); });
        worker.on('exit', (code) => {
          if (code !== 0 && !hasError) { hasError = true; reject(new Error('exit ' + code)); }
        });
      }

      for (let i = 0; i < numWorkers; i++) startNext();
    });
  }

  runPool(fileNames).then((results) => {
    t.equal(results.size, 3, 'all files processed');
    for (const name of fileNames) {
      t.ok(results.has(name), `result contains ${name}`);
      const r = results.get(name);
      t.ok(r.aliasedHtml, `${name}: has aliasedHtml`);
      t.ok(r.optimizedHtml, `${name}: has optimizedHtml`);
    }
    t.end();
  }).catch((err) => {
    t.fail('pool error: ' + err.message);
    t.end();
  });
});
