import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import { type YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
import { extractYoutubeVideoId, isValidYoutubeUrl } from '$lib/domain/services/youtubeUrlValidator';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';
import { youtubeRepository } from '$lib/infrastructure/repositories/youtubeRepository';
import { error } from '@tauri-apps/plugin-log';

class YoutubeApiKeyNotSet extends Error {
  constructor() {
    super('YouTube Data API key is not set');
  }
}

class InvalidYoutubeURL extends Error {
  constructor() {
    super('Invalid YouTube URL');
  }
}

async function ensureApiKey(): Promise<string> {
  const apiKey = apiKeyStore.youtube.value;
  if (apiKey !== null) {
    return apiKey;
  }
  const storedApiKey = await apiKeyRepository.getYoutubeApiKey();
  if (storedApiKey !== null) {
    apiKeyStore.youtube.set(storedApiKey);
    return storedApiKey;
  }
  throw new YoutubeApiKeyNotSet();
}

export async function fetchYoutubeMetadata(url: string): Promise<YoutubeMetadata> {
  const youtubeDataApiKey = await ensureApiKey();

  if (!isValidYoutubeUrl(url)) {
    throw new InvalidYoutubeURL();
  }

  const videoId = extractYoutubeVideoId(url);
  if (videoId === null) {
    error(`Failed to get videoId: ${url}`);
    throw new InvalidYoutubeURL();
  }

  const metadata = await youtubeRepository.fetchYoutubeMetadata(youtubeDataApiKey, videoId);
  return metadata;
}
