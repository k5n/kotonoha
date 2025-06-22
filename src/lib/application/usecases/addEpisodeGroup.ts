import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * 新しいエピソードグループを追加するユースケース
 * @param params グループ名・親ID・種別・兄弟グループ一覧
 * @returns 更新されたエピソードグループツリー
 */
export async function addEpisodeGroup(params: {
  name: string;
  parentId: number | null;
  groupType: 'album' | 'folder';
  siblings: readonly EpisodeGroup[];
}): Promise<EpisodeGroup[]> {
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

  // 追加後のグループ一覧を取得（現在表示中のグループの子供一覧）
  const children = await episodeGroupRepository.getGroups(parentId);
  return children;
}
