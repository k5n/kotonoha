import { analyzeAudio, openAudio } from '$lib/application/usecases/controlAudio';
import { fetchEpisodeDetail } from '$lib/application/usecases/fetchEpisodeDetail';
import { fetchSettings } from '$lib/application/usecases/fetchSettings';
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
    const { isApiKeySet, settings } = await fetchSettings();

    await openAudio(result.episode.mediaPath);
    // Function to analyze audio data asynchronously. Caching is handled by the use case.
    const audioInfoPromise = analyzeAudio(result.episode.mediaPath);

    return {
      episode: result.episode,
      dialogues: result.dialogues,
      sentenceCards: result.sentenceCards,
      isApiKeySet: isApiKeySet,
      settings: settings,
      audioInfo: audioInfoPromise,
      errorKey: null,
    };
  } catch (e) {
    error(`Failed to fetch episode detail or settings: ${e}`);
    return { errorKey: 'episodeDetailPage.errors.fetchDetail' };
  }
};
