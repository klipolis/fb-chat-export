/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow longer subjects — export-tool commits can be descriptive
    'subject-max-length': [1, 'warn', 120],
    // Enforce recognised types only
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'test', 'refactor', 'perf', 'ci', 'revert'],
    ],
  },
};
