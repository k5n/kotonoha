import { buildEpisodeGroupTree } from '$lib/domain/services/buildEpisodeGroupTree';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * Fetches all episode groups that can contain episodes (i.e., type 'album')
 * and builds a tree structure.
 * @returns A promise that resolves to an array of album groups in a tree structure.
 */
export async function fetchAlbumGroups() {
  const albumGroups = await episodeGroupRepository.findAlbumGroups();
  return buildEpisodeGroupTree(albumGroups);
}
