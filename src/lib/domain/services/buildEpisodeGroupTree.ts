import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';

export function buildEpisodeGroupTree(flatGroups: EpisodeGroup[]): EpisodeGroup[] {
  // 孤立ノード（親が存在しないノード）もルート扱いにする（存在したらデータ不整合だが・・・）
  const allIds = new Set(flatGroups.map((g) => g.id));
  const isRoot = (g: EpisodeGroup) => g.parentId === null || !allIds.has(g.parentId!);

  const buildTree = (parentId: number | null): EpisodeGroup[] => {
    return flatGroups
      .filter((g) => (parentId === null ? isRoot(g) : g.parentId === parentId))
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((g) => ({
        ...g,
        children: buildTree(g.id),
      }));
  };
  return buildTree(null);
}
