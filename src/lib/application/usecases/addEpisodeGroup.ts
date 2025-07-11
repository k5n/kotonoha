import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * 新しいエピソードグループを追加するユースケース
 * @param params グループ名・親ID・種別・兄弟グループ一覧
 */
export async function addEpisodeGroup(params: {
  name: string;
  parentId: number | null;
  groupType: 'album' | 'folder';
  siblings: readonly EpisodeGroup[];
}): Promise<void> {
  const { name, parentId, groupType, siblings } = params;

  // バリデーション
  if (!name.trim()) {
    throw new Error('グループ名を入力してください');
  }
  if (groupType !== 'album' && groupType !== 'folder') {
    throw new Error('グループ種別が不正です');
  }

  // siblings から表示順を決定
  const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((g) => g.displayOrder)) : 0;
  const displayOrder = maxOrder + 1;

  // 追加
  await episodeGroupRepository.addGroup({
    name,
    parentId,
    groupType,
    displayOrder,
  });
}
