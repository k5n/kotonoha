import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';

// Mutableな構造体（DB取得時用）
type MutableGroup = {
  id: number;
  name: string;
  displayOrder: number;
  parentId: number | null;
  groupType: 'album' | 'folder';
  children: MutableGroup[];
};

// MutableGroup[] を readonly EpisodeGroup[] のツリーに変換
function toReadonlyGroup(group: MutableGroup): EpisodeGroup {
  return {
    id: group.id,
    name: group.name,
    displayOrder: group.displayOrder,
    parentId: group.parentId,
    groupType: group.groupType,
    children: group.children.map(toReadonlyGroup),
  };
}

export function buildEpisodeGroupTree(flatGroups: EpisodeGroup[]): EpisodeGroup[] {
  // MutableGroupに変換
  const mutableGroups: MutableGroup[] = flatGroups.map((g) => ({ ...g, children: [] }));
  const groupMap = new Map<number, MutableGroup>();
  const roots: MutableGroup[] = [];

  mutableGroups.forEach((group) => {
    groupMap.set(group.id, group);
  });

  mutableGroups.forEach((group) => {
    if (group.parentId !== null && groupMap.has(group.parentId)) {
      groupMap.get(group.parentId)!.children.push(group);
    } else {
      roots.push(group);
    }
  });

  // displayOrder順にソート
  const sortGroups = (groups: MutableGroup[]) => {
    groups.sort((a, b) => a.displayOrder - b.displayOrder);
    groups.forEach((g) => sortGroups(g.children));
  };
  sortGroups(roots);

  return roots.map(toReadonlyGroup);
}
