import { fetchSettings } from '$lib/application/usecases/fetchSettings';
import { error } from '@tauri-apps/plugin-log';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  try {
    const { isApiKeySet, settings } = await fetchSettings();
    return {
      isApiKeySet,
      settings,
      error: null,
    };
  } catch (e) {
    error(`Failed to load API Key: ${e}`);
    return {
      isApiKeySet: false,
      settings: null,
      errorKey: 'settings.notifications.loadError',
    };
  }
};
