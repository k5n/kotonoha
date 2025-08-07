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
    const settings = await fetchSettings();
    return {
      episode: result.episode,
      dialogues: result.dialogues,
      sentenceCards: result.sentenceCards,
      audioBlobUrl: result.audioBlobUrl,
      settings: settings,
      errorKey: null,
    };
  } catch (e) {
    error(`Failed to fetch episode detail or settings: ${e}`);
    return { errorKey: 'episodeDetailPage.errors.fetchDetail' };
  }
};
