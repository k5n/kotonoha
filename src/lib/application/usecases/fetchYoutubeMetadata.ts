import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import { youtubeEpisodeAddStore } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
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

export async function fetchYoutubeMetadata(url: string): Promise<void> {
  if (!url.trim()) {
    youtubeEpisodeAddStore.completeMetadataFetching(null);
    return;
  }

  try {
    youtubeEpisodeAddStore.startMetadataFetching();
    const youtubeDataApiKey = await ensureApiKey();
    if (!youtubeDataApiKey) {
      youtubeEpisodeAddStore.failedMetadataFetching(
        'components.youtubeEpisodeForm.errorApiKeyNotSet'
      );
      return;
    }

    if (!isValidYoutubeUrl(url)) {
      youtubeEpisodeAddStore.failedMetadataFetching(
        'components.youtubeEpisodeForm.errorInvalidUrl'
      );
      return;
    }

    const videoId = extractYoutubeVideoId(url);
    if (videoId === null) {
      console.error(`Failed to get videoId: ${url}`);
      youtubeEpisodeAddStore.failedMetadataFetching(
        'components.youtubeEpisodeForm.errorInvalidUrl'
      );
      return;
    }

    const metadata = await youtubeRepository.fetchYoutubeMetadata(youtubeDataApiKey, videoId);
    youtubeEpisodeAddStore.completeMetadataFetching(metadata);
  } catch (err) {
    console.error(`Failed to fetch YouTube metadata: ${err}`);
    youtubeEpisodeAddStore.failedMetadataFetching('components.youtubeEpisodeForm.errorFetchFailed');
  }
}
