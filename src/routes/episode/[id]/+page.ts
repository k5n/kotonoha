import { fetchEpisodeDetail } from '$lib/application/usecases/fetchEpisodeDetail';
import { fetchSettings } from '$lib/application/usecases/fetchSettings';
import { analyzeAudio, AudioPlayer } from '$lib/application/usecases/mediaPlayer/audioPlayer';
import type { MediaPlayer } from '$lib/application/usecases/mediaPlayer/mediaPlayer';
import { YoutubePlayer } from '$lib/application/usecases/mediaPlayer/youtubePlayer';
import type { AudioInfo } from '$lib/domain/entities/audioInfo';
import { error } from '@tauri-apps/plugin-log';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const episodeId = Number(params.id);
  if (isNaN(episodeId)) {
    return { errorKey: 'episodeDetailPage.errors.invalidEpisodeId' };
  }
  try {
    const result = await fetchEpisodeDetail(episodeId);
    if (!result) {
      return { errorKey: 'episodeDetailPage.errors.episodeNotFound' };
    }
    const { isGeminiApiKeySet, settings } = await fetchSettings();

    const isYoutubeEpisode = result.episode.mediaPath.startsWith('https://www.youtube.com/');
    const mediaPlayer: MediaPlayer = isYoutubeEpisode ? new YoutubePlayer() : new AudioPlayer();
    await mediaPlayer.open(result.episode.mediaPath);
    const audioInfoPromise: Promise<AudioInfo> | null = isYoutubeEpisode
      ? null
      : analyzeAudio(result.episode.mediaPath);

    return {
      episode: result.episode,
      dialogues: result.dialogues,
      sentenceCards: result.sentenceCards,
      isApiKeySet: isGeminiApiKeySet, // Use isGeminiApiKeySet for this page
      settings: settings,
      mediaPlayer: mediaPlayer,
      audioInfo: audioInfoPromise,
      errorKey: null,
    };
  } catch (e) {
    error(`Failed to fetch episode detail or settings: ${e}`);
    return { errorKey: 'episodeDetailPage.errors.fetchDetail' };
  }
};
