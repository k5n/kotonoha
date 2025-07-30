import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { groupTreeHelper } from '$lib/domain/services/groupTreeHelper';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { deleteEpisode } from './deleteEpisode';

/**
 * グループを、そのすべての子孫グループと含まれるエピソードと共に再帰的に削除します。
 * @param group 削除する起点となるグループ
 */
export async function deleteGroupRecursive(group: EpisodeGroup): Promise<void> {
  // 1. すべてのグループ情報を取得
  const allGroups = await episodeGroupRepository.getAllGroups();

  // 2. 削除対象のグループ自身とすべての子孫グループのIDリストを取得
  const descendantIds = groupTreeHelper.findDescendantIds(group.id, allGroups);
  const groupIdsToDelete = [group.id, ...descendantIds];

  // 3. 削除対象となるすべてのエピソードの基本情報を取得
  const episodesToDelete = await episodeRepository.getPartialEpisodesByGroupIds(groupIdsToDelete);

  // 4. 取得した各エピソードを削除
  // Promise.allで並列処理
  await Promise.all(episodesToDelete.map((episode) => deleteEpisode(episode)));

  // 5. 対象のグループ（自身と子孫）を一括で削除
  await episodeGroupRepository.deleteGroups(groupIdsToDelete);
}
