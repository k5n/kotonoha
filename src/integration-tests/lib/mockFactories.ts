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
 * Create a stateful mock Tauri plugin-store instance.
 * - Persists values in-memory across multiple `load()` calls in tests.
 * - Allows tests to toggle save success/failure.
 */
export function createStatefulStore(initial?: {
  language?: string;
  learningTargetLanguages?: readonly string[];
  explanationLanguages?: readonly string[];
}) {
  const state = new Map<string, unknown>();
  if (initial?.language !== undefined) state.set('language', initial.language);
  if (initial?.learningTargetLanguages !== undefined)
    state.set('learningTargetLanguages', [...initial.learningTargetLanguages]);
  if (initial?.explanationLanguages !== undefined)
    state.set('explanationLanguages', [...initial.explanationLanguages]);

  let failNextSave = false;
  let saveDelayMs = 0;

  return {
    /** Get a value from the store */
    get: vi.fn(async (key: string) => {
      if (!state.has(key)) return null;
      return state.get(key) as unknown;
    }),
    /** Set a value in the store */
    set: vi.fn(async (key: string, value: unknown) => {
      state.set(key, value);
    }),
    /** Save the store (can be configured to fail) */
    save: vi.fn(async () => {
      if (saveDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, saveDelayMs));
      }
      if (failNextSave) {
        failNextSave = false; // consume the failure flag
        throw new Error('Simulated save failure');
      }
    }),
    /** Utilities for tests */
    __setFailNextSave(flag: boolean) {
      failNextSave = flag;
    },
    __setSaveDelay(ms: number) {
      saveDelayMs = ms;
    },
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
