import { i18nStore } from '../../application/stores/i18n.svelte';
import { settingsRepository } from '../../infrastructure/repositories/settingsRepository';

export async function initializeApplication(): Promise<void> {
  if (i18nStore.initialized) {
    return;
  }
  const settings = await settingsRepository.getSettings();
  i18nStore.init(settings.language);
}
