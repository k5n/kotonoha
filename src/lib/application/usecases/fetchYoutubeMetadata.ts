import { isValidYoutubeUrl, normalizeYoutubeUrl } from '$lib/domain/services/youtubeUrlValidator';
import {
  youtubeRepository,
  type YoutubeMetadata,
} from '$lib/infrastructure/repositories/youtubeRepository';

/**
 * Fetch YouTube video metadata
 */
export async function fetchYoutubeMetadata(url: string): Promise<YoutubeMetadata | null> {
  if (!isValidYoutubeUrl(url)) {
    throw new Error('Invalid YouTube URL');
  }

  // Normalize embed/short URLs to a canonical watch URL so YouTube oEmbed responds with metadata
  const normalized = normalizeYoutubeUrl(url);
  if (!normalized) {
    throw new Error('Unable to normalize YouTube URL');
  }

  try {
    return await youtubeRepository.fetchMetadata(normalized);
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error);
    return null;
  }
}
