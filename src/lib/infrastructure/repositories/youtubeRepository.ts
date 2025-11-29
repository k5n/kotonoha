import { type AtomicDialogue } from '$lib/domain/entities/dialogue';
import { type YoutubeMetadata } from '$lib/domain/entities/youtubeMetadata';
import { invoke } from '@tauri-apps/api/core';
import { fetch } from '@tauri-apps/plugin-http';

type YoutubeOEmbedData = {
  readonly title?: string;
  readonly author_name?: string;
  readonly author_url?: string;
  readonly thumbnail_url?: string;
};

export type YoutubeSubtitleMetadata = {
  readonly language: string;
  readonly trackKind: string;
};

async function fetchTitle(url: string): Promise<string> {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

  const response = await fetch(oembedUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube metadata: ${response.status}`);
  }

  const data = await response.json();
  return (data as YoutubeOEmbedData).title || '';
}

async function getDefaultSubtitleLanguage(
  apiKey: string,
  videoId: string
): Promise<YoutubeSubtitleMetadata> {
  const url = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to fetch captions: ${res.status}`);
    throw new Error(`Failed to fetch captions: ${res.status}`);
  }

  const data = (await res.json()) as {
    items: readonly { snippet: { language: string; trackKind: string } }[];
  };
  if (data.items.length === 0) {
    console.error(`No captions found for this video: ${videoId}`);
    throw new Error(`No captions found for this video: ${videoId}`);
  }

  const language = data.items[0].snippet.language;
  const trackKind = data.items[0].snippet.trackKind;

  return { language, trackKind };
}

export const youtubeRepository = {
  async fetchYoutubeMetadata(apiKey: string, videoId: string): Promise<YoutubeMetadata> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const title = await fetchTitle(url);
    const { language, trackKind } = await getDefaultSubtitleLanguage(apiKey, videoId);
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return {
      title,
      embedUrl,
      language,
      trackKind,
    };
  },

  async fetchSubtitle({
    videoId,
    trackKind,
    language,
  }: {
    readonly videoId: string;
    readonly trackKind: string;
    readonly language: string;
  }): Promise<readonly AtomicDialogue[]> {
    try {
      const result = await invoke<AtomicDialogue[]>('fetch_youtube_subtitle', {
        videoId,
        language,
        trackKind,
      });
      return result;
    } catch (err) {
      console.error(`Failed to fetch subtitles: ${err}`);
      throw new Error(`Failed to fetch subtitles: ${err}`);
    }
  },
};
