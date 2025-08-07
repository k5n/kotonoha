import { i18nStore } from '$lib/application/stores/i18n.svelte';
import type { Settings } from '$lib/domain/entities/settings';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';

export async function saveSettings(
  settings: Omit<Settings, 'isApiKeySet'>,
  apiKey: string
): Promise<void> {
  if (apiKey) {
    await apiKeyRepository.saveApiKey(apiKey);
  }
  i18nStore.changeLanguage(settings.language);
  await settingsRepository.saveSettings(settings);
}
