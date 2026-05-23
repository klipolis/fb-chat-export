#!/usr/bin/env node
const { runCreateNodes } = require('../shared/create-nodes');

const relPreview = './dataset/output-json';

function main() {
  runCreateNodes();
  console.log(`Preview output: ${relPreview}`);
}

main();
