const { parentPort, workerData } = require('worker_threads');
const { aliasChatNames } = require('../shared/utils');
const { createOptimizedHtml } = require('../shared/optimize-html');

const { fileName, rawHtml, aliasNameMap, preDetectedName } = workerData;

try {
  const aliasedHtml = aliasChatNames(rawHtml, aliasNameMap, preDetectedName);
  const optimizedHtml = createOptimizedHtml(aliasedHtml);
  parentPort.postMessage({ fileName, optimizedHtml, aliasedHtml });
} catch (err) {
  parentPort.postMessage({ fileName, error: err.message });
}
