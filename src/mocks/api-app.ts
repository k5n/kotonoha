// Mock implementation of @tauri-apps/api/app for browser mode
export async function getVersion(): Promise<string> {
  return '0.0.0(browser-mode)';
}
