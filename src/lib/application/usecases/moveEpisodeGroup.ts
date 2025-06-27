import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { findDescendantIds } from '$lib/domain/services/groupTreeHelper';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * エピソードグループを別のグループに移動する
 * @param groupId 移動するグループのID
 * @param newParentId 新しい親グループのID (nullの場合はルート)
 * @throws Error 移動できない場合 (自分自身または子孫への移動)
 */
export async function moveEpisodeGroup({
  group,
  newParentId,
}: {
  group: EpisodeGroup;
  newParentId: number | null;
}): Promise<readonly EpisodeGroup[]> {
  // 移動先が自分自身の場合、エラー
  if (group.id === newParentId) {
    throw new Error('A group cannot be moved into itself.');
  }

  // 移動先が自分の子孫でないことを確認 (循環参照の防止)
  if (newParentId !== null) {
    const allGroups = await episodeGroupRepository.getAllGroups();
    const descendantIds = findDescendantIds(allGroups, group.id);
    if (descendantIds.includes(newParentId)) {
      throw new Error('A group cannot be moved into its own descendant.');
    }
  }

  // リポジトリを呼び出して親IDを更新
  await episodeGroupRepository.updateGroupParent(group.id, newParentId);

  // DB更新後、グループ一覧を取得（現在表示中のグループの子供一覧）
  const children = await episodeGroupRepository.getGroups(group.parentId);
  return children;
}
