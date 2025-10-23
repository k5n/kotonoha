// Mock implementation of @tauri-apps/plugin-log for browser mode
// Does nothing, as console forwarding is handled separately

export async function debug(_message: string): Promise<void> {}

export async function error(_message: string): Promise<void> {}

export async function info(_message: string): Promise<void> {}

export async function trace(_message: string): Promise<void> {}

export async function warn(_message: string): Promise<void> {}
