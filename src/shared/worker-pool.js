'use strict';

const os = require('os');
const { Worker } = require('worker_threads');

function processInPool(files, workerPath, buildWorkerData) {
  let resolvePool;
  let rejectPool;
  const promise = new Promise((resolve, reject) => {
    resolvePool = resolve;
    rejectPool = reject;
  });

  if (files.length === 0) {
    resolvePool(new Map());
    return { promise, terminate: () => {} };
  }

  const numWorkers = os.availableParallelism?.() || os.cpus().length;
  const results = new Map();
  const workers = new Set();
  let nextIndex = 0;
  let activeCount = 0;
  let hasError = false;
  let finished = false;

  function terminate(reason) {
    if (finished) return;
    finished = true;
    for (const w of workers) {
      w.terminate();
    }
    workers.clear();
    if (reason) rejectPool(new Error(reason));
  }

  function cleanup() {
    finished = true;
    workers.clear();
  }

  function startNext() {
    if (finished) return;
    if (nextIndex >= files.length || hasError) {
      if (activeCount === 0) { cleanup(); resolvePool(results); }
      return;
    }
    const idx = nextIndex++;
    const fileName = files[idx];
    activeCount++;

    const worker = new Worker(workerPath, {
      workerData: buildWorkerData(fileName),
    });

    workers.add(worker);

    const done = () => {
      workers.delete(worker);
      activeCount--;
      if (finished) return;
      if (activeCount === 0 && (nextIndex >= files.length || hasError)) {
        cleanup();
        if (!hasError) resolvePool(results);
      } else {
        startNext();
      }
    };

    worker.on('message', (msg) => {
      if (finished) return;
      if (msg.error) { hasError = true; terminate(`Worker error for ${fileName}: ${msg.error}`); return; }
      results.set(msg.fileName, msg);
      done();
    });

    worker.on('error', (err) => {
      if (finished) return;
      hasError = true;
      terminate(err.message);
    });

    worker.on('exit', (code) => {
      if (finished) return;
      if (code !== 0 && !hasError) {
        hasError = true;
        terminate(`Worker exited with code ${code}`);
        return;
      }
      done();
    });
  }

  for (let i = 0; i < numWorkers; i++) startNext();

  return { promise, terminate: () => terminate('Worker pool terminated') };
}

module.exports = { processInPool };
