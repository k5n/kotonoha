import type { Settings } from '$lib/domain/entities/settings';
import { load } from '@tauri-apps/plugin-store';

const SETTINGS_FILENAME = 'settings.json';
const DEFAULT_LANGUAGE = 'en';

export const settingsRepository = {
  async getSettings(): Promise<Settings> {
    const store = await load(SETTINGS_FILENAME, { autoSave: false });
    const language = await store.get<string>('language');
    const learningTargetLanguages = await store.get<string[]>('learningTargetLanguages');

    return {
      language: language ?? DEFAULT_LANGUAGE,
      learningTargetLanguages: learningTargetLanguages ?? [],
    };
  },

  async saveSettings(settings: Settings): Promise<void> {
    const store = await load(SETTINGS_FILENAME, { autoSave: false });
    await store.set('language', settings.language);
    await store.set('learningTargetLanguages', settings.learningTargetLanguages);
    await store.save();
  },
};
