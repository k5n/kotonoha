import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import type { Settings } from '$lib/domain/entities/settings';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';
import { settingsRepository } from '$lib/infrastructure/repositories/settingsRepository';

export async function fetchSettings(): Promise<{
  isGeminiApiKeySet: boolean;
  isYoutubeApiKeySet: boolean;
  settings: Settings;
}> {
  const currentSettings = await settingsRepository.getSettings();

  if (apiKeyStore.gemini.value === null) {
    const apiKey = await apiKeyRepository.getGeminiApiKey();
    if (apiKey !== null) {
      apiKeyStore.gemini.set(apiKey);
    }
  }

  if (apiKeyStore.youtube.value === null) {
    const apiKey = await apiKeyRepository.getYoutubeApiKey();
    if (apiKey !== null) {
      apiKeyStore.youtube.set(apiKey);
    }
  }

  return {
    isGeminiApiKeySet: apiKeyStore.gemini.value !== null,
    isYoutubeApiKeySet: apiKeyStore.youtube.value !== null,
    settings: currentSettings,
  };
}
