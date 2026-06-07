import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',

      '**/*.log',
    ],
  },
  // CommonJS files: build scripts, tests, server source, shared modules
  {
    files: ['src/**/*.{js,cjs}', 'tests/**/*.{js,cjs}', 'scripts/**/*.{js,cjs}'],
    ignores: ['src/frontend/src/**/*.js', 'src/shared/frontend-utils.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
    },
  },
  // ESM frontend source (bundled by esbuild, uses import/export)
  {
    files: ['src/frontend/src/**/*.js', 'src/shared/frontend-utils.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
    },
  },
];
