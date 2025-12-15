import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';

/**
 * Moves an episode to a different group.
 * @param episodeId The ID of the episode to move.
 * @param targetGroupId The ID of the destination group.
 */
export function moveEpisode(episodeId: number, targetGroupId: string) {
  return episodeRepository.updateGroupId(episodeId, targetGroupId);
}
