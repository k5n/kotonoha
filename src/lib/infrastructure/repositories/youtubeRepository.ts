import { fetch } from '@tauri-apps/plugin-http';

export type YoutubeMetadata = {
  readonly title?: string;
  readonly author_name?: string;
  readonly author_url?: string;
  readonly thumbnail_url?: string;
};

/**
 * YouTube repository for fetching metadata via oEmbed API
 */
export const youtubeRepository = {
  /**
   * Fetch YouTube video metadata using oEmbed API
   */
  async fetchMetadata(url: string): Promise<YoutubeMetadata> {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube metadata: ${response.status}`);
    }

    const data = await response.json();
    return data as YoutubeMetadata;
  },
};
