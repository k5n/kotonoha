// Mock implementation of @tauri-apps/plugin-stronghold for browser mode
// getKey always returns null, saveKey throws an error

export class MockStore {
  async get(_key: string): Promise<Uint8Array | null> {
    return null;
  }

  async insert(_key: string, _value: number[]): Promise<void> {
    throw new Error('Not implemented in browser mode');
  }
}

export class MockClient {
  getStore(): MockStore {
    return new MockStore();
  }
}

export class MockStronghold {
  private client: MockClient;

  constructor() {
    this.client = new MockClient();
  }

  static async load(_vaultPath: string, _vaultPassword: string): Promise<MockStronghold> {
    return new MockStronghold();
  }

  async loadClient(_clientName: string): Promise<MockClient> {
    return this.client;
  }

  async createClient(_clientName: string): Promise<MockClient> {
    return this.client;
  }

  async save(): Promise<void> {
    // No-op in mock
  }
}

// Export aliases to match the real plugin's interface
export type Client = MockClient;
export { MockStronghold as Stronghold };
