#!/usr/bin/env node
const readline = require('readline');
const { runCreateNodes } = require('../shared/create-nodes');

const relOptimized = './Output-generated/HTML Optimised';
const relPreview = './Output-generated/Data preview';

function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(`Generate data preview from ${relOptimized}? [Y/N] `, answer => {
    rl.close();
    const choice = String(answer || '').trim().toLowerCase().slice(0, 1);
    if (choice !== 'y') {
      console.log('Aborted.');
      process.exit(0);
    }

    runCreateNodes();
    console.log(`Preview output: ${relPreview}`);
  });
}

main();
