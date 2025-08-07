// Tauri doesn't have a Node.js server to do proper SSR
// so we will use adapter-static to prerender the app (SSG)
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
import { initializeApplication } from '$lib/application/usecases/initializeApplication';

// Tauri doesn't have a Node.js server to do proper SSR
// so we will use adapter-static to prerender the app (SSG)
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
export const prerender = false;
export const ssr = false;

export async function load() {
  // NOTE: invalidateAll() を呼び出すと、毎回 +layout.ts も load される模様。
  // そのため initializeApplication() 内で、初期化済みかどうかをチェックする必要がある。
  await initializeApplication();
}
