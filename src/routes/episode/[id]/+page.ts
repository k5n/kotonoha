import { fetchEpisodeDetail } from '$lib/application/usecases/fetchEpisodeDetail';
import { fetchSettings } from '$lib/application/usecases/fetchSettings';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const episodeId = Number(params.id);
  if (isNaN(episodeId)) {
    return { error: '不正なエピソードIDです。' };
  }
  const result = await fetchEpisodeDetail(episodeId);
  if (!result) {
    return { error: 'エピソードが見つかりません。' };
  }
  const settings = await fetchSettings();
  return {
    episode: result.episode,
    dialogues: result.dialogues,
    sentenceCards: result.sentenceCards,
    audioBlobUrl: result.audioBlobUrl,
    settings: settings,
  };
};
