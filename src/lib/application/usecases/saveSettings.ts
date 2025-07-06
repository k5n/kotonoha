import type { Settings } from '$lib/domain/entities/settings';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';

export async function saveSettings(settings: Settings, apiKey: string): Promise<void> {
  if (apiKey) {
    await apiKeyRepository.saveApiKey(apiKey);
  }
}
