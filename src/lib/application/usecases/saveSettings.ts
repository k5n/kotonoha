import { i18nStore } from '$lib/application/stores/i18n.svelte';
import type { Settings } from '$lib/domain/entities/settings';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';

export async function saveSettings(
  settings: Settings,
  geminiApiKey: string,
  youtubeApiKey: string
): Promise<void> {
  if (geminiApiKey) {
    await apiKeyRepository.saveGeminiApiKey(geminiApiKey);
  }
  if (youtubeApiKey) {
    await apiKeyRepository.saveYoutubeApiKey(youtubeApiKey);
  }
  i18nStore.changeLanguage(settings.language);
  await settingsRepository.saveSettings(settings);
}
