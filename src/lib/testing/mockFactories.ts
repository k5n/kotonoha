import { vi } from 'vitest';

/**
 * Create a mock Tauri plugin-store instance with configurable return values.
 */
export function createMockStore(overrides?: {
  language?: string;
  learningTargetLanguages?: readonly string[];
  explanationLanguages?: readonly string[];
}) {
  return {
    get: vi.fn(async (key: string) => {
      if (key === 'language') return overrides?.language ?? 'en';
      if (key === 'learningTargetLanguages') return overrides?.learningTargetLanguages ?? [];
      if (key === 'explanationLanguages') return overrides?.explanationLanguages ?? [];
      return null;
    }),
    set: vi.fn(),
    save: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    reset: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    length: vi.fn(),
    load: vi.fn(),
    reload: vi.fn(),
    close: vi.fn(),
  };
}

/**
 * Create a mock Stronghold store with configurable API keys.
 */
export function createMockStrongholdStore(apiKeys?: {
  geminiApiKey?: string;
  youtubeApiKey?: string;
}) {
  return {
    get: vi.fn(async (key: string) => {
      if (key === 'gemini_api_key' && apiKeys?.geminiApiKey) {
        return new TextEncoder().encode(apiKeys.geminiApiKey);
      }
      if (key === 'youtube_api_key' && apiKeys?.youtubeApiKey) {
        return new TextEncoder().encode(apiKeys.youtubeApiKey);
      }
      return null;
    }),
    insert: vi.fn(),
  };
}

/**
 * Create a mock Stronghold client.
 */
export function createMockStrongholdClient(
  strongholdStore: ReturnType<typeof createMockStrongholdStore>
) {
  return {
    getStore: vi.fn(() => strongholdStore),
  };
}

/**
 * Create a mock Stronghold instance.
 */
export function createMockStronghold(client: ReturnType<typeof createMockStrongholdClient>) {
  return {
    loadClient: vi.fn(async () => client),
    createClient: vi.fn(async () => client),
    save: vi.fn(),
  };
}

/**
 * Setup complete Stronghold mock chain with optional API keys.
 */
export function setupStrongholdMock(apiKeys?: { geminiApiKey?: string; youtubeApiKey?: string }) {
  const strongholdStore = createMockStrongholdStore(apiKeys);
  const client = createMockStrongholdClient(strongholdStore);
  const stronghold = createMockStronghold(client);

  return {
    stronghold,
    strongholdStore,
    client,
  };
}
