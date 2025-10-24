/* eslint-env node */
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.TAURI_DEV_HOST;
const isBrowserMode = process.env.VITE_RUN_MODE === 'browser';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [tailwindcss(), sveltekit()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  // 4. Alias for browser mode
  resolve: {
    alias: isBrowserMode
      ? [
          {
            find: '@tauri-apps/plugin-store',
            replacement: path.resolve(__dirname, 'src/mocks/plugin-store.ts'),
          },
          {
            find: '@tauri-apps/api/app',
            replacement: path.resolve(__dirname, 'src/mocks/api-app.ts'),
          },
          {
            find: '@tauri-apps/plugin-stronghold',
            replacement: path.resolve(__dirname, 'src/mocks/plugin-stronghold.ts'),
          },
          {
            find: '@tauri-apps/api/core',
            replacement: path.resolve(__dirname, 'src/mocks/api-core.ts'),
          },
          {
            find: '@tauri-apps/api/event',
            replacement: path.resolve(__dirname, 'src/mocks/api-event.ts'),
          },
          {
            find: '@tauri-apps/api/path',
            replacement: path.resolve(__dirname, 'src/mocks/api-path.ts'),
          },
          {
            find: '@tauri-apps/plugin-log',
            replacement: path.resolve(__dirname, 'src/mocks/plugin-log.ts'),
          },
          {
            find: '@tauri-apps/plugin-sql',
            replacement: path.resolve(__dirname, 'src/mocks/plugin-sql.ts'),
          },
          {
            find: '@tauri-apps/plugin-fs',
            replacement: path.resolve(__dirname, 'src/mocks/plugin-fs.ts'),
          },
          {
            find: '@tauri-apps/plugin-http',
            replacement: path.resolve(__dirname, 'src/mocks/plugin-http.ts'),
          },
          {
            find: '@tauri-apps/plugin-dialog',
            replacement: path.resolve(__dirname, 'src/mocks/plugin-dialog.ts'),
          },
        ]
      : [],
  },
}));
