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
  plugins: [
    tailwindcss(),
    sveltekit(),
    istanbul({
      include: 'src/**',
      exclude: [
        'node_modules',
        '**/*.test.ts',
        '**/*.browser.test.ts',
        '**/mocks/**',
        'src/integration-tests/**',
      ],
      extension: ['.ts', '.svelte'],
      forceBuildInstrument: true,
    }),
  ],
  resolve: {
    alias: {
      $src: path.resolve(__dirname, './src'),
      '$env/dynamic/public': path.resolve(
        __dirname,
        './src/lib/infrastructure/mocks/env-dynamic-public.ts'
      ),
    },
  },
  test: {
    name: 'browser',
    setupFiles: ['vitest-browser-svelte'],
    browser: {
      enabled: true,
      provider: webdriverio(),
      instances: [{ browser: 'chrome' }],
      headless: true,
      viewport: { width: 800, height: 1024 },
    },
    globals: true,
    include: ['src/**/*.browser.test.ts'],
  },
  build: {
    ssr: false,
  },
});
