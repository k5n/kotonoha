import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import mochaPlugin from 'eslint-plugin-mocha';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    // .eslintignore の代替
    ignores: ['src-tauri/', 'doc/', '.vscode/', '.svelte-kit/'],
  },
  eslint.configs.recommended,
  svelte.configs['flat/recommended'],
  tsEslint.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  // Other config for non-Svelte files
  {
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  // Svelte config
  {
    files: [
      '**/*.svelte',
      '**/*.svelte.ts', // Svelte files with TypeScript
    ],
    languageOptions: {
      parser: svelteParser,
      // Parse the `<script>` in `.svelte` as TypeScript by adding the following configuration.
      parserOptions: {
        parser: tsEslint.parser,
      },
      globals: {
        ...globals.browser,
        YT: 'readonly',
      },
    },
  },
  // Vitest plugin for test files (flat config requires the plugin object
  // to be defined in the same config object that applies the rules)
  {
    files: ['**/*.test.ts'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
  // Mocha plugin for e2e test files
  {
    files: ['e2e-tests/specs/**/*.e2e.{js,ts}'],
    rules: {
      ...mochaPlugin.configs.recommended.rules,
    },
  },
  // For configuration files used in Node.js environment
  // You can now use the .js extension instead of the .mjs extension.
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  // Disable rules that conflict with Prettier
  prettier
);
