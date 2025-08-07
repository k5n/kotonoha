import type { Settings } from '$lib/domain/entities/settings';
import { load } from '@tauri-apps/plugin-store';

const SETTINGS_FILENAME = 'settings.json';
const DEFAULT_LANGUAGE = 'en';

export const settingsRepository = {
  async getSettings(): Promise<Omit<Settings, 'isApiKeySet'>> {
    const store = await load(SETTINGS_FILENAME, { autoSave: false });
    const language = await store.get<string>('language');

    return {
      language: language ?? DEFAULT_LANGUAGE,
    };
  },

  async saveSettings(settings: Omit<Settings, 'isApiKeySet'>): Promise<void> {
    const store = await load(SETTINGS_FILENAME, { autoSave: false });
    await store.set('language', settings.language);
    await store.save();
  },
};
