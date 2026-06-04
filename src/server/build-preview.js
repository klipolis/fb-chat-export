#!/usr/bin/env node
const { runCreateNodes } = require('../shared/create-nodes');

const relPreview = './data-output-auto/json-format';

function main() {
  runCreateNodes();
  console.log(`Preview output: ${relPreview}`);
}

main();
