import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

export async function fetchEpisodeGroups(
  parentId: string | null
): Promise<readonly EpisodeGroup[]> {
  const rootEpisodes = await episodeGroupRepository.getGroups(parentId);
  return rootEpisodes;
}
