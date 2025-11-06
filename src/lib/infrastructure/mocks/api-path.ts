// Mock implementation of @tauri-apps/api/path for browser mode

export async function appDataDir(): Promise<string> {
  return '/mock/appdata';
}
