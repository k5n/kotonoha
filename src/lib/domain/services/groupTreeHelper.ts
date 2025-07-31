import type { EpisodeGroup } from '../entities/episodeGroup';

/**
 * 指定されたグループIDを起点として、その配下にあるすべての子孫グループのIDを再帰的に検索して返します。
 * @param startGroupId 検索を開始するグループのID
 * @param allGroups すべてのグループを含むフラットな配列
 * @returns 子孫グループのIDの配列（読み取り専用）
 */
function findDescendantIds(
  startGroupId: number,
  allGroups: readonly EpisodeGroup[]
): readonly number[] {
  // NOTE: 利用用途的に深くても１０〜２０階層程度なので、YAGNI/KISSの原則に従い、再帰的な実装でシンプルに実装。
  const children = allGroups.filter((group) => group.parentId === startGroupId);
  let descendantIds: number[] = children.map((child) => child.id);

  for (const child of children) {
    descendantIds = descendantIds.concat(findDescendantIds(child.id, allGroups));
  }

  return descendantIds;
}

export const groupTreeHelper = {
  findDescendantIds,
};
