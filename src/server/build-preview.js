#!/usr/bin/env node
const { runCreateNodes } = require('../shared/create-nodes');

const relPreview = './demo/output-json';

function main() {
  runCreateNodes();
  console.log(`Preview output: ${relPreview}`);
}

main();
