import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
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
  // Node.js環境で利用される設定ファイル用
  // .mjs 拡張子じゃなくて .js 拡張子を利用しても良いように。
  {
    files: ['*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  // Prettierと競合するルールを無効化
  prettier
);
