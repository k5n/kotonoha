import type { Settings } from '$lib/domain/entities/settings';
import { getSettingsFilename } from '$lib/infrastructure/config';
import { load } from '@tauri-apps/plugin-store';

const DEFAULT_LANGUAGE = 'en';

export const settingsRepository = {
  async getSettings(): Promise<Settings> {
    const store = await load(await getSettingsFilename(), { autoSave: false });
    const language = await store.get<string>('language');
    const learningTargetLanguages = await store.get<string[]>('learningTargetLanguages');
    const explanationLanguages = await store.get<string[]>('explanationLanguages');

    return {
      language: language ?? DEFAULT_LANGUAGE,
      learningTargetLanguages: learningTargetLanguages ?? [],
      explanationLanguages: explanationLanguages ?? [],
    };
  },

  async saveSettings(settings: Settings): Promise<void> {
    const store = await load(await getSettingsFilename(), { autoSave: false });
    await store.set('language', settings.language);
    await store.set('learningTargetLanguages', settings.learningTargetLanguages);
    await store.set('explanationLanguages', settings.explanationLanguages);
    await store.save();
  },
};
