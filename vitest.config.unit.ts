import { sveltekit } from '@sveltejs/kit/vite';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [sveltekit()],
  test: {
    name: 'unit',
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.ts'],
    exclude: ['**/*.browser.test.ts', '**/node_modules/**', '**/e2e-tests/**'],
  },
});
