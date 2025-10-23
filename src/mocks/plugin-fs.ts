// Mock implementation of @tauri-apps/plugin-fs for browser mode
// Simulates file system operations using localStorage as a virtual file system

export enum BaseDirectory {
  AppLocalData = 'AppLocalData',
  // Add other directories if needed in the future
}

const FS_PREFIX = 'plugin-fs:';

// Simple virtual file system using localStorage
// Keys are prefixed with FS_PREFIX + baseDir + path
// Values are 'file' for files, or JSON string for directories (object with sub-items)

function getKey(baseDir: BaseDirectory, path: string): string {
  return `${FS_PREFIX}${baseDir}:${path}`;
}

function isDirectory(value: string | null): boolean {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

function getDirectoryContents(
  baseDir: BaseDirectory,
  path: string
): Record<string, unknown> | null {
  const key = getKey(baseDir, path);
  const value = localStorage.getItem(key);
  if (!value || !isDirectory(value)) return null;
  return JSON.parse(value);
}

function removePath(baseDir: BaseDirectory, path: string): void {
  const key = getKey(baseDir, path);
  localStorage.removeItem(key);
}

function listSubPaths(baseDir: BaseDirectory, path: string): string[] {
  const contents = getDirectoryContents(baseDir, path);
  if (!contents) return [];
  return Object.keys(contents);
}

export async function exists(
  path: string,
  options?: { baseDir?: BaseDirectory }
): Promise<boolean> {
  const baseDir = options?.baseDir ?? BaseDirectory.AppLocalData;
  const key = getKey(baseDir, path);
  return localStorage.getItem(key) !== null;
}

export async function remove(
  path: string,
  options?: { baseDir?: BaseDirectory; recursive?: boolean }
): Promise<void> {
  const baseDir = options?.baseDir ?? BaseDirectory.AppLocalData;
  const recursive = options?.recursive ?? false;

  if (!(await exists(path, { baseDir }))) {
    throw new Error(`Path does not exist: ${path}`);
  }

  const key = getKey(baseDir, path);
  const value = localStorage.getItem(key);

  if (isDirectory(value)) {
    if (recursive) {
      // Remove all sub-items recursively
      const subPaths = listSubPaths(baseDir, path);
      for (const subPath of subPaths) {
        const fullSubPath = path.endsWith('/') ? `${path}${subPath}` : `${path}/${subPath}`;
        await remove(fullSubPath, { baseDir, recursive: true });
      }
    } else {
      // Check if directory is empty
      const contents = getDirectoryContents(baseDir, path);
      if (contents && Object.keys(contents).length > 0) {
        throw new Error(`Directory is not empty: ${path}`);
      }
    }
  }

  removePath(baseDir, path);
}

export async function rename(
  oldPath: string,
  newPath: string,
  options?: {
    oldPathBaseDir?: BaseDirectory;
    newPathBaseDir?: BaseDirectory;
  }
): Promise<void> {
  const oldBaseDir = options?.oldPathBaseDir ?? BaseDirectory.AppLocalData;
  const newBaseDir = options?.newPathBaseDir ?? BaseDirectory.AppLocalData;

  if (!(await exists(oldPath, { baseDir: oldBaseDir }))) {
    throw new Error(`Old path does not exist: ${oldPath}`);
  }

  if (await exists(newPath, { baseDir: newBaseDir })) {
    throw new Error(`New path already exists: ${newPath}`);
  }

  // Get the value from old path
  const oldKey = getKey(oldBaseDir, oldPath);
  const value = localStorage.getItem(oldKey);

  // Set to new path
  const newKey = getKey(newBaseDir, newPath);
  localStorage.setItem(newKey, value!);

  // Remove old path
  localStorage.removeItem(oldKey);

  // If it's a directory, update parent references if needed
  // For simplicity, assume paths are absolute and no parent updates needed
}
