import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * グループ名を更新し、全グループ一覧を返すユースケース
 * @param groupId 対象グループID
 * @param newName 新しいグループ名
 * @returns 更新後の全EpisodeGroup配列
 */
export async function updateEpisodeGroupName({
  group,
  newName,
}: {
  group: EpisodeGroup;
  newName: string;
}): Promise<readonly EpisodeGroup[]> {
  await episodeGroupRepository.updateGroupName(group.id, newName);

  // DB更新後、グループ一覧を取得（現在表示中のグループの子供一覧）
  const children = await episodeGroupRepository.getGroups(group.parentId);
  return children;
}
