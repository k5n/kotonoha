import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { buildEpisodeGroupTree } from '$lib/domain/services/buildEpisodeGroupTree';
import { findDescendantIds } from '$lib/domain/services/groupTreeHelper';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * 指定されたグループを移動する際に、親として選択可能なグループの階層リストを取得するユースケース。
 * 移動対象のグループ自身とその子孫は選択肢から除外される。
 * @param currentGroup 移動対象のグループ。nullの場合は全てのグループが選択可能。
 * @returns 親として選択可能なグループの階層リスト。
 */
export async function fetchAvailableParentGroups(
  currentGroup: EpisodeGroup | null
): Promise<readonly EpisodeGroup[]> {
  const allGroupsFlat = await episodeGroupRepository.getAllGroups();
  const folderGroupsFlat = allGroupsFlat.filter((group) => group.groupType === 'folder');

  if (!currentGroup) {
    // currentGroupがnullの場合（新規作成時など）、全てのグループが選択可能
    return buildEpisodeGroupTree(folderGroupsFlat);
  }

  // 移動対象のグループ自身と、その子孫のIDを特定
  const excludedIds = [currentGroup.id, ...findDescendantIds(folderGroupsFlat, currentGroup.id)];

  // 除外対象のグループを除いたリストを作成
  const availableGroupsFlat = folderGroupsFlat.filter((group) => !excludedIds.includes(group.id));

  // 階層構造に変換して返す
  return buildEpisodeGroupTree(availableGroupsFlat);
}
