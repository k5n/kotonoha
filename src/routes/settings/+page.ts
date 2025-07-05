import { fetchSettings } from '$lib/application/usecases/fetchSettings';
import { error } from '@tauri-apps/plugin-log';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  try {
    const settings = await fetchSettings();
    return {
      isApiKeySet: !!settings.geminiApiKey,
    };
  } catch (e) {
    error(`Failed to load API Key: ${e}`);
    return {
      isApiKeySet: false,
      error: 'APIキーの読み込みに失敗しました。',
    };
  }
};
