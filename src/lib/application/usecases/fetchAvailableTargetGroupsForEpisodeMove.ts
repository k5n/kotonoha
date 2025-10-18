import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * Fetches all album groups except the current episode's group, for episode move targets.
 * @param currentEpisodeGroupId The ID of the current episode's group to exclude.
 * @returns A promise that resolves to an array of available target groups.
 */
export async function fetchAvailableTargetGroupsForEpisodeMove(
  currentEpisodeGroupId: number
): Promise<readonly EpisodeGroup[]> {
  const albumGroups = await episodeGroupRepository.findAlbumGroups();
  return albumGroups.filter((group) => group.id !== currentEpisodeGroupId);
}
