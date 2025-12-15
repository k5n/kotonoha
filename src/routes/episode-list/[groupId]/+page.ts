import { fetchEpisodes } from '$lib/application/usecases/fetchEpisodes';
import type { Episode } from '$lib/domain/entities/episode';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  try {
    const groupId = params.groupId;
    const [episodeGroup, episodes] = await fetchEpisodes(groupId);
    return { episodeGroup, episodes, errorKey: null, groupId: params.groupId };
  } catch (e) {
    console.error(`Failed to fetch episode list for group ${params.groupId}: ${e}`);
    return {
      errorKey: 'episodeListPage.errors.fetchEpisodes',
      groupId: params.groupId,
      episodeGroup: null,
      episodes: [] as readonly Episode[],
    };
  }
};
