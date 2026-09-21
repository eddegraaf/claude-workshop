const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
      'playwright/.cache/**',
      'eslint.config.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    plugins: { playwright },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Assertions live inside Page Object methods (e.g. `expectNoResults`) per this
      // project's POM rule, not inline in the test body — recognize that convention.
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expect'], assertFunctionPatterns: ['^expect'] },
      ],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  eslintConfigPrettier,
);
