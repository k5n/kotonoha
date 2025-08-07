import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { type Client, Stronghold } from '@tauri-apps/plugin-stronghold';

const STRONGHOLD_KEY_GEMINI_API_KEY = 'gemini_api_key';

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

export const apiKeyRepository = {
  async saveApiKey(apiKey: string): Promise<void> {
    const { stronghold, client } = await initStronghold();
    const data = Array.from(new TextEncoder().encode(apiKey));
    const store = client.getStore();
    await store.insert(STRONGHOLD_KEY_GEMINI_API_KEY, data);
    await stronghold.save();
  },

  async getApiKey(): Promise<string | null> {
    const { client } = await initStronghold();
    const store = client.getStore();
    const data = await store.get(STRONGHOLD_KEY_GEMINI_API_KEY);
    if (data == null) return null;
    return new TextDecoder().decode(new Uint8Array(data));
  },
};
