import { sveltekit } from '@sveltejs/kit/vite';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [sveltekit()],
  test: {
    name: 'nodejs',
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['**/*.browser.test.ts', '**/node_modules/**', '**/e2e-tests/**', 'src-tauri/**'],
  },
});
