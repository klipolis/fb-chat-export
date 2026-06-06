#!/usr/bin/env node
/**
 * pnpm prompt — list or show prompt files from project-prompts/
 *
 * Usage:
 *   pnpm prompt                        list available prompts
 *   pnpm prompt <name>                 show a prompt's content
 *   pnpm prompt -- <name>              same (alt form)
 *   pnpm run prompt:<name>             dedicated script per prompt
 */

const fs = require('fs');
const path = require('path');

const promptsDir = path.resolve(__dirname, '..', 'project-prompts');

const lifecycle = process.env.npm_lifecycle_event || '';
const name = lifecycle.startsWith('prompt:')
  ? lifecycle.slice('prompt:'.length)
  : process.argv.slice(2).find(a => a !== '--');

const catalog = {
  'code-improvement-prompts': {
    file: 'code-improvement-prompts.md',
    description: 'Index of audit and task-generation prompts',
  },
  'code-audit-prompts': {
    file: 'code-audit-prompts.md',
    description: 'Audit prompts that write findings to project-logs/audit-log.md',
  },
  'code-task-generation': {
    file: 'code-task-generation.md',
    description: 'Generates improvement tasks across project areas into TODO files',
  },
  'project-reproduction': {
    file: 'project-reproduction.md',
    description: 'Prompt examples for reproducing project and docs changes',
  },
  'trace-guidance': {
    file: 'trace-guidance.md',
    description: 'Guidance on recording AI interactions as trace documentation',
  },
};

if (name) {
  const key = name.replace(/\.md$/i, '');
  const entry = catalog[key];
  if (!entry) {
    console.error(`Unknown prompt: "${name}". Use "pnpm prompt" to list available prompts.`);
    process.exit(1);
  }
  const filePath = path.join(promptsDir, entry.file);
  const content = fs.readFileSync(filePath, 'utf8');
  process.stdout.write(content);
} else {
  console.log('Available prompts:\n');
  for (const [key, entry] of Object.entries(catalog)) {
    console.log(`  prompt:${key.padEnd(24)} ${entry.description}`);
  }
  console.log('\nUsage: pnpm run prompt:<name>   (e.g. pnpm run prompt:trace-guidance)');
  console.log('       pnpm prompt <name>        (same)');
}
