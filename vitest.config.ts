import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Define multiple projects for unit tests and browser tests
    projects: ['./vitest.config.unit.ts', './vitest.config.browser.ts'],
  },
});
