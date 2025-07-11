import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * グループ名を更新する
 * @param groupId 対象グループID
 * @param newName 新しいグループ名
 */
export async function updateEpisodeGroupName({
  group,
  newName,
}: {
  group: EpisodeGroup;
  newName: string;
}): Promise<void> {
  await episodeGroupRepository.updateGroupName(group.id, newName);
}
