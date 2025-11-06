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
      ? (() => {
          const mockDir = path.resolve(__dirname, 'src/lib/infrastructure/mocks');
          return {
            '@tauri-apps/plugin-store': path.resolve(mockDir, 'plugin-store.ts'),
            '@tauri-apps/api/app': path.resolve(mockDir, 'api-app.ts'),
            '@tauri-apps/plugin-stronghold': path.resolve(mockDir, 'plugin-stronghold.ts'),
            '@tauri-apps/api/core': path.resolve(mockDir, 'api-core.ts'),
            '@tauri-apps/api/event': path.resolve(mockDir, 'api-event.ts'),
            '@tauri-apps/api/path': path.resolve(mockDir, 'api-path.ts'),
            '@tauri-apps/plugin-log': path.resolve(mockDir, 'plugin-log.ts'),
            '@tauri-apps/plugin-sql': path.resolve(mockDir, 'plugin-sql.ts'),
            '@tauri-apps/plugin-fs': path.resolve(mockDir, 'plugin-fs.ts'),
            '@tauri-apps/plugin-http': path.resolve(mockDir, 'plugin-http.ts'),
            '@tauri-apps/plugin-dialog': path.resolve(mockDir, 'plugin-dialog.ts'),
          };
        })()
      : {},
  },
}));
