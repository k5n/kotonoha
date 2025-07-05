import type { Settings } from '$lib/domain/entities/settings';
import { saveApiKey } from '$lib/infrastructure/repositories/apiKeyRepository';

export async function saveSettings(settings: Settings, apiKey: string): Promise<void> {
  if (apiKey) {
    await saveApiKey(apiKey);
  }
}
