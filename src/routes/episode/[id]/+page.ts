import { fetchEpisodeDetail } from '$lib/application/usecases/fetchEpisodeDetail';
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
  return {
    episode: result.episode,
    dialogues: result.dialogues,
    sentenceCards: result.sentenceCards,
  };
};
