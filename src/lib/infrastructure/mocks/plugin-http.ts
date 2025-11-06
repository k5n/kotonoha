/**
 * Mock implementation of @tauri-apps/plugin-http for browser mode.
 * This provides a minimal fetch function compatible with the actual plugin's interface,
 * using the browser's native fetch API.
 */

/**
 * Fetches a resource from the network.
 * @param input - The resource to fetch, either a RequestInfo or URL.
 * @param init - Optional request initialization options.
 * @returns A Promise that resolves to a Response object.
 */
export function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return globalThis.fetch(input, init);
}
