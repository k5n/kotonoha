import { fetchAppInfo } from '$lib/application/usecases/fetchAppInfo';
import { fetchSettings } from '$lib/application/usecases/fetchSettings';
import { error } from '@tauri-apps/plugin-log';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  try {
    const { isGeminiApiKeySet, isYoutubeApiKeySet, settings } = await fetchSettings();
    const appInfo = await fetchAppInfo();
    return {
      isGeminiApiKeySet,
      isYoutubeApiKeySet,
      settings,
      appInfo,
      errorKey: null,
    };
  } catch (e) {
    error(`Failed to load API Key: ${e}`);
    return {
      isGeminiApiKeySet: false,
      isYoutubeApiKeySet: false,
      settings: null,
      appInfo: null,
      errorKey: 'settings.notifications.loadError',
    };
  }
};
