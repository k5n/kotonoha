import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * 新しいエピソードグループを追加するユースケース
 * @param params グループ名・親ID・種別・兄弟グループ一覧
 */
export async function addEpisodeGroup(params: {
  name: string;
  parentId: string | null;
  groupType: 'album' | 'folder';
  siblings: readonly EpisodeGroup[];
}): Promise<void> {
  const { name, parentId, groupType, siblings } = params;

  if (!name.trim()) {
    throw new Error('Please enter a group name.');
  }
  if (groupType !== 'album' && groupType !== 'folder') {
    throw new Error('Invalid group type.');
  }

  const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((g) => g.displayOrder)) : 0;
  const displayOrder = maxOrder + 1;

  await episodeGroupRepository.addGroup({
    name,
    parentId,
    groupType,
    displayOrder,
  });
}
