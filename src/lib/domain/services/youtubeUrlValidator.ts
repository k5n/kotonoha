/**
 * YouTube URL format validation service
 */
export function isValidYoutubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return false;
  }

  // YouTube URL patterns
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  return youtubeRegex.test(trimmedUrl);
}

/**
 * Extract video ID from YouTube URL
 */
export function extractYoutubeVideoId(url: string): string | null {
  if (!isValidYoutubeUrl(url)) {
    return null;
  }

  const trimmedUrl = url.trim();

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmedUrl.match(/[?&]v=([^&#]+)/);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  // youtu.be/VIDEO_ID
  const shortMatch = trimmedUrl.match(/youtu\.be\/([^?&#]+)/);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }

  // youtube.com/embed/VIDEO_ID
  const embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([^?&#]+)/);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }

  return null;
}
