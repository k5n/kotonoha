import { i18nStore } from '../../application/stores/i18n.svelte';
import { settingsRepository } from '../../infrastructure/repositories/settingsRepository';

let initialized = false;

export async function initializeApplication(): Promise<void> {
  if (initialized) {
    return;
  }
  const settings = await settingsRepository.getSettings();
  i18nStore.init(settings.language);
  initialized = true;
}
