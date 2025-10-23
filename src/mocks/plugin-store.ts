// Mock implementation of @tauri-apps/plugin-store for browser mode
// Uses localStorage for persistence

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
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.path);
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      this.data = {};
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.path, JSON.stringify(this.data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    return (this.data[key] as T) ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data[key] = value;
    if (this.autoSave) {
      this.saveToStorage();
    }
  }

  async save(): Promise<void> {
    this.saveToStorage();
  }
}

export async function load(path: string, options?: StoreOptions): Promise<Store> {
  return new MockStore(path, options);
}
