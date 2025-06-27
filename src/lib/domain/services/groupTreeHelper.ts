import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';

/**
 * 指定したグループの全ての子孫グループのIDを再帰的に検索する
 * @param allGroups 全てのグループのフラットなリスト
 * @param parentId 親となるグループID
 * @returns 子孫グループのIDの配列
 */
export function findDescendantIds(allGroups: EpisodeGroup[], parentId: number): number[] {
  const children = allGroups.filter((g) => g.parentId === parentId);
  let descendantIds: number[] = children.map((c) => c.id);
  for (const child of children) {
    descendantIds = [...descendantIds, ...findDescendantIds(allGroups, child.id)];
  }
  return descendantIds;
}
