import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { buildEpisodeGroupTree } from '$lib/domain/services/buildEpisodeGroupTree';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * グループ名を更新し、全グループ一覧を返すユースケース
 * @param groupId 対象グループID
 * @param newName 新しいグループ名
 * @returns 更新後の全EpisodeGroup配列
 */
export async function updateEpisodeGroupName({
  groupId,
  newName,
}: {
  groupId: number;
  newName: string;
}): Promise<readonly EpisodeGroup[]> {
  await episodeGroupRepository.updateGroup(groupId, newName);

  // DB更新後、全グループを再取得
  const flatGroups = await episodeGroupRepository.getAllGroups();
  return buildEpisodeGroupTree(flatGroups);
}
