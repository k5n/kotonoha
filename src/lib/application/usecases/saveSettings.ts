import type { Settings } from '$lib/domain/entities/settings';
import { saveApiKey } from '$lib/infrastructure/repositories/apiKeyRepository';

export async function saveSettings(settings: Settings): Promise<void> {
  if (settings.geminiApiKey) {
    await saveApiKey(settings.geminiApiKey);
  }
}
