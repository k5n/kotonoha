import { fetchEpisodes } from '$lib/application/usecases/fetchEpisodes';
import type { Episode } from '$lib/domain/entities/episode';
import { error } from '@tauri-apps/plugin-log';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  try {
    const groupId = parseInt(params.groupId, 10);
    const [episodeGroup, episodes] = await fetchEpisodes(groupId);
    return { episodeGroup, episodes, error: null, groupId: params.groupId };
  } catch (e) {
    error(`Failed to fetch episode list for group ${params.groupId}: ${e}`);
    return {
      error: 'エピソード一覧の取得に失敗しました',
      groupId: params.groupId,
      episodeGroup: null,
      episodes: [] as readonly Episode[],
    };
  }
};
