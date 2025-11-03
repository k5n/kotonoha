// import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { webdriverio } from '@vitest/browser-webdriverio';
import path from 'path';
import { fileURLToPath } from 'url';
import istanbul from 'vite-plugin-istanbul';
import { defineProject } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineProject({
  // plugins: [tailwindcss(), svelte()],
  plugins: [
    tailwindcss(),
    sveltekit(),
    istanbul({
      include: 'src/*',
      exclude: ['node_modules', '**/*.test.ts', '**/*.browser.test.ts'],
      extension: ['.ts', '.svelte'],
      forceBuildInstrument: true,
    }),
  ],
  resolve: {
    alias: {
      $src: path.resolve(__dirname, './src'),
      $lib: path.resolve(__dirname, './src/lib'),
      '$env/dynamic/public': path.resolve(__dirname, './src/mocks/env-dynamic-public.ts'),
    },
  },
  test: {
    name: 'browser',
    setupFiles: ['vitest-browser-svelte'],
    browser: {
      enabled: true,
      provider: webdriverio(),
      instances: [{ browser: 'chrome' }],
    },
    globals: true,
    include: ['**/*.browser.test.ts'],
    exclude: ['**/node_modules/**', '**/e2e-tests/**'],
  },
  build: {
    ssr: false,
  },
});
