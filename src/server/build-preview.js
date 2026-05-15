#!/usr/bin/env node
const { runCreateNodes } = require('../shared/create-nodes');

const relPreview = './Output-generated/Data preview';

function main() {
  runCreateNodes();
  console.log(`Preview output: ${relPreview}`);
}

main();
