// Mock implementation of @tauri-apps/plugin-store for browser mode
// Uses an in-memory store for persistence during the session

type StoreSnapshot = Record<string, unknown>;

const storeEntries = new Map<string, StoreSnapshot>();

function cloneSnapshot<T>(data: T): T {
  try {
    if (typeof globalThis.structuredClone === 'function') {
      return globalThis.structuredClone(data);
    }
  } catch {
    // Ignore structuredClone errors and fall back to JSON cloning
  }
  return JSON.parse(JSON.stringify(data)) as T;
}

export const storeMemory = {
  read(path: string): StoreSnapshot | undefined {
    const data = storeEntries.get(path);
    return data ? cloneSnapshot(data) : undefined;
  },
  write(path: string, data: StoreSnapshot): void {
    storeEntries.set(path, cloneSnapshot(data));
  },
  delete(path: string): void {
    storeEntries.delete(path);
  },
  has(path: string): boolean {
    return storeEntries.has(path);
  },
};

interface StoreOptions {
  autoSave?: boolean;
}

interface Store {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  save(): Promise<void>;
}

class MockStore implements Store {
  private data: Record<string, unknown> = {};
  private path: string;
  private autoSave: boolean;

  constructor(path: string, options: StoreOptions = {}) {
    this.path = path;
    this.autoSave = options.autoSave ?? true;
    const stored = storeMemory.read(this.path);
    if (stored) {
      this.data = stored;
    } else {
      storeMemory.write(this.path, this.data);
    }
  }

  private persist(): void {
    storeMemory.write(this.path, this.data);
  }

  async get<T>(key: string): Promise<T | null> {
    return (this.data[key] as T) ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data[key] = value;
    if (this.autoSave) {
      this.persist();
    }
  }

  async save(): Promise<void> {
    this.persist();
  }
}

export async function load(path: string, options?: StoreOptions): Promise<Store> {
  return new MockStore(path, options);
}
