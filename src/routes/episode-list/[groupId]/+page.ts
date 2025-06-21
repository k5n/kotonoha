import { fetchEpisodes } from '$lib/application/usecases/fetchEpisodes';
import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const mockPath: EpisodeGroup[] = [
    { id: 1, name: 'Default', displayOrder: 0, parentId: null, groupType: 'album', children: [] },
  ];
  try {
    const groupId = parseInt(params.groupId, 10);
    const [episodeGroup, episodes] = await fetchEpisodes(groupId);
    return { episodeGroup, episodes, error: null, groupId: params.groupId, path: mockPath };
  } catch (e) {
    return {
      error: 'エピソード一覧の取得に失敗しました',
      groupId: params.groupId,
      episodeGroup: null,
      episodes: [],
      path: mockPath,
    };
  }
};
