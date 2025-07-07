import eslint from '@eslint/js';
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
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
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
    },
  },
  // Prettierと競合するルールを無効化
  prettier
);
