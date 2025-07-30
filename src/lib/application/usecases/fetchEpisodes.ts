import type { Episode } from '$lib/domain/entities/episode';
import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { info } from '@tauri-apps/plugin-log';

export async function fetchEpisodes(groupId: number): Promise<[EpisodeGroup, readonly Episode[]]> {
  info(`Fetching episodes for group ${groupId}...`);
  const episodeGroup = await episodeGroupRepository.getGroupById(groupId);
  if (!episodeGroup) {
    throw new Error(`Episode group with ID ${groupId} not found`);
  }
  const episodes = await episodeRepository.getEpisodesWithCardCountByGroupId(groupId);
  return [episodeGroup, episodes];
}
