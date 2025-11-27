import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import type { YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
import { extractYoutubeVideoId, isValidYoutubeUrl } from '$lib/domain/services/youtubeUrlValidator';
import { apiKeyRepository } from '$lib/infrastructure/repositories/apiKeyRepository';
import { youtubeRepository } from '$lib/infrastructure/repositories/youtubeRepository';

async function ensureApiKey(): Promise<string | null> {
  const apiKey = apiKeyStore.youtube.value;
  if (apiKey !== null) {
    return apiKey;
  }
  const storedApiKey = await apiKeyRepository.getYoutubeApiKey();
  if (storedApiKey !== null) {
    apiKeyStore.youtube.set(storedApiKey);
    return storedApiKey;
  }
  return null;
}

export class YoutubeDataApiKeyNotSetError extends Error {}
export class InvalidYoutubeUrlError extends Error {}

export async function fetchYoutubeMetadata(url: string): Promise<YoutubeMetadata> {
  const youtubeDataApiKey = await ensureApiKey();
  if (!youtubeDataApiKey) {
    console.error('YouTube Data API key is not set.');
    throw new YoutubeDataApiKeyNotSetError();
  }

  if (!isValidYoutubeUrl(url)) {
    console.error(`Invalid YouTube URL: ${url}`);
    throw new InvalidYoutubeUrlError();
  }

  const videoId = extractYoutubeVideoId(url);
  if (videoId === null) {
    console.error(`Failed to get videoId: ${url}`);
    throw new InvalidYoutubeUrlError();
  }

  const metadata = await youtubeRepository.fetchYoutubeMetadata(youtubeDataApiKey, videoId);
  return metadata;
}
