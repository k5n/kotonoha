import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import type { Settings } from '$lib/domain/entities/settings';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';

export async function fetchSettings(): Promise<Settings> {
  if (apiKeyStore.value === null) {
    const apiKey = await apiKeyRepository.getApiKey();
    if (apiKey !== null) {
      apiKeyStore.set(apiKey);
    }
  }
  return {
    isApiKeySet: apiKeyStore.value !== null,
  };
}
