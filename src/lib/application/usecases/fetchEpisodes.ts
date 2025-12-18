import type { Episode } from '$lib/domain/entities/episode';
import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';

export async function fetchEpisodes(groupId: string): Promise<[EpisodeGroup, readonly Episode[]]> {
  console.info(`Fetching episodes for group ${groupId}...`);
  const episodeGroup = await episodeGroupRepository.getGroupById(groupId);
  if (!episodeGroup) {
    throw new Error(`Episode group with ID ${groupId} not found`);
  }
  const episodes = await episodeRepository.getEpisodesWithCardCountByGroupId(groupId);
  return [episodeGroup, episodes];
}
