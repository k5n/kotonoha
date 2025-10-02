import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { type Client, Stronghold } from '@tauri-apps/plugin-stronghold';

const STRONGHOLD_KEY_GEMINI_API_KEY = 'gemini_api_key';
const STRONGHOLD_KEY_YOUTUBE_API_KEY = 'youtube_api_key';

async function initStronghold(): Promise<{
  stronghold: Stronghold;
  client: Client;
}> {
  const vaultPath = `${await appDataDir()}/vault.hold`;
  const vaultPassword = await invoke<string>('get_stronghold_password');
  const stronghold = await Stronghold.load(vaultPath, vaultPassword);

  const clientName = 'kotonoha-client';
  try {
    const client = await stronghold.loadClient(clientName);
    return {
      stronghold,
      client,
    };
  } catch {
    const client = await stronghold.createClient(clientName);
    return {
      stronghold,
      client,
    };
  }
}

async function saveKey(key: string, value: string): Promise<void> {
  const { stronghold, client } = await initStronghold();
  const data = Array.from(new TextEncoder().encode(value));
  const store = client.getStore();
  await store.insert(key, data);
  await stronghold.save();
}

async function getKey(key: string): Promise<string | null> {
  const { client } = await initStronghold();
  const store = client.getStore();
  const data = await store.get(key);
  if (data == null) return null;
  return new TextDecoder().decode(new Uint8Array(data));
}

export const apiKeyRepository = {
  async saveGeminiApiKey(apiKey: string): Promise<void> {
    await saveKey(STRONGHOLD_KEY_GEMINI_API_KEY, apiKey);
  },

  async getGeminiApiKey(): Promise<string | null> {
    return await getKey(STRONGHOLD_KEY_GEMINI_API_KEY);
  },

  async saveYoutubeApiKey(apiKey: string): Promise<void> {
    await saveKey(STRONGHOLD_KEY_YOUTUBE_API_KEY, apiKey);
  },

  async getYoutubeApiKey(): Promise<string | null> {
    return await getKey(STRONGHOLD_KEY_YOUTUBE_API_KEY);
  },
};
