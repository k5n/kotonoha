// Mock implementation of @tauri-apps/plugin-fs for browser mode
// Simulates file system operations using an in-memory tree structure

type FsNode = { type: 'file' } | { type: 'dir'; children: Map<string, FsNode> };

export enum BaseDirectory {
  AppLocalData = 'AppLocalData',
}

const fsRoots = new Map<BaseDirectory, FsNode>();

function getRoot(baseDir: BaseDirectory): FsNode {
  let root = fsRoots.get(baseDir);
  if (!root) {
    root = { type: 'dir', children: new Map() };
    fsRoots.set(baseDir, root);
  }
  return root;
}

function resolvePath(
  baseDir: BaseDirectory,
  path: string
): { node: FsNode | null; parent: Map<string, FsNode> | null; name: string | null } {
  const parts = path.split('/').filter((p) => p.length > 0);
  for (const part of parts) {
    if (part === '.' || part === '..') {
      throw new Error(`Path contains invalid component '${part}': ${path}`);
    }
  }
  let current: FsNode = getRoot(baseDir);
  let parent: Map<string, FsNode> | null = null;
  let name: string | null = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current.type !== 'dir') {
      return { node: null, parent: null, name: null };
    }
    parent = current.children;
    name = part;
    const next = current.children.get(part);
    if (!next) {
      return { node: null, parent, name };
    }
    current = next;
  }
  return { node: current, parent, name };
}

function createDirectories(baseDir: BaseDirectory, path: string): void {
  const parts = path.split('/').filter((p) => p.length > 0);
  let current: FsNode = getRoot(baseDir);

  for (const part of parts) {
    if (current.type !== 'dir') {
      throw new Error(`Path is not a directory: ${path} (at '${part}')`);
    }
    let child = current.children.get(part);
    if (!child) {
      child = { type: 'dir', children: new Map() };
      current.children.set(part, child);
    } else if (child.type !== 'dir') {
      throw new Error(`Path already exists as a file: ${path} (at '${part}')`);
    }
    current = child;
  }
}

export async function exists(
  path: string,
  options?: { baseDir?: BaseDirectory }
): Promise<boolean> {
  const baseDir = options?.baseDir ?? BaseDirectory.AppLocalData;
  const { node } = resolvePath(baseDir, path);
  return node !== null;
}

export async function remove(
  path: string,
  options?: { baseDir?: BaseDirectory; recursive?: boolean }
): Promise<void> {
  const baseDir = options?.baseDir ?? BaseDirectory.AppLocalData;
  const recursive = options?.recursive ?? false;
  const { node, parent, name } = resolvePath(baseDir, path);
  if (!node || !parent || !name) {
    throw new Error(`Path does not exist: ${path}`);
  }
  if (node.type === 'dir' && node.children.size > 0 && !recursive) {
    throw new Error(`Directory is not empty: ${path}`);
  }
  parent.delete(name);
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
  const newBaseDir = options?.newPathBaseDir ?? oldBaseDir;
  const { node: oldNode, parent: oldParent, name: oldName } = resolvePath(oldBaseDir, oldPath);
  if (!oldNode || !oldParent || !oldName) {
    throw new Error(`Old path does not exist: ${oldPath}`);
  }
  if (oldBaseDir === newBaseDir && oldPath === newPath) {
    return; // no-op
  }
  const { node: newNode } = resolvePath(newBaseDir, newPath);
  if (newNode) {
    throw new Error(`New path already exists: ${newPath}`);
  }
  // Create directories for new path
  const newParts = newPath.split('/').filter((p) => p.length > 0);
  const newDirPath = newParts.slice(0, -1).join('/');
  if (newDirPath) {
    createDirectories(newBaseDir, newDirPath);
  }
  const { parent: newParent, name: newName } = resolvePath(newBaseDir, newPath);
  if (!newParent || !newName) {
    throw new Error(`Invalid new path: ${newPath}`);
  }
  oldParent.delete(oldName);
  newParent.set(newName, oldNode);
}

function __mockCreateFile(path: string, options?: { baseDir?: BaseDirectory }): void {
  const baseDir = options?.baseDir ?? BaseDirectory.AppLocalData;
  const parts = path.split('/').filter((p) => p.length > 0);
  const dirPath = parts.slice(0, -1).join('/');
  if (dirPath) {
    createDirectories(baseDir, dirPath);
  }
  const { node, parent, name } = resolvePath(baseDir, path);
  if (node && node.type === 'dir') {
    throw new Error(`Path is a directory: ${path}`);
  }
  if (!parent || !name) {
    throw new Error(`Invalid path: ${path}`);
  }
  parent.set(name, { type: 'file' });
}

export async function writeTextFile(
  path: string,
  contents: string,
  options?: { baseDir?: BaseDirectory }
): Promise<void> {
  __mockCreateFile(path, options);
}

export async function writeFile(
  path: string,
  contents: Uint8Array,
  options?: { baseDir?: BaseDirectory }
): Promise<void> {
  __mockCreateFile(path, options);
}

// For testing purposes: reset the entire mock file system
export function __reset(): void {
  fsRoots.clear();
}
