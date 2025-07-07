import type { Settings } from '$lib/domain/entities/settings';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';

export async function fetchSettings(): Promise<Settings> {
  const apiKey = await apiKeyRepository.getApiKey();
  return {
    isApiKeySet: apiKey !== null,
  };
}
