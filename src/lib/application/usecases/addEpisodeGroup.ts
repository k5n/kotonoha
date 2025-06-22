import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
import { episodeGroupRepository } from '$lib/infrastructure/repositories/episodeGroupRepository';

/**
 * 新しいエピソードグループを追加するユースケース
 * @param params グループ名・親ID・種別・表示順
 * @returns 追加されたEpisodeGroup
 */
export async function addEpisodeGroup(params: {
  name: string;
  parentId: number | null;
  groupType: 'album' | 'folder';
  displayOrder: number;
}): Promise<EpisodeGroup> {
  const { name, parentId, groupType, displayOrder } = params;

  // バリデーション。画面側で保証すべきだが、念のためチェック。
  if (!name.trim()) {
    throw new Error('グループ名を入力してください');
  }
  if (groupType !== 'album' && groupType !== 'folder') {
    throw new Error('グループ種別が不正です');
  }
  // 親グループがalbum型の場合は追加不可だが、バリデーションは省略。画面側で保証する。

  // 追加
  return await episodeGroupRepository.addGroup({
    name,
    parentId,
    groupType,
    displayOrder,
  });
}
