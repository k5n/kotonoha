import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // .eslintignore の代替
  {
    ignores: ['src-tauri/', 'doc/', '.vscode/', '.svelte-kit/'],
  },
  eslint.configs.recommended,
  // TypeScript用の設定を .svelte.ts にも適用する
  {
    files: ['**/*.ts', '**/*.svelte.ts'],
    extends: [tseslint.configs.recommended],
  },
  // Svelteコンポーネント(.svelte)用の設定
  // v9以降のeslint-plugin-svelteでは 'flat/recommended' を利用。
  svelte.configs['flat/recommended'],
  // .svelte.ts ファイル専用の追加設定
  {
    files: ['**/*.svelte.ts'],
    languageOptions: {
      // Svelte 5のグローバル変数($stateなど)をESLintに認識させる
      globals: {
        ...svelte.environments.svelte5.globals,
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
